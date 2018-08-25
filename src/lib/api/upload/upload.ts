import {
  UploadConfig, Context, State, PartObj, EStatus,
} from './types';
import { getFile, closeFile, getPart } from '../../../utils/file';
import { sumBytes, percentOfFile, gc, getName, range, makePart, flowControl, throttle } from './utils';
import throat from './throat';
import { slicePartIntoChunks, uploadChunk, commitPart } from './intelligent';
import { getS3PartData, uploadToS3, start, complete } from './network';

/**
 * @private
 */
const MIN_CHUNK_SIZE = 32 * 1024;

export const upload = async (fileStringOrBlob, options, storeOptions, token = {}): Promise<any> => {
  const fileBlob: any = await getFile(fileStringOrBlob);
  if ((fileBlob.size !== undefined && fileBlob.size === 0) || fileBlob.length === 0) {
    return Promise.reject(new Error('file has a size of 0.'));
  }

  let customName;
  if (storeOptions.filename) {
    customName = storeOptions.filename;
  } else if (fileBlob.name === undefined) {
    // Blobs don't have names, Files do. Give a placeholder name for blobs.
    if (fileBlob.type) {
      const ext = fileBlob.type.split('/').pop();
      customName = `untitled.${ext}`;
    } else {
      customName = 'untitled';
    }
  }

  // test
  const session = {
    urls: {
      uploadApiUrl: '/',
    },
    apikey: 'keke',
    signature: 'fuck',
  };

  // Configurables
  const config: UploadConfig = {
    host: session.urls.uploadApiUrl,
    apikey: session.apikey,
    signature: session.signature,
    partSize: 6 * 1024 * 1024,
    concurrency: 3,
    progressInterval: 1000,
    retry: 10,
    retryFactor: 2,
    retryMaxTime: 15000,
    customName,
    mimetype: options.mimetype,
    store: {
      store_location: storeOptions.location,
      store_region: storeOptions.region,
      store_container: storeOptions.container,
      store_path: storeOptions.path,
      store_access: storeOptions.access,
    },
    timeout: 120000,
    ...options,
  };

  const initialState: State = {
    parts: {},
    progressTick: null,
    previousPayload: null,
    retries: {},
    status: EStatus.INIT,
  };

  const context: Context = {
    file: fileBlob,
    config,
    state: initialState,
  };

  return uploadFile(context, token);
};

/**
 *
 * @private
 * @param part
 * @param ctx
 */
const uploadPart = async (part: PartObj, ctx: Context): Promise<any> => {
  const cfg = ctx.config;
  // Intelligent flow commits a part only when all chunks have been uploaded
  if (cfg.intelligent === true || part.intelligentOverride) {
    const goChunk = flowControl(ctx, (chunk: any) => uploadChunk(chunk, ctx));
    part.chunks = slicePartIntoChunks(part, part.chunkSize);
    await Promise.all(part.chunks.map(throat(cfg.concurrency, goChunk)));
    return commitPart(part, ctx);
  }

  // Or we upload the whole part (default flow)
  const { body: s3Data } = await getS3PartData(part, ctx);
  let onProgress;
  if (cfg.onProgress) {
    /* istanbul ignore next */
    onProgress = throttle((evt: ProgressEvent) => {
      /* istanbul ignore next */
      if (evt.loaded > part.loaded) {
        part.loaded = evt.loaded;
      }
    }, cfg.progressInterval);
  }
  part.request = uploadToS3(part.buffer, s3Data, onProgress, cfg);
  return part.request;
};

/**
 * Entry point for multi-part upload flow
 *
 * @private
 * @param file    File to upload
 * @param config  Upload config
 * @param token   Control token
 */
const uploadFile = async (ctx: Context, token: any): Promise<any> => {
  const { file, state, config } = ctx;

  const startProgress = (onProgress?: any): void => {
    if (onProgress) {
      state.progressTick = setInterval(() => {
        const payload = getProgress(ctx);
        if (payload.totalPercent === 100) {
          clearInterval(state.progressTick);
        }
        onProgress(payload);
      }, config.progressInterval);
    }
  };

  const finishProgress = (onProgress?: any): void => {
    if (onProgress) {
      onProgress({
        totalBytes: file.size,
        totalPercent: 100,
      });
      clearInterval(state.progressTick);
    }
  };

  /**
   * Will pause progress tick and set state
   */
  token.pause = (): void => {
    if (state.status === EStatus.RUNNING) {
      state.status = EStatus.PAUSED;
      clearInterval(state.progressTick);
    }
  };

  /**
   * Will resume flow and start progress tick again
   */
  token.resume = (): void  => {
    if (state.status === EStatus.PAUSED) {
      state.status = EStatus.RUNNING;
      startProgress(config.onProgress);
    }
  };

  /**
   * Iterate over all parts and abort their requests
   * @private
   */
  const cancelAllRequests = (): void  => {
    const parts = Object.keys(state.parts).map(k => state.parts[k]);
    parts.forEach((part: any) => {
      if (part.request) part.request.abort();
      part.chunks.forEach((chunk: any) => {
        if (chunk.request) chunk.request.abort();
      });
      gc(part);
    });
  };

  /**
   * Set failure status, clean up
   * @private
   */
  const failAndCleanUp = (): void  => {
    cancelAllRequests();
    clearInterval(state.progressTick);
    state.status = EStatus.FAILED;
    if (file.fd) {
      closeFile(file.fd);
    }
  };

  const cancel = new Promise((_, reject) => {
    token.cancel = (): void  => {
      if (state.status === EStatus.RUNNING || state.status === EStatus.PAUSED) {
        failAndCleanUp();
        reject(new Error('Upload cancelled'));
      }
    };
  });

  const cancellable = (p: Promise<any>): Promise<any> => {
    return Promise.race([cancel, p]);
  };

  /**
   * Retries a function up to the retry limit. For intelligent ingestion it halves chunk size before retrying part
   * @private
   * @param location    A name for the function being retried
   * @param func        The function to retry
   * @param err         An Error whose message will be used if the retry limit is met.
   * @param part        Part object for FII retries (each part tracks its own chunkSize)
   * @returns           {Promise}
   */
  const retry = (location: string, func: any, err: any, part?: PartObj): Promise<any> => {
    let attempt = state.retries[location] || 0;
    const waitTime = Math.min(config.retryMaxTime, (config.retryFactor ** attempt) * 1000);
    const promise = new Promise((resolve, reject) => {
      if (attempt === config.retry
        || (err.status === 400 && err.method !== 'PUT')
        || err.status === 401
        || err.status === 403
        || err.status === 404
        || part && part.chunkSize <= MIN_CHUNK_SIZE
      ) {
        failAndCleanUp();
        return reject(err);
      }
      const exec = () => setTimeout(() => resolve(func()), waitTime);
      // FII S3 retry (resize chunk)
      if (part && (config.intelligent || part.intelligentOverride) && (
        // Browser S3 network error
        (err.method === 'PUT' && (err.crossDomain || err.status === 400 || err.timeout))
        // Node S3 network error
        || (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT')
      )) {
        part.chunkSize /= 2;
        if (config.onRetry) {
          config.onRetry({
            location,
            parts: state.parts,
            filename: getName(file, config),
            chunkSize: part.chunkSize,
            attempt: undefined,
          });
        }
        if (config.intelligent === 'fallback') {
          part.intelligentOverride = true;
        }
        return exec();
      }
      // Normal retry (with retry limit)
      attempt += 1;
      state.retries[location] = attempt;
      if (config.onRetry) {
        config.onRetry({
          location,
          parts: state.parts,
          filename: getName(file, config),
          attempt,
        });
      }
      return exec();
    });
    return cancellable(promise);
  };

  // Here we go
  state.status = EStatus.RUNNING;

  const { body: params } = await cancellable(start(ctx));
  ctx.params = params;

  const goPart = flowControl(ctx, async (partObj: PartObj) => {
    const part = await getPart(partObj, ctx);
    if (part.size === 0) {
      return Promise.reject(new Error('Upload aborted due to empty chunk.'));
    }
    const location = `upload part ${part.number + 1}`;
    state.parts[part.number] = part;
    try {
      const { headers: { etag }, status } = await uploadPart(part, ctx);
      if (status === 206) {
        const err = new Error('Intelligent part failed to commit');
        return retry(location, () => goPart(part), err, part);
      }
      part.loaded = part.size;
      gc(part);
      if (!config.intelligent && !etag) {
        return Promise.reject(new Error('Response from S3 is missing ETag header.'));
      }
      return etag;
    } catch (err) {
      return retry(location, () => goPart(part), err, part);
    }
  });

  const totalParts = Math.ceil(file.size / config.partSize);
  const allParts = range(0, totalParts).map((p: any) => makePart(p, ctx));
  const partsFlow = Promise.all(allParts.map(throat(config.concurrency, goPart)));
  startProgress(config.onProgress);
  const etags = await cancellable(partsFlow);

  const goComplete = flowControl(ctx, async () => {
    try {
      const res = await complete(etags, ctx);
      if (res.status === 202) {
        return new Promise((resolve) => {
          setTimeout(() => resolve(goComplete()), 1000);
        });
      }

      state.status = EStatus.DONE;
      finishProgress(config.onProgress);
      if (file.fd) {
        closeFile(file.fd);
      }

      if (res.body && res.body.error && res.body.error.text) {
        return Promise.reject(new Error(`File upload error: ${res.body.error.text}`));
      }

      return res.body;
    } catch (err) {
      return retry('complete', goComplete, err);
    }
  });
  return cancellable(goComplete());
};

/**
 *
 * @private
 * @param param0
 */
const getProgress = ({ config, state, file }: Context) => {
  const parts = Object.keys(state.parts).map((k: string) => state.parts[k]);
  const partsLoaded = parts.map((p: PartObj) => p.loaded);
  const chunksLoaded = parts
    .map((p: PartObj) => p.chunks)
    .reduce((a: any[], b: any[]) => a.concat(b), [])
    .map((c: any) => c.loaded)
    .filter((n: any) => n);
  let loaded = partsLoaded;
  if (config.intelligent === true) {
    loaded = chunksLoaded;
  }
  if (config.intelligent === 'fallback') {
    const partsWithoutChunks = parts
      .filter((p: PartObj) => !p.intelligentOverride)
      .map((p: PartObj) => p.loaded);
    loaded = partsWithoutChunks.concat(chunksLoaded);
  }
  const totalBytes = sumBytes(loaded);
  const totalPercent = percentOfFile(totalBytes, file);
  const payload = {
    totalBytes,
    totalPercent,
  };
  const prev = state.previousPayload || {};
  /* istanbul ignore next */
  if (totalPercent < prev.totalPercent) {
    payload.totalBytes = prev.totalBytes;
    payload.totalPercent = prev.totalPercent;
  }
  state.previousPayload = payload;
  return payload;
};

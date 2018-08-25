import { PartObj, Context } from './types';
import { getMD5 } from '../../../utils/md5';
import { throttle } from './utils';
import { getHost, getLocationURL, getFormData, uploadToS3, getS3PartData } from './network';
import { requestWithSource } from '../request';

/**
 * Slice a part into smaller chunks
 * @private
 * @param part  Part buffer to slice.
 * @param size  Size of slices.
 * @returns     List of chunks.
 */
export const slicePartIntoChunks = (part: PartObj, size: number): any[] => {
  let offset = 0;
  const chunks: any[] = [];
  while (offset < part.size) {
    const end = Math.min(offset + size, part.size);
    const buf = part.buffer.slice(offset, end);
    const chunk = {
      buffer: buf,
      offset,
      size: buf.byteLength,
      number: part.number,
      md5: getMD5(buf, null),
    };
    chunks.push(chunk);
    offset += size;
  }
  return chunks;
};

  /**
   * Get chunk (of part) metadata and PUT chunk to S3
   * @private
   * @param chunk Chunk object, has offset information
   * @param startParams Parameters returned from start call
   * @param config Upload config
   * @returns {Promise}
   */
export const uploadChunk = async (chunk: any, ctx: Context): Promise<any> => {
  const { body: s3Data } = await getS3PartData(chunk, ctx);
  let onProgress;
  if (ctx.config.onProgress) {
      /* istanbul ignore next */
    onProgress = throttle((evt: ProgressEvent) => {
        /* istanbul ignore next */
      if (evt.loaded > chunk.loaded) {
        chunk.loaded = evt.loaded;
      }
    }, ctx.config.progressInterval);
  }
  chunk.request = uploadToS3(chunk.buffer, s3Data, onProgress, ctx.config);
  await chunk.request;
  chunk.loaded = chunk.size;
  return chunk.request;
};

  /**
   * Commits single part (/commit) for intelligent ingestion (only called after all chunks have been uploaded)
   * @private
   * @param file        File being uploaded
   * @param part        Part object
   * @param startParams Parameters returned from start call
   * @param config      Upload config
   * @returns {Promise}
   */
export const commitPart = (part: PartObj, ctx: Context): Promise<any> => {
  const cfg = ctx.config;
    /* istanbul ignore next */
  const host = getHost(cfg.host) || getLocationURL(ctx.params.location_url);
  const fields = {
    apikey: cfg.apikey,
    part: part.number + 1,
    size: ctx.file.size,
    ...ctx.params,
  };
  const formData = getFormData(fields, cfg);
  return requestWithSource('post', `${host}/multipart/commit`)
      .timeout(cfg.timeout)
      .field(formData);
};

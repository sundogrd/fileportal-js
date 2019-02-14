import { getName } from './utils';
import { UploadConfig, PartObj, Context } from './types';
import { requestWithSource, request } from '../request';

/**
 * @private
 */
/* istanbul ignore next */
export const getHost = (host?: string) => {
  return process.env.TEST_ENV === 'unit' && host;
};

  /**
   * @private
   */
  /* istanbul ignore next */
export const getLocationURL = (url: string) => {
  return url && `https://${url}`;
};

/**
 * Convert array of Etags into format for /multipart/complete call
 * @private
 * @param etags     Array of Etag strings
 */
const formatETags = (etags: any): string => etags.map((tag: string, idx: number) => `${idx + 1}:${tag}`).join(';');

  /**
   * Generates multi-part fields for all requests
   * @private
   * @param fields  Object containing form data keys
   * @param config  Upload config
   */
export const getFormData = (fields: any = {}, { store = {} }: UploadConfig): {} => {
  const fd: any = {};
  Object.keys(fields).forEach((key: string) => {
    if (fields[key]) {
      fd[key] = fields[key];
    }
  });
  Object.keys(store).forEach((key: string) => {
    if (store[key]) {
      fd[key] = store[key];
    }
  });
  return fd;
};

/**
 * Starts the multi-part upload flow (/multipart/start)
 * @private
 * @param file    Valid File instance
 * @param config  Upload config
 * @returns {Promise}
 */
export const start = ({ config, file }: Context): Promise<any> => {
  const fields: any = {
    apikey: config.apikey,
    filename: getName(file, config),
    mimetype: config.mimetype || file.type || 'application/octet-stream',
    size: file.size,
  };
    // Security
  if (config.policy && config.signature) {
    fields.policy = config.policy;
    fields.signature = config.signature;
  }
    // Intelligent Ingestion
  if (config.intelligent) {
    fields.multipart = true;
  }
  const formData = getFormData(fields, config);
  return requestWithSource('post', `${config.host}/multipart/start`)
      .timeout(config.timeout)
      .field(formData);
};

export const directUpload = (part: any, { config, params }: Context): Promise<any> => {
  const host = config.host;
  const fields = {
    // part: part.number + 1,
    size: part.size,
    md5: part.md5,
    file: part.file,
    buffer: part.buffer,
    ext: part.ext,
    ...params,
  };

  // // Intelligent Ingestion
  // if (part.offset !== undefined) {
  //   fields.multipart = true;
  //   fields.offset = part.offset === 0 ? '0' : part.offset;
  // }
  const formData = getFormData(fields, config);
  const req = requestWithSource('post', `${host}/multipart/upload`);

  req.timeout(config.timeout);
  req.field(formData);
  return new Promise((resolve, reject) => {
    req.end((err: Error, res: any) => {
      if (err) return reject(err);
      return resolve(res);
    });
  });
};

export const upload = (part: PartObj, { config, params }: Context): Promise<any> => {
  const host = 'http://127.0.0.1:8898';
  const fields = {
    // part: part.number + 1,
    size: part.size,
    md5: part.md5,
    buffer: part.buffer,
    ...params,
  };

  // // Intelligent Ingestion
  // if (part.offset !== undefined) {
  //   fields.multipart = true;
  //   fields.offset = part.offset === 0 ? '0' : part.offset;
  // }
  const formData = getFormData(fields, config);
  const req = requestWithSource('post', `${host}/multipart/upload`);

  req.timeout(config.timeout);
  req.field(formData);
  return new Promise((resolve, reject) => {
    req.end((err: Error, res: any) => {
      if (err) return reject(err);
      return resolve(res);
    });
  });
};

/**
 * Completes upload flow (/multipart/complete)
 * @private
 * @param file          File being uploaded
 * @param etags         An array of etags from each S3 part
 * @param startParams   Parameters returned from start call
 * @param config        Upload config
 */
export const complete = (etags: string, { config, file, params }: Context): Promise<any> => {
    /* istanbul ignore next */
  const host = getHost(config.host) || getLocationURL(params.location_url);
  const locationRegion = params.location_region;
  const fields = {
    apikey: config.apikey,
    size: file.size,
    filename: getName(file, config),
    mimetype: config.mimetype || file.type || 'application/octet-stream',
    parts: formatETags(etags),
    ...params,
  };
    // Intelligent Ingestion
  if (config.intelligent) {
    fields.multipart = true;
    delete fields.parts;
  }
  const formData = getFormData(fields, config);
  const req = requestWithSource('post', `${host}/multipart/complete`);
    /* istanbul ignore next */
  if (locationRegion) {
    req.set('Filestack-Upload-Region', locationRegion);
  }
  req.timeout(config.timeout);
  return req.field(formData);
};

/**
 * Gets the S3 upload params for current part (/multipart/upload)
 * @private
 * @param startParams   Parameters returned from start call
 * @param partNumber    Current part number (1 - 10000)
 * @param size          Size of current part in bytes
 * @param md5           MD5 hash of part
 * @param config        Upload config
 * @param offset        Current offset if chunking a part.
 */
export const getS3PartData = (part: PartObj, { config, params }: Context): Promise<any> => {
  /* istanbul ignore next */
  const host = getHost(config.host) || getLocationURL(params.location_url);
  const locationRegion = params.location_region;

  const fields = {
    apikey: config.apikey,
    part: part.number + 1,
    size: part.size,
    md5: part.md5,
    ...params,
  };

  // Intelligent Ingestion
  if (part.offset !== undefined) {
    fields.multipart = true;
    fields.offset = part.offset === 0 ? '0' : part.offset;
  }
  const formData = getFormData(fields, config);
  const req = requestWithSource('post', `${host}/multipart/upload`);
  /* istanbul ignore next */
  if (locationRegion) {
    req.set('Filestack-Upload-Region', locationRegion);
  }
  req.timeout(config.timeout);
  req.field(formData);
  return new Promise((resolve, reject) => {
    req.end((err: Error, res: any) => {
      if (err) return reject(err);
      return resolve(res);
    });
  });
};

/**
 * Uploads bytes directly to S3 with HTTP PUT
 * @private
 * @param part        ArrayBuffer with part data
 * @param params      Params for this part returned by getS3PartData response
 * @param onProgress  A function to be called on progress event for this part
 * @param config
 */
export const uploadToS3 = (part: ArrayBuffer, params: any, onProgress: any, cfg: UploadConfig): Promise<any> => {
  /* istanbul ignore next */
  const host = getHost(`${cfg.host}/fakeS3`) || params.url;
  const timeout = cfg.timeout || (part.byteLength / 100);
  const req = request
    .put(host)
    .set(params.headers)
    .timeout(timeout)
    .send(part);
  // Don't call progress handler if user didn't specify a callback
  if (onProgress) {
    return req.on('progress', onProgress);
  }
  return req;
};

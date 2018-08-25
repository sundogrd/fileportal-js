import { Context } from 'vm';
import { getName } from './utils';
import { UploadConfig } from './types';
import { requestWithSource } from '../request';

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
export const getFormData = (fields: any, { store }: UploadConfig): {} => {
  const fd: any = {};
  Object.keys(fields).forEach((key: string) => {
    if (fields[key]) fd[key] = fields[key];
  });
  Object.keys(store).forEach((key: string) => {
    if (store[key]) fd[key] = store[key];
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

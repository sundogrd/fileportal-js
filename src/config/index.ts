import { FilePortalOptions } from '../lib/types';
// FilePortal 默认配置项
export default {
  isClient: true,
  chunkStartSize: 1 * 1024 * 1024,
  concurrency: 3,
  chunkSize: 1 * 1024 * 1024,
  debug: false,
  progressInterval: 1000,
  retryCount: 2,
  retryMaxTime: 15000,
  timeout: 120000,
  delay: 0,
  mimetype: 'application/ocet-stream',
} as FilePortalOptions;

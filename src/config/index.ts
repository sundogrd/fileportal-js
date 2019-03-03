import { FilePortalOptions } from '../lib/types';
// FilePortal 默认配置项
export default {
  isClient: true,
  chunkStartSize: 10 * 1024 * 1024,
  concurrency: 3,
  chunkSize: 10 * 1024 * 1024,
  debug: false,
  progressInterval: 100,
  retryCount: 3,
  retryMaxTime: 500,
  timeout: 5000,
  delay: 0,
  mimetype: 'application/ocet-stream',
  // host: '//127.0.0.1:9991/upload', 
  smart: true,
} as FilePortalOptions;

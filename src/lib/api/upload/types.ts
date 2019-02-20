import { AxiosInstance, AxiosResponse, AxiosError, Cancel, Canceler } from 'axios';

/**
 * @private
 */
export const enum Status {
    INIT = 'init',
    RUNNING = 'running',
    DONE = 'done',
    FAILED = 'failed',
    PAUSED = 'paused',
}

export interface RequestInstance extends AxiosInstance {
  cancelHandler?: Canceler;
}

/**
 * @private
 */
export interface FileObj extends File {
  buffer: Buffer;
  name: string;
  size: number;
  type: string;
}

export interface UploadOptions {
  host?: string;
    /**
     * Node only. Treat the file argument as a path string.
     */
  path?: boolean;
    /**
     * Set the MIME type of the uploaded file.
     */
  mimetype?: string;
    /**
     * Maximum size for file slices. Is overridden when intelligent=true. Default is `6 * 1024 * 1024` (6MB).
     */
    // partSize?: number;
    /**
     * Maximum amount of part jobs to run concurrently. Default is 3.
     */
    // concurrency?: number;
    /**
     * Callback for progress events.
     */
  onProgress?: (evt: FSProgressEvent) => void;
    /**
     * How often to report progress. Default is 1000 (in milliseconds).
     */
  progressInterval?: number;
    /**
     * Callback for retry events.
     */
    // onRetry?: (evt: FSRetryEvent) => void;
    /**
     * Retry limit. Default is 10.
     */
  retryCount?: number; // Retry limit
    /**
     * Factor for exponential backoff on server errors. Default is 2.
     */
  // retryFactor?: number;
    /**
     * Upper bound for exponential backoff. Default is 15000.
     */
  retryMaxTime?: number;
    /**
     * Timeout for network requests. Default is 120000.
     */
  timeout?: number;
    /**
     * Enable/disable intelligent ingestion.
     * If truthy then intelligent ingestion must be enabled in your Filestack application.
     * Passing true/false toggles the global intelligent flow (all parts are chunked and committed).
     * Passing `'fallback'` will only use FII when network conditions may require it (only failing parts will be chunked).
     */
  // intelligent?: boolean | string;
    /**
     * Set the default intiial chunk size for Intelligent Ingestion. Defaults to 8MB on desktop and 1MB on mobile.
     */
  // intelligentChunkSize?: number;
}
export interface FSProgressEvent {
  totalPercent: number;
  totalBytes: number;
}

export interface FSRetryEvent {
  location: string;
    // parts: PartsMap;
  filename: string;
  attempt: number | undefined;
  chunkSize?: number;
}

export interface UploadConfig extends UploadOptions {
  apikey: string;
  // policy?: string;
  // signature?: string;
  partSize?: number;
  name?: string;
  delay?: number;
  chunk?: ChunkObj;
}

export interface ChunkObj {
  chunkIndex: number;
  totalChunks: number;
  size: number;
  type: string;
  file: string;
}

/**
 * @private
 */
export interface State {
    // progressTick: any;
    // previousPayload: any;
  status: Status;
    // retries: any;
    // parts: PartsMap;
}

/**
 * 状态模式Context，保存一个上传Task的上下文
 * @private
 */
export interface Context {
  config: UploadConfig;
  state: State;
  file: FileObj;
  params?: any;
}

export interface PartObj {
  buffer: any;
  chunks: any[];
  chunkSize: number;
  intelligentOverride: boolean;
  loaded: number;
  number: number;
  request: any;
  size: number;
  md5?: string;
  offset?: number;
}

export interface PartsMap {
  [part: string]: PartObj;
}

export interface UploadEvent {
  success: (res?: AxiosResponse) => any;
  error: (err?: AxiosError) => any;
}

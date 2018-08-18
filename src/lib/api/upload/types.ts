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

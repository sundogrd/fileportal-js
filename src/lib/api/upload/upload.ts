import {
  Status,
} from './types';

/**
 * @private
 */
const MIN_CHUNK_SIZE = 32 * 1024;

/**
 * @private
 */
const statuses = {
  INIT: Status.INIT,
  RUNNING: Status.RUNNING,
  DONE: Status.DONE,
  FAILED: Status.FAILED,
  PAUSED: Status.PAUSED,
};

export const upload = (): Promise<any> => {
  return Promise.resolve()
};

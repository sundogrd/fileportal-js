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

/**
 * Returns a Promise based on the flow state
 * If the flow is paused it will return a Promise that resolves when resumed
 * If the flow failed it will resolve harmlessly
 *
 * @private
 * @param func  function that returns a Promise
 */
const flowControl = (ctx: Context, func: any) => {
  return (...args: any[]) => {
    if (ctx.state.status === statuses.FAILED) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const check = () => {
        if (ctx.state.status === statuses.PAUSED) {
          setTimeout(() => check(), 100);
        } else {
          resolve(func(...args));
        }
      };
      check();
    });
  };
};

export const upload = (): Promise<any> => {
  return Promise.resolve();
};

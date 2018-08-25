import { PartObj, FileObj, Context, EStatus } from './types';
import * as bowser from 'bowser';

/**
 * Clean up array buffers in memory
 * Because promises aren't streams
 * @private
 */
export const gc = (part: PartObj) => {
  part.buffer = undefined;
  part.request = undefined;
  if (part.chunks && part.chunks.length) {
    part.chunks.forEach(gc);
  }
};

/**
 * Helpers to calculate total progress of file upload in bytes and percent
 * @private
 */
export const sumBytes = (bytes: number[]) => bytes.reduce((a, b) => a + b, 0);

/**
 *
 * @private
 * @param bytes
 * @param file
 */
export const percentOfFile = (bytes: number, file: FileObj) => Math.round((bytes / file.size) * 100);

/**
 * This is a noop in browsers
 */
export const closeFile = () => undefined;

/**
 *
 * @private
 * @param file
 * @param cfg
 */
export const getName = (file: any, cfg: any) => cfg.customName || file.name;

/**
 *
 * @private
 * @param fn
 * @param interval
 * @param callFirst
 */
export const throttle = function throttle(fn: any, interval: number, callFirst?: boolean) {
  let wait = false;
  let callNow = false;
  /* istanbul ignore next */
  return function (this: any, ...args: any[]) {
    callNow = !!callFirst && !wait;
    const context = this;
    if (!wait) {
      wait = true;
      setTimeout(function () {
        wait = false;
        if (!callFirst) {
          return fn.apply(context, args);
        }
      }, interval);
    }
    if (callNow) {
      callNow = false;
      return fn.apply(this, arguments);
    }
  };
};

/**
 *
 * @private
 * @param start
 * @param stop
 * @param step
 */
export const range = (start: number, stop: number, step: number = 1) => {
  const toReturn: any[] = [];
  for (; start < stop; start += step) {
    toReturn.push(start);
  }
  return toReturn;
};

/**
 *
 * @private
 * @param num
 * @param ctx
 */
export const makePart = (num: number, ctx: Context): PartObj => {
  return {
    buffer: null,
    chunks: [],
    chunkSize: ctx.config.intelligentChunkSize
      ? ctx.config.intelligentChunkSize
      : bowser.mobile
      ? 1 * 1024 * 1024
      : 8 * 1024 * 1024,
    intelligentOverride: false,
    loaded: 0,
    number: num,
    request: null,
    size: 0,
  };
};

/**
 * Returns a Promise based on the flow state
 * If the flow is paused it will return a Promise that resolves when resumed
 * If the flow failed it will resolve harmlessly
 *
 * @private
 * @param func  function that returns a Promise
 */
export const flowControl = (ctx: Context, func: any) => {
  return (...args: any[]) => {
    if (ctx.state.status === EStatus.FAILED) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const check = () => {
        if (ctx.state.status === EStatus.PAUSED) {
          setTimeout(() => check(), 100);
        } else {
          resolve(func(...args));
        }
      };
      check();
    });
  };
};

/**
 * @private
 */
class Delayed {
  resolve: any;
  fn: any;
  self?: any;
  args: any;
  constructor(resolve: any, fn: any, self: any, args: any) {
    this.resolve = resolve;
    this.fn = fn;
    this.self = self || null;
    this.args = args;
  }
}

  /**
   * @private
   */
class Queue {
  _s1: any[];
  _s2: any[];
  constructor() {
    this._s1 = [];
    this._s2 = [];
  }
  push(value: any) {
    this._s1.push(value);
  }
  shift() {
    let s2 = this._s2;
    if (s2.length === 0) {
      const s1 = this._s1;
      if (s1.length === 0) {
        return;
      }
      this._s1 = s2;
      s2 = this._s2 = s1.reverse();
    }
    return s2.pop();
  }
  isEmpty() {
    return !this._s1.length && !this._s2.length;
  }
}

  /**
   *
   * @private
   * @param size
   * @param fn
   */
export default function throat(size: number, fn: any) {
  const queue = new Queue();
  function run(fn: any, self: any, args: any) {
    if (size) {
      size--;
      const result = new Promise(function (resolve) {
        resolve(fn.apply(self, args));
      });
      result.then(release, release);
      return result;
    } else {
      return new Promise(function (resolve) {
        queue.push(new Delayed(resolve, fn, self, args));
      });
    }
  }
  function release() {
    size++;
    if (!queue.isEmpty()) {
      const next = queue.shift();
      next.resolve(run(next.fn, next.self, next.args));
    }
  }
  if (fn !== undefined && typeof fn !== 'function') {
    throw new TypeError(
        'Expected throat fn to be a function but got ' + typeof fn
      );
  }
  return function (this: any, ...args: any[]) {
    return run(fn, this, args);
  };
}

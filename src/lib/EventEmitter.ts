/*
 * Created on Sat Mar 02 2019
 *
 * Copyright (c) 2019 Breakinferno
 */

/**
 *  基本用法
 *  let em = new EventEmitter()
 *  let context = someObjectYouWantToWatchEvent;
 *  // 注意这里第一个参数是上下文对象
 *  em.on('start', function(ctx, arg1, arg2, arg2) {
 *  // code here
 *  }, context)
 *
 *  em.emit('start', arg1, arg2, arg3); // 触发事件，带参数
 *
 */

interface AnyFunction {
  (ctx, ...args: any[]): any;
}
/**
 * 基本事件对象，基本单元
 *
 * @class BaseEvent
 */
class BaseEvent {

  constructor(private fn: AnyFunction, private ctx, private once: Boolean = false) {
  }

  getFn() {
    return this.fn;
  }

  setFn(fn) {
    this.fn = fn;
  }

  getCtx() {
    return this.ctx;
  }

  setCtx(ctx) {
    this.ctx = ctx;
  }

  isOnce() {
    return this.once;
  }

}

interface Events {
  [evtName: string]: Array<BaseEvent>;
}

class EventEmitter {
  private _events: Events;
  constructor() {
    this._events = {};
  }

  // 事件数目
  get eventCounts(): Number {
    return Reflect.ownKeys(this._events).length || 0;
  }
  // 事件名称数组
  get eventNames() {
    return Reflect.ownKeys(this._events);
  }
  /**
   * 返回某个事件的回调函数数组
   * @param {string} evt  事件名称
   * @returns {Array<BaseEvent>} 回调数组
   * @memberof EventEmitter
   */
  getEvents(evt: string): Array<AnyFunction> {
    let listeners = this._events && this._events[evt];
    if (!listeners || !listeners.length) {
      return [];
    }
    return listeners.map(listener => listener.getFn());
  }
  /**
   * 添加事件监听回调
   *
   * @param {string} evt 事件名称
   * @param {*} fn  回调函数
   * @param {*} ctx 上下文
   * @returns
   * @memberof EventEmitter
   */
  on(evt: string, fn: AnyFunction, ctx): EventEmitter {
    let listener = new BaseEvent(fn, ctx || this);
    return this._addListener(evt, listener);
  }

  /**
   * 私有的添加回调方法，为了复用once和on方法
   * 返回EventEmitter
   * @private
   * @param {string} evt
   * @param {BaseEvent} listener
   * @returns {EventEmitter}
   * @memberof EventEmitter
   */
  private _addListener(evt: string, listener: BaseEvent): EventEmitter {
    if (!this._events) {
      this._events = {};
    }
    if (!this._events[evt]) {
      this._events[evt] = [listener];
    } else {
      this._events[evt].push(listener);
    }
    return this;
  }

  /**
   * 事件触发
   * @param {string} evt 事件名称
   * @param {*} restParams 剩余参数
   * @memberof EventEmitter
   */
  emit(evt: string, ...restParams): Boolean {
    try {
      if (this._events && this._events[evt]) {
        let events = this._events[evt];
        for (let i = 0; i < events.length; i++) {
          let event: BaseEvent = events[i];
          if (event.isOnce) {
            this.removeListener(evt, event.getFn(), event.getCtx(), true);
          }
          event.getFn().call(event.getCtx(), event.getCtx(), ...restParams);
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 只监听一次方法
   *
   * @param {string} evt 事件名称
   * @param {*} fn  回调函数
   * @param {*} ctx 上下文
   * @returns
   * @memberof EventEmitter
   */
  once(evt: string, fn: AnyFunction, ctx): EventEmitter {
    // console.log('once');
    let listener = new BaseEvent(fn, ctx || this, true);
    return this._addListener(evt, listener);
  }

  /**
   * 移除ctx上某个事件的某个监听函数
   * @param {string} evt  事件名
   * @param {*} fn  监听函数
   * @param {*} ctx 上下文对象
   * @param {Boolean} once 是否只移除一次
   * @returns {EventEmitter}
   * @memberof EventEmitter
   */
  removeListener(evt: string, fn: AnyFunction, ctx, once: Boolean = false): EventEmitter {
    let newEvents = []; // 新的事件列表
    if (this._events && this._events[evt]) {
      let listeners: Array<BaseEvent> = this._events[evt];
      if (fn) {
        for (let i = 0; i < listeners.length; i++) {
          if (listeners[i].getFn() !== fn || (once && !listeners[i].isOnce) || (ctx && listeners[i].getCtx() !== ctx)) {
            newEvents.push(listeners[i]);
          }
        }
      }
    }
    // 重新应用新的数组或者删除事件名称
    if (newEvents.length) {
      this._events[evt] = newEvents;
    } else {
      delete this._events[evt];
    }
    return this;
  }
  /**
   * 移除事件对应的所有监听函数
   * @param {string} evt 事件名称
   * @returns {EventEmitter}
   * @memberof EventEmitter
   */
  removeAllListeners(evt: string): EventEmitter {
    if (this._events) {
      delete this._events[evt];
    } else {
      this._events = {};
    }
    return this;
  }
}

export default EventEmitter;

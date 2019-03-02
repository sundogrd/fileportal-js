import * as EventEmitter from 'eventemitter3';
import BaseTask from './task/BaseTask';
import FilePortal from './core';
import { CancelToken, Canceler, AxiosResponse, AxiosError } from 'axios';
import { Tasks, Task, ETaskStatus, TaskOption, TaskBaseCB, ETaskEvents, TaskEventsHandler } from './types';
import { ETaskType } from './task/type';
import { noop } from '../utils/helper';

export enum ETaskManagerEvents {
  TASK_ADDED = 'TASK_ADDED',
  TASK_BEFORE_START = 'BEFORE_UPLOAD',
  TASK_START = 'TASK_START',
  TASK_SUCCEED = 'TASK_SUCCEED',
  TASK_FAILED = 'TASK_FAILED',
  TASK_PAUSE = 'TASK_PAUSE',

  ALL_TASK_COMPLETED = 'ALL_TASK_COMPLETED',
}

export type TaskManagerOptions = {
  host: string;
};

// 负责多任务管理
export default class TaskManager {
  emitter: EventEmitter;
  tasks: Tasks;
  owner: FilePortal;
  options: TaskManagerOptions;
  events: TaskEventsHandler;
  _events: TaskEventsHandler;
  constructor(owner, options) {
    this.emitter = new EventEmitter.EventEmitter();
    this.tasks = {};
    this.owner = owner;
    this.options = options;
    this.events = this._events = {
      preupload: noop,
      success: noop,
      failed: noop,
      pause: noop,
      cancel: noop,
      retry: noop,
      resume: noop,
    };
  }
  private _upload(task: Task, cancelHandler: Canceler | Canceler[]) {
    let file = task.payload;
    let taskEventsHandler: TaskEventsHandler = {
      success: (res, task, tasks) => {
        task.state = ETaskStatus.COMPLETED;
        // 回调uploaded
        this.owner.events.uploaded(res, task, this.tasks);
        // 判断所有任务是否完成
        let isComplete: boolean = Object.keys(this.tasks).every((taskId: string) => {
          return this.tasks[taskId].state === ETaskStatus.COMPLETED;
        });
        if (isComplete) {
          this.owner.events.complete(this.tasks);
        }
      },
      failed: (err, task, tasks) => {
        task.state = ETaskStatus.FAILED;
        this.owner.events.error(err, task, this.tasks);
      },
    };
    let baseEvnts = ['pause', 'resume', 'cancel', 'preupload'].reduce((evts, name) => {
      evts[name] = this.events[name].bind(this, task);
      return evts;
    }, {});
    this._events = {
      success: (res) => {
        this.events.success.call(this, res, task);
        taskEventsHandler.success.call(this, res, task, this.tasks);
      },
      failed: (err) => {
        this.events.failed.call(this, err, task);
        taskEventsHandler.failed.call(this, err, task, this.tasks);
      },
      retry: (fileOrBlock) => {
        this.events.retry.call(this, fileOrBlock, task);
      },
      ...baseEvnts,
    };
    return task.task.upload(task, cancelHandler, this._events);
  }

  /**
   *  添加任务
   * @param {BaseTask} task 任务
   * @param {AddOptions} options  配置
   * @param {string} [name] 任务名称
   * @returns {Task}
   * @memberof TaskManager
   */
  addTask(task: BaseTask, options: TaskOption): Task {
    // this.tasks[task.id] = task;
    // let md5 = await getMD5(task.file);
    let self = this;
    let id = btoa(`${Date.now()}${Math.random().toFixed(4)}`);
    let tTask: Task = {
      id: id,
      name: options.name || `task${id}`,
      state: ETaskStatus.PREUPLOAD,
      createAt: task.createDate,
      ext: options.extra || {},
      payload: task.file,
      token: options.token,
      config: {
        ...this.options,
        ...options,
      },
      manager: this,
      on: self.on.bind(self),
      task: task,
    };
    this.tasks[id] = tTask;
    return tTask;
  }
  getTasks(): Tasks {
    return this.tasks;
  }
  getTask(tid: string): Task {
    return this.tasks[tid];
  }
  start(taskId: string): Task {
    let task = this.tasks[taskId];
    let cancelHandler;
    task.state = ETaskStatus.UPLOADING;
    if (task.task.type === ETaskType.SIMPLE) {
      cancelHandler = this._upload(task, cancelHandler);
    } else if (task.task.type === ETaskType.CHUNK) {
      cancelHandler = [];
      this._upload(task, cancelHandler);
    }
    task.cancelHandler = cancelHandler;
    return task;
  }
  pause(taskId: string): void {
    return;
  }
  resume(taskId: string): void {
    return;
  }
  cancel(taskId: string, message?: string, cb?: (task?: Task) => any): void {
    // code
    setTimeout(() => {
      let task = this.tasks[taskId];
      let canceler: Canceler | Canceler[] = task.cancelHandler;
      task.state = ETaskStatus.CANCELED;
      if (Array.isArray(canceler)) {
        if (canceler.length === 0) {
          console.log('所有的请求都已被处理，不能取消了');
          return;
        }
        canceler.forEach(c => c(message));
      } else {
        canceler(message);
      }
      if (cb) {
        this.events.cancel = cb;
      }
      this.events.cancel.call(this);
      return;
    }, 0);
  }

  on(evt: string, cb: TaskBaseCB) {
    const events = [ETaskEvents.CANCEL as string, ETaskEvents.PAUSE, ETaskEvents.RESUME, ETaskEvents.SUCCESS, ETaskEvents.FAIL, ETaskEvents.RETRY, ETaskEvents.PREUPLOAD];
    if (events.includes(evt)) {
      this.events[evt] = cb;
    }
  }
}

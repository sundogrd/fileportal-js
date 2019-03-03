// import * as EventEmitter from 'eventemitter3';
import BaseTask from './task/BaseTask';
import { CancelToken, Canceler, AxiosResponse, AxiosError } from 'axios';
import { Tasks, Task, ETaskStatus, TaskOption, TaskBaseCB, ETaskEvents, EFilePortalEvents } from './types';
import { ETaskType } from './task/type';
import EventEmitter from './EventEmitter';

export enum ETaskManagerEvents {
  TASK_ADDED = 'TASK_ADDED',
  TASK_BEFORE_START = 'BEFORE_UPLOAD',
  TASK_START = 'TASK_START',
  TASK_SUCCEED = 'TASK_SUCCEED',
  TASK_FAILED = 'TASK_FAILED',
  TASK_PAUSE = 'TASK_PAUSE',
  TASK_CANCEL = 'TASK_CANCEL',
  ALL_TASK_COMPLETED = 'ALL_TASK_COMPLETED',
}

export type TaskManagerOptions = {
  host: string;
};

// 负责多任务管理
export default class TaskManager {
  tasks: Tasks;
  eventEmitter: EventEmitter;
  constructor() {
    this.tasks = {};
  }
  private _upload(task: BaseTask, cancelHandler: Canceler | Canceler[]) {
    return task.upload(cancelHandler);
  }

  /**
   *  添加任务
   * @param {BaseTask} task 任务
   * @returns {Task} 任务对象
   * @memberof TaskManager
   */
  addTask(task: BaseTask): BaseTask {
    this.tasks[task.id] = task;
    this.registCallback(task);
    return task;
  }
  // 为FilePortal注册回调
  registCallback(task) {
    task.eventEmitter.on(ETaskEvents.SUCCESS, (ctx, evt, task) => {
      this.eventEmitter.emit(EFilePortalEvents.UPLOADED, evt, task, ctx.getTasks());
      let isComplete: boolean = Object.keys(this.tasks).every((taskId: string) => {
        return this.tasks[taskId].status === ETaskStatus.COMPLETED;
      });
      if (isComplete) {
        this.eventEmitter.emit(EFilePortalEvents.COMPLETED, ctx.getTasks());
      }
    }, this);
    task.eventEmitter.on(ETaskEvents.FAIL, (ctx, evt, task) => {
      this.eventEmitter.emit(EFilePortalEvents.ERROR, evt, task, ctx.getTasks());
    }, this);
  }
  getTasks(): Tasks {
    return this.tasks;
  }
  getTask(tid: string): BaseTask {
    return this.tasks[tid];
  }
  start(taskId: string): BaseTask {
    let task = this.tasks[taskId];
    let cancelHandler;
    task.status = ETaskStatus.UPLOADING;
    if (task.type === ETaskType.SIMPLE) {
      cancelHandler = this._upload(task, cancelHandler);
    } else if (task.type === ETaskType.CHUNK) {
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
      // task. = ETaskStatus.CANCELED;
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
        // this.events.cancel = cb;
      }
      // this.events.cancel.call(this);
      task.status = ETaskStatus.CANCELED;
      return;
    }, 0);
  }
}

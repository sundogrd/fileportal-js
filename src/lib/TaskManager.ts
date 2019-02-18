import BaseTask from './task/BaseTask';
import FilePortal from './core';
import { UploadEvent, UploadConfig } from './api/upload/types';
import { upload } from './api/upload/upload';
import { CancelToken, Canceler, AxiosResponse, AxiosError } from 'axios';
import { Tasks, Task, TaskStatus, TaskOption, TaskBaseCB, TaskEvents, TaskEventsHandler } from './types';
import defaultConfig from '../config/task';
import { Type } from './task/type';
import { noop } from 'src/utils/helper';

export default class TaskManager {
  tasks: Tasks;
  owner: FilePortal;
  events: TaskEventsHandler;
  _events: TaskEventsHandler;
  constructor(owner) {
    this.tasks = {};
    this.owner = owner;
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
      success: (res) => {
        task.state = TaskStatus.COMPLETED;
        // 回调uploaded
        this.owner.events.uploaded(res, this.tasks, task);
        // 判断所有任务是否完成
        let isComplete: boolean = Object.keys(this.tasks).every((taskId: string) => {
          return this.tasks[taskId].state === TaskStatus.COMPLETED;
        });
        if (isComplete) {
          this.owner.events.complete(this.tasks);
        }
      },
      failed: (err) => {
        task.state = TaskStatus.FAILED;
        this.owner.events.error(err, this.tasks, task);
      },
    };
    this._events = {
      success: (res) => {
        this.events.success.call(this, res);
        taskEventsHandler.success.call(this, res);
      },
      failed: (err) => {
        this.events.failed.call(this, err);
        taskEventsHandler.failed.call(this, err);
      },
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
    let id = btoa(`${Date.now()}${Math.random().toFixed(4)}`);
    let tTask: Task = {
      id: id,
      name: options.name || `task${id}`,
      state: TaskStatus.PREUPLOAD,
      createAt: task.createDate,
      ext: options.extra || {},
      payload: task.file,
      token: options.token,
      config: options,
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
    task.state = TaskStatus.UPLOADING;
    if (task.task.type === Type.SIMPLE) {
      cancelHandler = this._upload(task, cancelHandler);
    } else if (task.task.type === Type.CHUNK) {
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
  cancel(taskId: string, message?: string, cb?: () => any): void {
    // code
    setTimeout(() => {
      let task = this.tasks[taskId];
      let canceler: Canceler | Canceler[] = task.cancelHandler;
      task.state = TaskStatus.CANCELED;
      if (Array.isArray(canceler)) {
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
    const events = [TaskEvents.CANCEL, TaskEvents.PAUSE, TaskEvents.RESUME, TaskEvents.SUCCESS, TaskEvents.FAIL, TaskEvents.RETRY, TaskEvents.PREUPLOAD] as string[];
    if (events.includes(evt)) {
      this.events[evt] = cb;
    }
  }
}

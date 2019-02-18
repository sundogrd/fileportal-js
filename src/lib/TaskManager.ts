import BaseTask from './task/BaseTask';
import FilePortal from './core';
import { UploadEvent, UploadConfig } from './api/upload/types';
import { upload } from './api/upload/upload';
import { CancelToken, Canceler, AxiosResponse, AxiosError } from 'axios';
import { Tasks, Task, TaskStatus, TaskOption, TaskBaseCB, TaskEvents } from './types';
import defaultConfig from '../config/task';
import { Type } from './task/type';

export default class TaskManager {
  tasks: Tasks;
  owner: FilePortal;
  constructor(owner) {
    this.tasks = {};
    this.owner = owner;
  }
  private _upload(task: Task) {
    let file = task.payload;
    let uploadEvent: UploadEvent = {
      success: (res?: AxiosResponse) => {
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
      error: (err?: AxiosError) => {
        task.state = TaskStatus.FAILED;
        this.owner.events.error(err, this.tasks, task);
      },
    };
    return task.task.upload(file, task.config, uploadEvent);
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
    task.state = TaskStatus.UPLOADING;
    task.cancelHandler = this._upload(task);
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
    let task = this.tasks[taskId];
    let canceler = task.cancelHandler;
    task.state = TaskStatus.CANCELED;
    canceler(message);
    cb();
    return;
  }

  on(evt: string, cb: TaskBaseCB) {
    if (evt === TaskEvents.CANCEL) {
      // code here
    }
    if (evt === TaskEvents.PAUSE) {
      // code here
    }
    if (evt === TaskEvents.RESUME) {
      // code here
    }
    if (evt === TaskEvents.SUCCESS) {
      // code here
    }
    if (evt === TaskEvents.FAIL) {
      // code here
    }
    if (evt === TaskEvents.RETRY) {
      // code here
    }
    if (evt === TaskEvents.PREUPLOAD) {
      // code here
    }
  }
}

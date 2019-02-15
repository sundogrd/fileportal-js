import BaseTask from './task/BaseTask';
import FilePortal, { AddOptions } from './core';
import { UploadOptions, UploadConfig, UploadEvent } from './api/upload/types';
import { upload } from './api/upload/upload';
import { CancelToken, Canceler, AxiosResponse, AxiosError } from 'axios';
export enum ETaskState {
  PREUPLOAD = 'preupload',  // 等待开始上传
  SCANNING = 'scanning',    // 扫描，MD5？
  UPLOADING = 'uploading',  // 上传中
  PAUSED = 'paused',        // 暂停
  CANCELED = 'canceled',    // 上传取消
  FAILED = 'failed',        // 上传失败
  COMPLETED = 'completed',  // 上传完成
}

export type Task = {
  id: string,   // 唯一？ md5？
  name: string,
  state: ETaskState,
  createAt: Date,
  payload: File,
  token: () => Promise<string> | string,
  cancelHandler?: Canceler,
  config: UploadConfig,
  ext: any, // 业务方自定义内容，以及progress、retryCount也存在里面
};
export type Tasks = {
  [taskId: string]: Task
};

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
        // 回调uploaded
        this.owner.events.uploaded(res, this.tasks, task);
      },
      error: (err?: AxiosError) => {
        this.owner.events.error(err, this.tasks, task);
      },
    };
    return upload(file, task.config, {}, uploadEvent);
  }

  /**
   *  添加任务
   * @param {BaseTask} task 任务
   * @param {AddOptions} options  配置
   * @param {string} [name] 任务名称
   * @returns {Task}
   * @memberof TaskManager
   */
  addTask(task: BaseTask, options: AddOptions, name?: string): Task {
    // this.tasks[task.id] = task;
    // let md5 = await getMD5(task.file);
    let id = btoa(`${Date.now()}${Math.random().toFixed(4)}`);
    let tTask: Task = {
      id: id,
      name: name || 'default',
      state: ETaskState.PREUPLOAD,
      createAt: task.createDate,
      ext: options.extra || {},
      payload: task.file,
      token: options.token,
      config: options.config,
    };
    this.tasks[id] = tTask;
    return tTask;
  }
  getTasks(): Tasks {
    return this.tasks;
  }
  start(taskId: string): Task {
    let task = this.tasks[taskId];
    task.state = ETaskState.UPLOADING;
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
    task.state = ETaskState.CANCELED;
    canceler(message);
    cb();
    return;
  }
}

import TaskManager, { Task, Tasks } from './TaskManager';
import { EMimeType } from '../types/upload';
import Logger from './logger';
import { ChunkTask } from './task/ChunkTask';
import DirectTask from './task/DirectTask';
import { UploadConfig, UploadOptions } from './api/upload/types';
import BaseTask from './task/BaseTask';
import { noop } from '../utils/helper';
export interface FilePortalOptions {
  debug: boolean;
  chunkSize: number;
  accept: EMimeType;

  [option: string]: any;
  tokenFun: () => Promise<string>;
}

export interface AddOptions {
  // immediate: boolean;  // 加入后立即上传
  token: () => Promise<string> | string;
  extra?: Object;
  config: UploadConfig;
}

export interface EventResponse {
  complete?: ((tasks?: Tasks) => any);
  error?: ((err?: any, tasks?: Tasks, task?: Task) => any);
  uploaded?: (res?: any, tasks?: Tasks, task?: Task) => any;
}

export const enum Events {
  COMPLETE = 'complete',  // 所有task完成
  UPLOADED = 'uploaded',  // 某个task完成
  ERROR =  'error',       // task出错
}

export default class FilePortal {
  debug;
  options: FilePortalOptions;
  taskManager: TaskManager;
  events: EventResponse;
  constructor(options?: FilePortalOptions) {
    // super();
    this.debug = new Logger('filePortal/core');
    this.options = options;
    this.taskManager = new TaskManager(this);
    this.events = {
      complete: noop,
      error: noop,
      uploaded: noop,
    };
  }

  static BLOCK_SIZE = 4 * 1024 * 1024;
  static CHUNK_SIZE = 2 * 1024 * 1024;
  private generateTask = (file: File): BaseTask => {
    if (file.size > FilePortal.BLOCK_SIZE) {
      return new ChunkTask(file, FilePortal.BLOCK_SIZE, FilePortal.CHUNK_SIZE);
    } else {
      return new DirectTask(file);
    }
  }

  addTask(file: any, options: AddOptions): Task {
    this.debug.log('upload start');
    /* istanbul ignore next */
    let task: BaseTask = this.generateTask(file);
    return this.taskManager.addTask(task, options);
  }

  start(tid: string) {
    return this.taskManager.start(tid);
  }

  pause(tid: string) {
    this.taskManager.pause(tid);
    return this;
  }

  resume(tid: string) {
    this.taskManager.resume(tid);
    return this;
  }

  cancel(tid: string, message?: string, cb?: () => any) {
    this.taskManager.cancel(tid, message, cb);
    return this;
  }

  complete(cb: (tasks?: Tasks, task?: Task, source?: string) => any) {
    this.events.complete = cb;
  }

  uploaded(cb: (res?: any, tasks?: Tasks, task?: Task, source?: string) => any) {
    this.events.uploaded = cb;
  }

  error(cb: (err?: any, tasks?: Tasks, task?: Task) => any) {
    this.events.error = cb;
  }

  on(evt: string, cb): void {
    if (evt === Events.COMPLETE) {
      this.complete(cb);
    }
    if (evt === Events.ERROR) {
      this.error(cb);
    }
    if (evt === Events.UPLOADED) {
      this.uploaded(cb);
    }
    return;
  }
  // simpleUpload() {
  //   return simpleUpload('keke', {
  //     config: {
  //       host: 'localhost:8089',
  //     },
  //   } as any);
  // }
  setOptions(options: FilePortalOptions) {
    this.options = {
      ...this.options,
      ...options,
    };
  }
}

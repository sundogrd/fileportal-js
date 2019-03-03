// import { Omit } from 'utility-types';
import TaskManager from './TaskManager';
import { EMimeType } from '../types/upload';
import Logger from './logger';
import { ChunkTask } from './task/ChunkTask';
import DirectTask from './task/DirectTask';
import BaseTask from './task/BaseTask';
import { noop } from '../utils/helper';
import { FilePortalOptions, TaskOption, EFilePortalStatus, FilePortalCompleteCB, FilePortalErrorCB, FilePortalUploadedCB, FilePortalStartCB, SmartType, FilePortalEventResponse, Task, EFilePortalEvents } from './types';
import defaultOptions from '../config/index';
import { Cancel } from 'axios';
import defaultTaskOption from '../config/task';
import { getFile } from '../utils/file';

export default class FilePortal {
  debug;
  status: EFilePortalStatus;
  options: FilePortalOptions;
  taskManager: TaskManager;
  events: FilePortalEventResponse;
  hasStarted: boolean;
  constructor(options: FilePortalOptions) {
    // super();
    this.status = EFilePortalStatus.INIT;
    this.debug = new Logger('filePortal/core');
    this.hasStarted = false;
    this.options = {
      ...defaultOptions,
      ...options,
    };
    this.taskManager = new TaskManager(this, this.options);
    this.events = {
      complete: noop,
      error: noop,
      uploaded: noop,
      start: noop,
    };

    this._validate(this);
  }

  private _generateTask = (file: File, op: boolean | SmartType = true): BaseTask => {
    const { chunkStartSize, chunkSize } = this.options;
    switch (op) {
      case true: {
        if (file.size > chunkStartSize) {
          // 没有block，只有chunk
          return new ChunkTask(file, chunkSize, chunkSize);
        } else {
          return new DirectTask(file);
        }
        break;
      }
      // TODO: 3.9
      case SmartType.MULTIPART: {
        // code here
        break;
      }
      case SmartType.SIMPLE: {
        // code here
        break;
      }
      default: {
        // code here
      }
    }
  }

  addTask(file: any, options: TaskOption): Task {
    this.debug.log('upload start');
    const fileBlob: File = getFile(file);
    console.log(fileBlob);
    if ((fileBlob.size !== undefined && fileBlob.size === 0)) {
      throw new Error('file has a size of 0.');
    }
    let task: BaseTask = this._generateTask(fileBlob, this.options.smart || true);
    return this.taskManager.addTask(task, options);
  }

  start(tid: string): Task {
    if (!this.hasStarted) {
      this.events.start.call(this);
      this.hasStarted = true;
    }
    let task: Task = this.taskManager.start(tid);
    return task;
  }

  startAll() {
    if (!this.hasStarted) {
      this.events.start.call(this);
      this.hasStarted = true;
    }
    // code here
  }

  stop(tid: string): any {
    // code here
  }

  stopAll(tid: string): any {
    // code here
  }

  pause(tid: string) {
    this.taskManager.pause(tid);
    return this;
  }

  resume(tid: string) {
    this.taskManager.resume(tid);
    return this;
  }

  cancel(tid: string, message?: string, cb?: (task?: Task) => any) {
    this.taskManager.cancel(tid, message, cb);
    return this;
  }

  cancelAll() {
    // code here
  }

  completed(cb: FilePortalCompleteCB) {
    this.events.complete = cb;
  }

  uploaded(cb: FilePortalUploadedCB) {
    this.events.uploaded = cb;
  }

  error(cb: FilePortalErrorCB) {
    this.events.error = cb;
  }
  started(cb: FilePortalStartCB) {
    this.events.start = cb;
  }

  getTask(tid: string): Task {
    let task: Task = this.taskManager.getTask(tid);
    return task;
  }

  on(evt: string, cb): void {
    if (evt === EFilePortalEvents.COMPLETED) {
      this.completed(cb);
    }
    if (evt === EFilePortalEvents.ERROR) {
      this.error(cb);
    }
    if (evt === EFilePortalEvents.UPLOADED) {
      this.uploaded(cb);
    }
    if (evt === EFilePortalEvents.STARTED) {
      this.started(cb);
    }
    return;
  }

  setOptions(options: FilePortalOptions) {
    this.options = {
      ...this.options,
      ...options,
    };
  }

  _validate(filePortal: FilePortal) {
    if (!filePortal.options.host) {
      throw new Error('required host in options');
    }
  }
}

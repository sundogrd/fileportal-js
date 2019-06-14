// import { Omit } from 'utility-types';
import TaskManager from './TaskManager';
import Logger from './logger';
import { ChunkTask } from './task/ChunkTask';
import DirectTask from './task/DirectTask';
import BaseTask from './task/BaseTask';
import { FilePortalOptions, TaskOption, EFilePortalStatus, FilePortalCompleteCB, FilePortalErrorCB, FilePortalUploadedCB, FilePortalStartCB, SmartType, FilePortalEventResponse, Task, EFilePortalEvents } from './types';
import defaultOptions from '../config/index';
import { getFile } from '../utils/file';
import EventEmitter from './EventEmitter';

export default class FilePortal {
  debug;
  status: EFilePortalStatus;
  options: FilePortalOptions;
  taskManager: TaskManager;
  hasStarted: boolean;
  eventEmitter: EventEmitter;
  constructor(options?: FilePortalOptions) {
    // super();
    this.status = EFilePortalStatus.INIT;
    this.debug = new Logger('filePortal/core');
    this.hasStarted = false;
    this.options = {
      ...defaultOptions,
      ...options,
    };
    this.taskManager = new TaskManager();
    this.eventEmitter = new EventEmitter();
    this.taskManager.eventEmitter = this.eventEmitter;
    // this._validate(this);
  }

  private _generateTask = (file: File, op: boolean | SmartType = true, options: TaskOption): BaseTask => {
    const { chunkStartSize, chunkSize } = this.options;
    switch (op) {
      case true: {
        if (file.size > chunkStartSize) {
          // 没有block，只有chunk
          return new ChunkTask(file, chunkSize, chunkSize, options);
        } else {
          return new DirectTask(file, options);
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

  addTask(file: any, options: TaskOption): BaseTask {
    this.debug.log('upload start');
    const fileBlob: File = getFile(file);
    console.log(fileBlob);
    if ((fileBlob.size !== undefined && fileBlob.size === 0)) {
      throw new Error('file has a size of 0.');
    }
    let mergeOptions = {
      ...this.options,
      ...options,
    };
    this._validate(mergeOptions);
    let task: BaseTask = this._generateTask(fileBlob, mergeOptions.smart || true, mergeOptions);
    return this.taskManager.addTask(task);
  }

  start(tid: string): BaseTask {
    if (!this.hasStarted) {
      this.eventEmitter.emit(EFilePortalEvents.STARTED as string);
      this.hasStarted = true;
    }
    let task: BaseTask = this.taskManager.start(tid);
    return task;
  }

  startAll() {
    if (!this.hasStarted) {
      this.eventEmitter.emit(EFilePortalEvents.STARTED as string);
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
    this.eventEmitter.on(EFilePortalEvents.COMPLETED, function(ctx, tasks) {
      cb.call(this, tasks);
    }, this);
  }

  uploaded(cb: FilePortalUploadedCB) {
    this.eventEmitter.on(EFilePortalEvents.UPLOADED, function(ctx, res, task, tasks) {
      cb(res, task, tasks);
    }, this);
  }

  error(cb: FilePortalErrorCB) {
    this.eventEmitter.on(EFilePortalEvents.ERROR, function(ctx, err, task, tasks) {
      cb(err, task, tasks);
    }, this);
  }
  started(cb: FilePortalStartCB) {
    this.eventEmitter.on(EFilePortalEvents.STARTED, function(ctx, task, tasks) {
      cb(task, tasks);
    }, this);
  }

  getTask(tid: string): BaseTask {
    let task: BaseTask = this.taskManager.getTask(tid);
    return task;
  }

  on(evt: string, cb): FilePortal {
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
    return this;
  }

  setOptions(options: FilePortalOptions) {
    this.options = {
      ...this.options,
      ...options,
    };
  }

  private _validate(options) {
    if (!options.host) {
      throw new Error('required host in options');
    }
  }
}

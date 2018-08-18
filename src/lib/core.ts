import { upload } from './api/upload';
import TaskManager from './TaskManager';
import { EMimeType } from '../types/upload';
import Logger from './logger';
import { EventEmitter } from 'events';
import { throws } from 'assert';

export interface FilePortalOptions {
  debug: boolean;
  chunkSize: number;
  accept: EMimeType;

  [option: string]: any;
  tokenFun: () => Promise<string>;
}

export class FilePortal extends TaskManager {
  debug;
  options: FilePortalOptions;
  constructor(options?: FilePortalOptions) {
    super()
    this.debug = new Logger('filePortal/core')
    this.options = options;
  }

  upload(file: any) {
    this.debug.log('upload start');
    /* istanbul ignore next */
    return upload();
  }

  /**
   * 
   * @param eventName 事件名称
   * @param callback  回调函数
   */
  on(eventName: string, callback: (task: Task, source: string) => void): this {
    
    return super.on(eventName, callback)
  }

  emit(eventName: string, task: Task, source: 'api' | 'system'): boolean {
    
    return super.emit(eventName, task, source)
  }
  setOptions(options: FilePortalOptions) {
    this.options = {
      ...this.options,
      ...options,
    };
  }

}

// one file one Task
class Task extends EventEmitter{
  taskId: number

  constructor(taskId: number) {
    super()
    this.taskId = taskId
  }

  // addEventListener

  // event
}


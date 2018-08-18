import { upload } from './api/upload';
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

export class FilePortal extends EventEmitter {
  debug;

  taskId: number = 0  // taskId automately increases
  count: number = 0   // tasks' total amount

  constructor(options?: FilePortalOptions) {
    super()
    this.debug = new Logger('filePortal/core')
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
}

// one file one Task
class Task {
  taskId: number

  constructor(taskId: number) {
    this.taskId = taskId
  }

  // addEventListener

  // event
}


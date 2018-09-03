import { upload } from './api/upload';
import TaskManager from './TaskManager';
import { EMimeType } from '../types/upload';
import Logger from './logger';
import { ChunkTask } from './task/ChunkTask';
import DirectTask from './task/DirectTask';

export interface FilePortalOptions {
  debug: boolean;
  chunkSize: number;
  accept: EMimeType;

  [option: string]: any;
  tokenFun: () => Promise<string>;
}

export interface AddOptions {
  immediate: boolean;  // 加入后立即上传
}

export class FilePortal extends TaskManager {
  debug;
  options: FilePortalOptions;
  taskManager: TaskManager;
  constructor(options?: FilePortalOptions) {
    super();
    this.debug = new Logger('filePortal/core');
    this.options = options;
    this.taskManager = new TaskManager();
  }

  static BLOCK_SIZE = 4 * 1024 * 1024;

  private generateTask = (file: File) => {
    if (file.size > FilePortal.BLOCK_SIZE) {
      return new ChunkTask(file, FilePortal.BLOCK_SIZE, 2 * 1024 * 1024);
    } else {
      return new DirectTask(file);
    }
  }

  add(file: any, options: AddOptions) {
    this.debug.log('upload start');
    /* istanbul ignore next */
    return upload();
  }
  setOptions(options: FilePortalOptions) {
    this.options = {
      ...this.options,
      ...options,
    };
  }
}

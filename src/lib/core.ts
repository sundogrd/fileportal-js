import { upload } from './api/upload';
import TaskManager from './TaskManager';
import { EMimeType } from '../types/upload';
import Logger from './logger';

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

  setOptions(options: FilePortalOptions) {
    this.options = {
      ...this.options,
      ...options,
    };
  }

}


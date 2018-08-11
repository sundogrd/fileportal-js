import { upload } from './api/upload';
import { EMimeType } from '../types/upload';
import Logger from './logger';

export interface FilePortalOptions {
  debug: boolean;
  chunkSize: number;
  accept: EMimeType;

  [option: string]: any;
  tokenFun: () => Promise<string>;
}

export class FilePortal {
  debug;
  constructor(options?: FilePortalOptions) {
    this.debug = new Logger('filePortal/core');
  }

  upload(file: any) {
    this.debug.log('upload start');
    /* istanbul ignore next */
    return upload();
  }
}

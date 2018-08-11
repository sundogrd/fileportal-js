import { upload } from './api/upload';
import { EMimeType } from '../types/upload'
import Logger from './logger'

export interface FilePortalOptions {
  debug: boolean;
  chunkSize: number;
  accept: EMimeType;
  
  [option: string]: any;
  tokenFun: () => Promise<string>,
}

const debug = new Logger('filePortal/core')

export class FilePortal {

  constructor(options?: FilePortalOptions) {
    
  }

  upload(file: any) {
    debug.log('upload start')
    /* istanbul ignore next */
    return upload();
  }
}
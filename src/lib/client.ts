import { upload } from './api/upload';

export interface ClientOptions {
  [option: string]: any;
}

export class Client {

  constructor(apikey: string, options?: ClientOptions) {
    if (!apikey || typeof apikey !== 'string' || apikey.length === 0) {
      throw new Error('An apikey is required to initialize the fileportal client');
    }
  }

  upload(file: any) {
    /* istanbul ignore next */
    return upload();
  }
}

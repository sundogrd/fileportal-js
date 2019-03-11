import { State, UploadOptions, UploadConfig, Context, Status, UploadEvent } from './types';
import { getFile, closeFile } from '../../../utils/file';
import { Canceler } from '../../types';
import { sleeper } from '../../../utils/helper';
/**
 * @private
 */
const statuses = {
  INIT: Status.INIT,
  RUNNING: Status.RUNNING,
  DONE: Status.DONE,
  FAILED: Status.FAILED,
  PAUSED: Status.PAUSED,
};

const defaultUploadConfig = {};

export const upload = (fileStringOrBlob, uploadConfig: UploadConfig, callbacks?: UploadEvent) => {
  const file: File = getFile(fileStringOrBlob);
  if ((file.size !== undefined && file.size === 0)) {
    throw new Error('file has a size of 0.');
  }
  // Configurables
  const config: UploadConfig = {
    ...defaultUploadConfig,
    ...uploadConfig,
  };

  const initialState: State = {
    status: statuses.INIT,
  };
  const context: Context = {
    file: file,
    config,
    state: initialState,
  };
  return uploadFile(context, callbacks);
};

export const simpleUpload = upload;

function uploadFile(context: Context, token?: UploadEvent): Canceler {
  // const fd = new FormData();
  const { file, config } = context;
  // const { size, name, type } = file;

  let symbol = Symbol('request');
  let abortSymbol;
  let xhr = new XMLHttpRequest();
  let canceler;
  let cancelToken = new Promise(resolve => {
    canceler = resolve;
  });
  let request = sleeper(config.delay).then(() => {
    console.time('timeout');
    // console.log(file);
    return new Promise((resolve, reject) => {
      if (token) {
        if (token.success && typeof token.success === 'function') {
          xhr.onload = (e) => {
            // console.log('request success');
            // 这里应该用xhr.response
            let res = xhr.response;
            token && token.success && token.success.call(token, res);
            return resolve(symbol);
          };
        }

        if (token.error && typeof token.error === 'function') {
          xhr.addEventListener('error', (err) => {
            console.log('rquest error');
            token.error.call(token, err);
            return reject(symbol);
          }, false);
        }

        if (token.progress && typeof token.progress === 'function') {
          xhr.addEventListener('progress', token.progress, false);
        }

        if (token.abort && typeof token.abort === 'function') {
          xhr.addEventListener('abort', (evt) => {
            console.log('request abort');
            !abortSymbol && token.abort.call(token, evt);
            return reject(symbol);
          }, false);
        }
      }
      xhr.send(file);
    });
  });

  xhr.open('POST', config.host);
  xhr.setRequestHeader('Content-Type', 'application/octet-stream');

  Promise.race([request, cancelToken]).then((res: Symbol | String) => {
    if (res !== symbol) {
      abortSymbol = Symbol('abort');
      // cancel操作
      xhr.abort();
      if (token.cancel && typeof token.cancel === 'function') {
        token.cancel(res);
      }
    }
  });
  return canceler;
}
// TODO: 多文件 分片 断点续传 中断 取消 重传 上传进度

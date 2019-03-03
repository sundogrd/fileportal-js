import { State, UploadOptions, UploadConfig, Context, Status, UploadEvent } from './types';
import { getFile, closeFile } from '../../../utils/file';
import { createAxios, getCancelHandler } from '../request';
import { Canceler } from 'axios';
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
  const fd = new FormData();
  const { file, config } = context;
  const { size, name, type } = file;
  let iAxios = createAxios();
  // fd.append('file', file, name);
  // fd.append('option', JSON.stringify({
  //   size,
  //   name,
  //   type,
  // }));
  // if (config.chunk) {
  //   fd.append('chunk', JSON.stringify(config.chunk));
  // }
  sleeper(config.delay).then(() => {
    console.time('timeout');
    console.log(file);
    let xhr = new XMLHttpRequest();
    // if (XMLHttpRequest) {
    //   xhr = new XMLHttpRequest();
    // } else {
    //   xhr = new ActiveXObject('Microsoft.XMLHTTP');
    // }
    // xhr.onload = (e: ProgressEvent) => {
    //   console.log('axios success');
    //   token && token.success && token.success.call(this, e);
    // };
    xhr.open('POST', config.host);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    if (token) {
      if (token.success && typeof token.success === 'function') {
        xhr.onload = (e) => {
          console.log('axios success');
          token && token.success && token.success.call(this, e);
        };
      }

      if (token.error && typeof token.error === 'function') {
        xhr.addEventListener('error', token.error, false);
      }

      if (token.progress && typeof token.progress === 'function') {
        xhr.addEventListener('progress', token.progress, false);

      }

      if (token.abort && typeof token.abort === 'function') {
        xhr.addEventListener('abort', token.abort, false);
      }
    }
    xhr.send(file);
    // return iAxios({
    //   method: 'post',
    //   // headers: {
    //   //   'Content-Type': 'octet-stream',
    //   // },
    //   timeout: config.timeout,
    //   data: file,
    //   // onUploadProgress: function(e) {
    //   //   if (e.lengthComputable) {
    //   //     console.log(e.loaded + ' ' + e.total);
    //   //     this.updateProgressBarValue(e);
    //   //   }
    //   // //   let percentCompleted = Math.round((e.loaded * 100) / e.total);
    //   // //   console.log(percentCompleted);
    //   // },
    // }).then(res => {
    //   console.log('axios success');
    //   token && token.success && token.success.call(this, res);
    // }).catch(err => {
    //   console.log('axios failed');
    //   token && token.error && token.error.call(this, err);
    // });
  });
  return getCancelHandler(iAxios);
}
// TODO: 多文件 分片 断点续传 中断 取消 重传 上传进度

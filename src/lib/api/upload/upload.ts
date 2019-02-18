import { State, UploadOptions, UploadConfig, Context, Status, UploadEvent } from './types';
import Config from '../../../config/upload';
import { getFile, closeFile, getPart } from '../../../utils/file';
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

export const upload = (fileStringOrBlob,options: UploadConfig,token?: UploadEvent) => {
  const fileBlob: any = getFile(fileStringOrBlob);
  if ((fileBlob.size !== undefined && fileBlob.size === 0) || fileBlob.length === 0) {
    throw new Error('file has a size of 0.');
  }
  // Configurables
  const config: UploadConfig = {
    ...Config,
    ...options,
  };

  const initialState: State = {
    status: statuses.INIT,
  };
  const context: Context = {
    file: fileBlob,
    config,
    state: initialState,
  };
  return uploadFile(context, token);
};

export const simpleUpload = upload;

function uploadFile(context: Context, token?: UploadEvent): Canceler {
  const fd = new FormData();
  const { file, config } = context;
  const { size, name, type } = file;
  let iAxios = createAxios();
  fd.append('file', file, name);
  fd.append('option', JSON.stringify({
    size,
    name,
    type,
  }));
  sleeper(config.delay).then(() => {
    return iAxios.post(config.host, fd, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      // onUploadProgress: function(e) {
      //   if (e.lengthComputable) {
      //     console.log(e.loaded + ' ' + e.total);
      //     this.updateProgressBarValue(e);
      //   }
      // //   let percentCompleted = Math.round((e.loaded * 100) / e.total);
      // //   console.log(percentCompleted);
      // },
    }).then(res => {
      token && token.success && token.success.call(this, res);
    }).catch(err => {
      token && token.error && token.error.call(this, err);
    });
  });
  return getCancelHandler(iAxios);
}
// TODO: 多文件 分片 断点续传 中断 取消 重传 上传进度

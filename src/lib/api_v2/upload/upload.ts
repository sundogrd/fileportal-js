import { State, UploadOptions, UploadConfig, Context, Status } from './types';
import Config from '../../../config';
import { getFile, closeFile, getPart } from '../../../utils/file';
import request from '../request';
import { getObjType } from '../../../utils/helper';
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

export const upload = async (
  fileStringOrBlob,
  options: UploadOptions,
  storeOptions,
  token = {}
): Promise<any> => {
  const fileBlob: any = await getFile(fileStringOrBlob);
  if ((fileBlob.size !== undefined && fileBlob.size === 0) || fileBlob.length === 0) {
    return Promise.reject(new Error('file has a size of 0.'));
  }
  // Configurables
  const config: UploadConfig = {
    ...Config,
    ...options,
  };

  const initialState: State = {
    status: statuses.INIT,
  };
  // console.log(fileBlob);
  const context: Context = {
    file: fileBlob,
    config,
    state: initialState,
  };
  return uploadFile(context, {});
};

function uploadFile(context: Context, token: any): Promise<any> {
  const fd = new FormData();
  Object.keys(context).forEach(key => {
    if (typeof context[key] !== 'string' && getObjType(context[key]) !== 'File' && getObjType(context[key]) !== 'Blob') {
      fd.append(key, JSON.stringify(context[key]));
    } else {
      fd.append(key, context[key]);
    }
  });
  // fd.append('name', 'testtest');
  // fd.append('type', 'image/svg+xml');
  return request('/upload', fd, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
// TODO: 多文件 分片 断点续传 中断 取消 重传 上传进度

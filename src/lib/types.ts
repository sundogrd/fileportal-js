// FilePortal
import { Canceler } from 'axios';
import BaseTask from './task/BaseTask';
import { Block } from './task/ChunkTask';
import TaskManager from './TaskManager';
// 初始化需要的参数
export interface FPConstructorOption {
  apikey: string;                                       // 注册的ApiKey
  isClient?: boolean;                                    // 是否是客户端
  token: ((prop?: any) => Promise<string>) | string;     // token凭证
}

/**
 * FilePortal可配置参数
 * 全局参数，可被任务配置覆盖
 * @export
 * @interface FilePortalOption
 */
export interface FilePortalOptions extends FPConstructorOption {
  chunkStartSize?: number;      // 分片至少需要文件大小
  concurrency?: number;         // 上传任务workder数
  chunkSize?: number;           // 分片大小
  debug?: boolean;              // 是否开启调试模式 待续
  retryCount?: number;          // 重试次数
  retryMaxTime?: number;        // 重试时间间隔
  timeout?: number;             // 超时时间
  delay?: number;               // 延迟时间
  mimetype?: string;            // 文件默认MIME
  progressInterval?: number;     // 进度tricker间隔时间
  [option: string]: any;
}

export const enum SmartType {
  SIMPLE = 'simple',
  MULTIPART = 'multipart',
}

export interface TaskOption extends FilePortalOptions {
  host?: string;
  name?: string;
  smart?: boolean | SmartType;
  extra?: Object;
}

// export interface EventResponse {
//   complete?: ((tasks?: Tasks) => any);
//   error?: ((err?: any, tasks?: Tasks, task?: Task) => any);
//   uploaded?: (res?: any, tasks?: Tasks, task?: Task) => any;
// }

export type Task = {
  id: string,   // 唯一？ md5？
  name: string,
  manager: TaskManager,
  state: TaskStatus,
  createAt: Date,
  payload: Blob,
  token?: (() => Promise<string>) | string,
  cancelHandler?: Canceler | Canceler[],
  config: TaskOption,
  task: BaseTask,
  on: (callback: string, cb: (res?: any) => any) => any,
  ext: any, // 业务方自定义内容，以及progress、retryCount也存在里面
};

export type Tasks = {
  [taskId: string]: Task
};

/************** FILEPORTAL **************/
export interface FilePortalStartCB {
  (tasks?: Tasks): any;
}

export interface FilePortalCompleteCB {
  (tasks?: Tasks): any;
}

export interface FilePortalUploadedCB {
  (res?: any, task?: Task, tasks?: Tasks): any;
}

export interface FilePortalErrorCB {
  (err?: any, task?: Task, tasks?: Tasks): any;
}

/************** TASK **************/
export interface TaskBaseCB {
  (task?: Task): any;
}
export interface TaskPreUploadCB extends TaskBaseCB {
}

export interface TaskPauseCB extends TaskBaseCB {
}

export interface TaskResumeCB extends TaskBaseCB {
}

export interface TaskFailedCB  extends TaskBaseCB {
}

export interface TaskSuccessCB  extends TaskBaseCB {
}

export interface TaskRetryCB  extends TaskBaseCB {
}

export const enum FilePortalEvents {
  STARTED = 'started',
  UPLOADED = 'uploaded',
  COMPLETED = 'completed',
  ERROR =  'error',
}

export const enum FilePortalStatus {
  INIT = 'init',
  START = 'start',        // task开始
  UPLOADING = 'uploading',// 正在上传中
  COMPLETE = 'complete',  // 所有task完成
  ERROR =  'error',       // task出错
}

export interface FilePortalEventResponse {
  complete?: FilePortalCompleteCB;
  error?: FilePortalErrorCB;
  uploaded?: FilePortalUploadedCB;
  start?: FilePortalStartCB;
}

export const enum TaskStatus {
  PREUPLOAD = 'preupload',  // 等待开始上传
  SCANNING = 'scanning',    // 扫描，MD5？
  UPLOADING = 'uploading',  // 上传中
  PAUSED = 'paused',        // 暂停
  CANCELED = 'canceled',    // 上传取消
  FAILED = 'failed',        // 上传失败
  COMPLETED = 'completed',  // 上传完成
}

export const enum TaskEvents {
  PREUPLOAD = 'preupload',
  RETRY = 'retry',
  RESUME = 'resume',
  PAUSE = 'pause',
  CANCEL = 'cancel',
  FAIL = 'fail',
  SUCCESS = 'success',
}

export interface TaskEventsHandler {
  preupload?: () => any;
  cancel?: () => any;
  retry?: (block?: Block) => any;
  success: (res?: any, task?: Task, tasks?: Tasks) => any;
  failed: (err?: any, task?: Task, tasks?: Tasks) => any;
  pause?: () => any;
  resume?: () => any;
}

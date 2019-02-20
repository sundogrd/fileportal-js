import BaseTask from './BaseTask';
import { Type } from './type';
import { upload } from '../api/upload/upload';
import { TaskOption, TaskEventsHandler, Task } from '../types';
import { UploadEvent, UploadConfig } from '../api/upload/types';
import { extractObj, sleeper } from '../../utils/helper';
import { Canceler, AxiosResponse, AxiosError } from 'axios';
/**
 * 直传任务
 */
class DirectTask extends BaseTask {
  private _retryTime: number;
  constructor(file: File) {
    super(file);
    this._type = Type.SIMPLE;
    this._retryTime = 0;
  }

  upload(task: Task, cancelerHandler: Canceler, taskEventsHandler?: TaskEventsHandler): Canceler {
    let file = task.payload;
    let option = task.config;
    let that = this;
    let config: UploadConfig = extractObj(option, ['apikey', 'name', 'delay', 'host', 'mimetype', 'retryCount', 'retryMaxTime', 'timeout', 'progressInterval']) as UploadConfig;
    let uploadEvent = {
      success: taskEventsHandler.success,
      error: (err) => {
        console.timeEnd('timeout');
        if (config.retryCount > this._retryTime) {
          this._retryTime++;
          sleeper(config.retryMaxTime).then(_ => {
            taskEventsHandler.retry(file);
            // retry
            // console.log('retry simple task');
            task.cancelHandler = upload(file, config, uploadEvent);
          });
        } else {
          taskEventsHandler.failed(err);
        }
      },
    };
    cancelerHandler = upload(file, config,  uploadEvent as UploadEvent);
    return cancelerHandler;
  }

}

export default DirectTask;

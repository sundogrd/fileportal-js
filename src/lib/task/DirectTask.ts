import BaseTask from './BaseTask';
import { Type } from './type';
import { upload } from '../api/upload/upload';
import { TaskOption, TaskEventsHandler, Task } from '../types';
import { UploadEvent, UploadConfig } from '../api/upload/types';
import { extractObj } from '../../utils/helper';
import { Canceler } from 'axios';
/**
 * 直传任务
 */
class DirectTask extends BaseTask {
  constructor(file: File) {
    super(file);
    this._type = Type.SIMPLE;
  }

  upload(task: Task, cancelerHandler: Canceler, taskEventsHandler?: TaskEventsHandler): Canceler {
    let file = task.payload;
    let option = task.config;
    let config: UploadConfig = extractObj(option, ['apikey', 'name', 'delay', 'host', 'mimetype', 'retryCount', 'retryMaxTime', 'timeout', 'progressInterval']) as UploadConfig;
    let uploadEvent = {
      success: taskEventsHandler.success,
      error: taskEventsHandler.failed,
    };
    cancelerHandler = upload(file, config,  uploadEvent as UploadEvent);
    return cancelerHandler;
  }
}

export default DirectTask;

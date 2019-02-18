import BaseTask from './BaseTask';
import { Type } from './type';
import { upload } from '../api/upload/upload';
import { TaskOption, TaskEventsHandler } from '../types';
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

  upload(file: Blob, option: TaskOption, cancelerHandler: Canceler, taskEventsHandler?: TaskEventsHandler): Canceler {
    let config: UploadConfig = extractObj(option, ['apikey', 'name', 'delay', 'host', 'mimetype', 'retryCount', 'retryMaxTime', 'timeout', 'progressInterval']) as UploadConfig;
    cancelerHandler = upload(file, config,  taskEventsHandler as UploadEvent);
    return cancelerHandler;
  }
}

export default DirectTask;

import BaseTask from './BaseTask';
import { ETaskType } from './type';
import { upload } from '../api/upload/upload';
import { TaskOption, ETaskEvents, ETaskStatus, Canceler } from '../types';
import { UploadEvent, UploadConfig } from '../api/upload/types';
import { sleeper, extractObj } from '../../utils/helper';
/**
 * 直传任务
 */
class DirectTask extends BaseTask {
  private _retryTime: number;
  constructor(file: File, options: TaskOption) {
    super(file, options);
    this._type = ETaskType.SIMPLE;
    this._retryTime = 0;
  }

  upload(cancelerHandler: Canceler): Canceler {
    let that = this;
    let file = this.file;
    let option = this.option;
    let config: UploadConfig = extractObj(option, ['apikey', 'name', 'delay', 'host', 'mimetype', 'retryCount', 'retryMaxTime', 'timeout', 'progressInterval']) as UploadConfig;
    let uploadEvent = {
      success: (res) => {
        that.status = ETaskStatus.COMPLETED;
        that.eventEmitter.emit(ETaskEvents.SUCCESS, res, that);
      },
      error: (err) => {
        console.timeEnd('timeout');
        if (config.retryCount > that._retryTime) {
          that._retryTime++;
          sleeper(config.retryMaxTime).then(_ => {
            that.eventEmitter.emit(ETaskEvents.RETRY, file, that);
            // retry
            // console.log('retry simple task');
            that.cancelHandler = upload(file, config, uploadEvent);
          });
        } else {
          that.status = ETaskStatus.FAILED;
          that.eventEmitter.emit(ETaskEvents.FAIL, err, that);
        }
      },
      cancel: (message) => {
        that.status = ETaskStatus.CANCELED;
        that.eventEmitter.emit(ETaskEvents.CANCEL, message, that);
      },
      // abort: () => {
      //   that.status = ETaskStatus.FAILED;
      //   that.eventEmitter.emit(ETaskEvents.FAIL, null, that);
      // }
    };
    cancelerHandler = upload(file, config,  uploadEvent as UploadEvent);
    that.cancelHandler = cancelerHandler;
    return cancelerHandler;
  }

}

export default DirectTask;

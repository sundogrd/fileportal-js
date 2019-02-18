import { Type } from './type';
import { upload } from '../api/upload/upload';
import { TaskOption } from '../types';
import { UploadEvent } from '../api/upload/types';
import { Canceler } from 'axios';

/**
 * 上传任务
 */
abstract class BaseTask {
  protected _file: File;
  protected _retry: number = 0;// 已重试次数
  protected _createDate: Date;// 创建时间
  protected _startDate: Date;// 开始时间
  protected _endDate: Date;// 结束时间
  protected _key: string;// key文件名
  protected _progress: number = 0;// 任务进度,最大100
  protected _isSuccess: boolean = false;// 是否上传成功
  protected _isFinish: boolean = false;// 是否结束
  protected _result: Object;
  protected _error: any;
  protected _type: Type;

  constructor(file: File) {
    this._file = file;
    this._createDate = new Date();
  }

  public get file(): File {
    return this._file;
  }

  public set file(file: File) {
    this._file = file;
  }

  get type(): Type {
    return this._type;
  }

  set type(type: Type) {
    this._type = type;
  }

  get retry(): number {
    return this._retry;
  }

  set retry(value: number) {
    this._retry = value;
  }

  get createDate(): Date {
    return this._createDate;
  }

  set createDate(value: Date) {
    this._createDate = value;
  }

  get startDate(): Date {
    return this._startDate;
  }

  set startDate(value: Date) {
    this._startDate = value;
  }

  get endDate(): Date {
    return this._endDate;
  }

  set endDate(value: Date) {
    this._endDate = value;
  }

  get isSuccess(): boolean {
    return this._isSuccess;
  }

  set isSuccess(value: boolean) {
    this._isSuccess = value;
  }

  get progress(): number {
    return this._progress;
  }

  set progress(value: number) {
    this._progress = Math.min(Math.max(0, value), 100);
  }

  get result() {
    return this._result;
  }

  set result(value) {
    this._result = value;
  }

  get error() {
    return this._error;
  }

  set error(value) {
    this._error = value;
  }

  get key(): string {
    return this._key;
  }

  set key(value: string) {
    this._key = value;
  }

  get isFinish(): boolean {
    return this._isFinish;
  }

  set isFinish(value: boolean) {
    this._isFinish = value;
  }

  upload(file: Blob, option: TaskOption, eventCB?: UploadEvent): any {
    // code here
    return;
  }
}

export default BaseTask;

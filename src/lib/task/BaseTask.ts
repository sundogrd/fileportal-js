import { ETaskType } from './type';
import { TaskOption, Canceler, ETaskStatus, ETaskEvents } from '../types';
import EventEmitter from '../EventEmitter';

/**
 * 上传任务
 */
class BaseTask {
    protected _tId: string;
    protected _name: string;
    protected _file: File;
    protected _retry: number = 0;// 已重试次数
    protected _createDate: Date;// 创建时间
    protected _startDate: Date;// 开始时间
    protected _endDate: Date;// 结束时间
    protected _key: string;// key文件名
    protected _progress: number = 0;// 任务进度,最大100
    protected _isSuccess: boolean = false;// 是否上传成功
    protected _isFinish: boolean = false;// 是否结束
    protected _result: Record<string, any>;
    protected _error: any;
    protected _type: ETaskType;   // 任务类型
    protected _eventEmitter: EventEmitter; // 任务事件触发器
    protected _status: ETaskStatus; // 任务当前状态
    protected _ext: Record<string, any>;   // 用户额外参数
    protected _options: TaskOption;
    protected _cancelHanlder: Canceler | Canceler[];
    constructor(file: File, option: TaskOption) {
        this._file = file;
        this._createDate = new Date();
        this._eventEmitter = new EventEmitter();
        this._status = ETaskStatus.PREUPLOAD;
        this._options = option;
        // ID先按照时间戳的格式来，以后考虑md5
        this._tId = btoa(`${Date.now()}${Math.random().toFixed(4)}`);
    }

    public get cancelHandler() {
        return this._cancelHanlder;
    }

    public set cancelHandler(handler: Canceler | Canceler[]) {
        this._cancelHanlder = handler;
    }

    public get option() {
        return this._options;
    }

    public set option(op: TaskOption) {
        this._options = op;
    }

    public get id() {
        return this._tId;
    }

    public get name() {
        return this._name;
    }

    public get ext() {
        return this._ext;
    }

    public set ext(obj: Record<string, any>) {
        this._ext = obj;
    }

    public get status() {
        return this._status;
    }

    public set status(s: ETaskStatus) {
        this._status = s;
    }

    public set name(nm: string) {
        this._name = nm;
    }

    public get eventEmitter() {
        return this._eventEmitter;
    }

    public get file(): File {
        return this._file;
    }

    public set file(file: File) {
        this._file = file;
    }

    get type(): ETaskType {
        return this._type;
    }

    set type(type: ETaskType) {
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

    upload(cancelHandler?: Canceler | Canceler[]): any {
    // code here
        return;
    }

    on(evt: string, callback: (...args: any[]) => any): BaseTask {
        const events = [ETaskEvents.CANCEL as string, ETaskEvents.PAUSE, ETaskEvents.RESUME, ETaskEvents.SUCCESS, ETaskEvents.FAIL, ETaskEvents.RETRY, ETaskEvents.PREUPLOAD];
        if (Array.isArray(events)) {
            if (events.findIndex(e => evt === e) >= 0) {
                this.eventEmitter.on(`${evt}`, callback, this);
            } else {
                console.error('事件名称无效');
            }
        }
        return this;
    }
}

export default BaseTask;

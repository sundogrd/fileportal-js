// import * as EventEmitter from 'eventemitter3';
import BaseTask from './task/BaseTask';
import { Tasks, Task, ETaskStatus, ETaskEvents, EFilePortalEvents, Canceler } from './types';
import { ETaskType } from './task/type';
import EventEmitter from './EventEmitter';

export enum ETaskManagerEvents {
    TASK_ADDED = 'TASK_ADDED',
    TASK_BEFORE_START = 'BEFORE_UPLOAD',
    TASK_START = 'TASK_START',
    TASK_SUCCEED = 'TASK_SUCCEED',
    TASK_FAILED = 'TASK_FAILED',
    TASK_PAUSE = 'TASK_PAUSE',
    TASK_CANCEL = 'TASK_CANCEL',
    ALL_TASK_COMPLETED = 'ALL_TASK_COMPLETED',
}

export interface TaskManagerOptions {
    host: string;
}

// 负责多任务管理
export default class TaskManager {
    public tasks: Tasks;
    public eventEmitter: EventEmitter;
    public constructor() {
        this.tasks = {};
    }
    private _upload(task: BaseTask, cancelHandler: Canceler | Canceler[]) {
        return task.upload(cancelHandler);
    }

    /**
   *  添加任务
   * @param {BaseTask} task 任务
   * @returns {Task} 任务对象
   * @memberof TaskManager
   */
    public addTask(task: BaseTask): BaseTask {
        this.tasks[task.id] = task;
        this.registCallback(task);
        return task;
    }
    // 为FilePortal注册回调
    public registCallback(task): void {
        task.eventEmitter.on(ETaskEvents.SUCCESS, (ctx, res, task): void => {
            this.eventEmitter.emit(EFilePortalEvents.UPLOADED, res, task, ctx.getTasks());
            let isComplete: boolean = Object.keys(this.tasks).every((taskId: string): boolean => {
                return this.tasks[taskId].status === ETaskStatus.COMPLETED;
            });
            if (isComplete) {
                this.eventEmitter.emit(EFilePortalEvents.COMPLETED, ctx.getTasks());
            }
        }, this);
        task.eventEmitter.on(ETaskEvents.FAIL, (ctx, err, task): void => {
            this.eventEmitter.emit(EFilePortalEvents.ERROR, err, task, ctx.getTasks());
        }, this);
    }
    public getTasks(): Tasks {
        return this.tasks;
    }
    public getTask(tid: string): BaseTask {
        return this.tasks[tid];
    }
    public start(taskId: string): BaseTask {
        let task = this.tasks[taskId];
        let cancelHandler;
        task.status = ETaskStatus.UPLOADING;
        if (task.type === ETaskType.SIMPLE) {
            cancelHandler = this._upload(task, cancelHandler);
        } else if (task.type === ETaskType.CHUNK) {
            cancelHandler = [];
            this._upload(task, cancelHandler);
        }
        task.cancelHandler = cancelHandler as Canceler | Canceler[];
        return task;
    }
    public pause(taskId: string): void {
        return;
    }
    public resume(taskId: string): void {
        return;
    }
    public cancel(taskId: string, message?: string, cb?: (task?: Task) => any): void {
        let task = this.tasks[taskId];
        // 注册cancel回调
        task.on('cancel', cb);
        if (!task.cancelHandler) {
            throw new Error('必须start之后才能cancel');
        }
        let canceler: Canceler | Canceler[] = task.cancelHandler;
        if (Array.isArray(canceler)) {
            if (canceler.length === 0) {
                console.log('所有的请求都已被处理，不能取消了');
                return;
            }
            canceler.forEach(c => c(message));
        } else {
            canceler(message);
        }
        return;
    }
}

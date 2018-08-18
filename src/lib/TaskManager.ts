import { EventEmitter } from 'events';

export enum ETaskState {
  PREUPLOAD = 'preupload',  // 等待开始上传
  SCANNING = 'scanning',    // 扫描，MD5？
  UPLOADING = 'uploading',  // 上传中
  PAUSED = 'paused',        // 暂停
  CANCELED = 'canceled',    // 上传取消
  FAILED = 'failed',        // 上传失败
  COMPLETED = 'completed',  // 上传完成
}

export type Task = {
  id: string,   // 唯一？ md5？
  name: string,
  state: ETaskState,
  createAt: Date,
  updateAt: Date,
  ext: any, // 业务方自定义内容，以及progress、retryCount也存在里面
};
export type Tasks = {
  [taskId: string]: Task
};

export default class TaskManager extends EventEmitter {
  tasks: Tasks;
  constructor() {
    super()
    this.tasks = {};
  }
  addTask(): Task {
    return;
  }
  getTasks(): Tasks {
    return this.tasks;
  }
  start(taskId: string): void {
    this.emit('start', this.getTask(taskId), 'api')
    return;
  }
  pause(taskId: string): void {
    this.emit('pause', this.getTask(taskId), 'api')
    return;
  }
  resume(taskId: string): void {
    this.emit('resume', this.getTask(taskId), 'api')
    return;
  }
  cancel(taskId: string): void {
    this.emit('cancel', this.getTask(taskId), 'api')
    return;
  }

  getTask(taskId: string): Task {
    return
  }

  /**
   * 
   * @param eventName 事件名称
   * @param callback  回调函数
   */
  on(eventName: string, callback: (task: Task, source: string) => void): this {
    
    return super.on(eventName, callback)
  }

  emit(eventName: string, task: Task, source: 'api' | 'system'): boolean {
    
    return super.emit(eventName, task, source)
  }
}

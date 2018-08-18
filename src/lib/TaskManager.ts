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

export default class TaskManager {
  tasks: Tasks;
  constructor() {
    this.tasks = {};
  }
  addTask(): Task {
    return;
  }
  getTasks(): Tasks {
    return this.tasks;
  }
  start(taskId: string): void {
    return;
  }
  pause(taskId: string): void {
    return;
  }
  resume(taskId: string): void {
    return;
  }
  cancel(taskId: string): void {
    return;
  }
}

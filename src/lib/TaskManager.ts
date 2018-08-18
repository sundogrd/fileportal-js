export enum ETaskStatus {
  PREUPLOAD = 'preupload',
  UPLOADING = 'uploading',
  PAUSED = 'paused',
}

export type Task = {
  id: string,   // 唯一？ md5？
  name: string,
  status: ETaskStatus,
  createAt: Date,
  updateAt: Date,
  ext: any, // 业务方自定义内容，以及progress也存在里面
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

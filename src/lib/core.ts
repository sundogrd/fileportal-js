import { upload } from './api/upload';
import { EMimeType } from '../types/upload';
import Logger from './logger';

export interface FilePortalOptions {
  debug: boolean;
  chunkSize: number;
  accept: EMimeType;

  [option: string]: any;
  tokenFun: () => Promise<string>;
}

export class FilePortal {
  debug;
  tasks: Task[]
  taskId: number = 0  // taskId automately increases
  count: number = 0   // tasks' total amount

  constructor(options?: FilePortalOptions) {
    this.debug = new Logger('filePortal/core');
  }

  upload(file: any) {
    this.debug.log('upload start');
    /* istanbul ignore next */
    return upload();
  }

  private generateNewTask() {
    let task = new Task(this.taskId)
    this.taskId++
    this.addTask(task)
  }

  private taskCanceledOrComplete(taskId: number) {
    for(let i in this.tasks) {
      if(this.tasks[i].taskId == taskId) {
        this.tasks.splice(+i, 1)
        this.count--
      }
    }
  }

  /**
   * 
   * @param task represent a process of a file to be uploaded
   */
  private addTask(task: Task) {
    this.tasks.push(task)
    this.count++
  }

  /**
   * 
   * @param eventName 事件名称
   * @param toDo      事件处理方法
   */
  on(eventName: string, toDo: Function) {
    this.tasks.forEach(function(task) {
      task.on(eventName, toDo)
    }) 

    return this
  }

  /**
   * 
   * @param id a task's id
   */
  getTask(id: number): Task {
    for(var task of this.tasks) {
      if (task.taskId == id) {
        return task
      }
    }

    return null
  }

  private notifyAllTasks(eventName: string): void {
    
  }

  private notifyOneTask(taskId: number,eventName: string): void {

  }

  // trigger

}

// one file one Task
class Task {
  event: Function[]
  taskId: number

  constructor(taskId: number) {
    this.taskId = taskId
  }

  // addEventListener
  on(eventName: string, toDo: Function) {
    this.event[eventName] = toDo

    return this
  }

  // event
}

import BaseTask from './BaseTask';
import { Type } from './type';
import { upload } from '../api/upload/upload';
import { TaskOption, Task, TaskEventsHandler, TaskStatus } from '../types';
import { UploadEvent, UploadConfig } from '../api/upload/types';
import { Canceler, AxiosResponse, AxiosError } from 'axios';
import { extractObj, sleeper } from '../../utils/helper';
/**
 * 分块任务
 */
class ChunkTask extends BaseTask {
  task: Task;
  responses: AxiosResponse[];
  errors: AxiosError[];
  // 分块
  private _blocks: Block[] = [];
  private _blockSize: number = 0;
  private _chunkSize: number = 0;
  /**
   * 构造函数
   * @param file
   * @param blockSize 块大小
   * @param chunkSize 片大小
   */
  constructor(file: File, blockSize: number, chunkSize: number) {
    super(file);
    this._blockSize = blockSize;
    this._chunkSize = chunkSize;
    this.spliceFile2Block();
    this._type = Type.CHUNK;
    this.responses = [];
    this.errors = [];
  }

  /**
   * 将文件分块
   */
  public spliceFile2Block(): void {
    this._blocks = [];
    let fileSize: number = this._file.size;
    let file: File = this._file;
    // 总块数
    let blockCount = Math.ceil(fileSize / this._blockSize);

    for (let i = 0; i < blockCount; i++) {
      let start: number = i * this._blockSize; // 起始位置
      let end: number = start + this._blockSize; // 结束位置
      // 构造一个块实例
      let block: Block = new Block(
        start,
        end,
        file.slice(start, end),
        this._chunkSize,
        file
      );
      // 添加到数组中
      this._blocks.push(block);
    }
  }

  /**
   * 获取所有的block
   * @returns {Block[]}
   */
  get blocks(): Block[] {
    return this._blocks;
  }

  /**
   * 获取正在处理的block
   * @returns {Block}
   */
  get processingBlock(): Block {
    for (let block of this._blocks) {
      if (!block.processing) {
        continue;
      }
      return block;
    }
    throw Error('找不到正在处理的Block');
  }

  /**
   * 获取未处理的block
   * @returns {Block}
   */
  get unProcessingBlocks(): Block[] {
    let blocks: Block[] = [];
    for (let block of this._blocks) {
      if (block.processing || block.isFinish) {
        continue;
      }
      blocks.push(block);
    }
    return blocks;
  }

  /**
   * 获取正在处理的blocks
   * @returns {Block}
   */
  get processingBlocks(): Block[] {
    let blocks: Block[] = [];
    for (let block of this._blocks) {
      if (!block.processing) {
        continue;
      }
      blocks.push(block);
    }
    return blocks;
  }

  get finishedBlocksSize(): number {
    return this.finishedBlocks.length;
  }

  get finishedBlocks(): Block[] {
    let blocks: Block[] = [];
    for (let block of this._blocks) {
      if (block.isFinish) {
        blocks.push(block);
      }
    }
    return blocks;
  }

  get chunks(): Chunk[] {
    let array: Chunk[] = [];
    for (let block of this._blocks) {
      for (let chunk of block.chunks) {
        array.push(chunk);
      }
    }
    return array;
  }

  /**
   * 获取正在处理的chunk
   * @returns {Block}
   */
  get processingChunk(): Chunk {
    for (let block of this._blocks) {
      if (!block.processing) {
        continue;
      }
      for (let chunk of block.chunks) {
        if (!chunk.processing) {
          continue;
        }
        return chunk;
      }
    }
    throw Error('找不到正在处理的Chunk');
  }

  /**
   * 总共分片数量(所有分块的分片数量总和)
   * @returns {number}
   */
  get totalChunkCount(): number {
    let count = 0;
    for (let block of this._blocks) {
      count += block.chunks.length;
    }
    return count;
  }

  // code here
  upload(task: Task, cancelerHandler: Canceler[], taskEventsHandler?: TaskEventsHandler) {
    this.task = task;
    let option = task.config;
    let config: UploadConfig = extractObj(option, ['apikey', 'name', 'delay', 'host', 'mimetype', 'retryCount', 'retryMaxTime', 'timeout', 'progressInterval']) as UploadConfig;
    // 分块上传 上传之前需查看是否已经上传该块 需要服务器端支持 待续
    // code here
    const { concurrency } = option;
    for (let i = 0; i < concurrency && i < this.blocks.length; i++) {
      let block = this.blocks[i];
      block.processing = true;
      this._excutor(block, config, cancelerHandler, taskEventsHandler);
    }
    return cancelerHandler;
  }

  /**
   * 负责上传分块，自动重试配置次数，所有分快完成则自动调动回调
   * @private
   * @param {Block} block
   * @param {UploadConfig} config
   * @param {Canceler[]} cancelers
   * @param {TaskEventsHandler} [taskEventsHandler]
   * @returns
   * @memberof ChunkTask
   */
  private _excutor(block: Block, config: UploadConfig, cancelers: Canceler[], taskEventsHandler?: TaskEventsHandler) {
    let that = this;
    console.log('_excutor');
    return this._upload(block, config, cancelers).then((res) => {
      // console.log('this is correct res');
      this.responses.push(res as AxiosResponse);
      // 判断是否还有剩余任务
      if (that.unProcessingBlocks.length) {
        let unProcessBlock = that.unProcessingBlocks[0];
        unProcessBlock.processing = true;
        return that._excutor(unProcessBlock, config, cancelers, taskEventsHandler);
      }
      // 所有分块是否完成
      if (that.finishedBlocksSize === that.blocks.length) {
        // 任务完成
        if (that.task.state === TaskStatus.COMPLETED) {
          return;
        } else {
          that.task.state = TaskStatus.COMPLETED;
          taskEventsHandler.success(this.responses);
        }
      }
    }, err => {
      // retry code
      if (config.retryCount > block.retryTime) {
        block.retryTime++;
        return sleeper(config.retryMaxTime).then(_ => {
          taskEventsHandler.retry(block);
          return that._excutor(block, config, cancelers, taskEventsHandler);
        });
      } else {
        this.errors.push(err);
        // 此时可能已经成功上传几个分片了
        // code here
        taskEventsHandler.failed(this.errors);
        return Promise.reject(err);
      }
    });
  }
/**
 * 上传单个分块
 * 返回上传结果Promise
 * @private
 * @param {Block} block
 * @param {UploadConfig} option
 * @param {Canceler[]} cancelers
 * @returns {Promise<any>}
 * @memberof ChunkTask
 */
  private _upload(block: Block, option: UploadConfig, cancelers: Canceler[]): Promise<AxiosError | AxiosResponse> {
    return new Promise((resolve, reject) => {
      const uploadEvents: UploadEvent = {
        success: (res?: AxiosResponse) => {
          block.isFinish = true;
          resolve(res);
        },
        error: (err?: AxiosError) => {
          // code here
          reject(err);
        },
      };
      let canceler = upload(block.data, option, uploadEvents);
      cancelers.push(canceler);
    });
  }
}

/**
 * 分块，分块大小七牛固定是4M
 */
class Block {
  private _data: Blob; // 块数据
  private _start: number; // 起始位置
  private _end: number; // 结束位置
  private _chunks: Chunk[] = [];
  private _isFinish: boolean = false; // 是否上传完成
  private _processing: boolean = false; // 是否正在上传
  private _file: File;
  private _retryTime: number; // 重传次数

  /**
   *
   * @param start 起始位置
   * @param end 结束位置
   * @param data 块数据
   * @param chunkSize 分片数据的最大大小
   * @param file 分块所属文件
   */
  constructor(
    start: number,
    end: number,
    data: Blob,
    chunkSize: number,
    file: File
  ) {
    this._data = data;
    this._start = start;
    this._end = end;
    this._file = file;
    this._retryTime = 0;
    // 暂不分块
    // this.spliceBlock2Chunk(chunkSize);
  }

  /**
   * 将块分片
   */
  private spliceBlock2Chunk(chunkSize: number): void {
    let blockSize: number = this._data.size;
    let data: Blob = this._data;
    // 总片数
    let chunkCount = Math.ceil(blockSize / chunkSize);
    for (let i: number = 0; i < chunkCount; i++) {
      let start: number = i * chunkSize; // 起始位置
      let end: number = start + chunkSize; // 结束位置
      // 构造一个片实例
      let chunk: Chunk = new Chunk(start, end, data.slice(start, end), this);
      // 添加到数组中
      this._chunks.push(chunk);
    }
  }

  get retryTime(): number {
    return this._retryTime;
  }

  set retryTime(time: number) {
    this._retryTime = time;
  }

  /**
   * 是否上传中
   * @returns {boolean}
   */
  get processing(): boolean {
    return this._processing;
  }

  set processing(value: boolean) {
    this._processing = value;
  }

  /**
   * 分块所属的文件
   * @returns {File}
   */
  get file(): File {
    return this._file;
  }

  /**
   * 是否已经结束
   * @returns {boolean}
   */
  get isFinish(): boolean {
    return this._isFinish;
  }

  set isFinish(value: boolean) {
    this._isFinish = value;
  }

  /**
   * 返回分块数据
   * @returns {Blob}
   */
  get data(): Blob {
    return this._data;
  }

  /**
   * 返回字节起始位置
   * @returns {number}
   */
  get start(): number {
    return this._start;
  }

  /**
   * 返回字节结束位置
   * @returns {number}
   */
  get end(): number {
    return this._end;
  }

  get chunks(): Chunk[] {
    return this._chunks;
  }
}

/**
 * 分片，分片大小可以自定义，至少1字节
 */
class Chunk {
  private _start: number; // 起始位置
  private _end: number; // 结束位置
  private _data: Blob; // 片数据
  private _processing: boolean = false; // 是否正在上传
  private _isFinish: boolean = false; // 是否上传完成
  private _ctx: string; // 前一次上传返回的块级上传控制信息,第一个chunk此值为空
  private _block: Block; // 分片所属的块对象
  private _host: string; // 前一次上传返回的指定上传地址

  /**
   *
   * @param start 字节起始位置
   * @param end 字节结束位置
   * @param data 分片数据
   * @param block 分块对象
   */
  constructor(start: number, end: number, data: Blob, block: Block) {
    this._start = start;
    this._end = end;
    this._data = data;
    this._block = block;
  }

  /**
   * 返回chunk所属的Block对象
   * @returns {Block}
   */
  get block(): Block {
    return this._block;
  }

  /**
   * 返回字节起始位置
   * @returns {number}
   */
  get start(): number {
    return this._start;
  }

  /**
   * 返回字节结束位置
   * @returns {number}
   */
  get end(): number {
    return this._end;
  }

  /**
   * 返回分片数据
   * @returns {Blob}
   */
  get data(): Blob {
    return this._data;
  }

  /**
   * 是否已经结束
   * @returns {boolean}
   */
  get isFinish(): boolean {
    return this._isFinish;
  }

  set isFinish(value: boolean) {
    this._isFinish = value;
  }

  get host(): string {
    return this._host;
  }

  set host(value: string) {
    this._host = value;
  }

  /**
   * 是否上传中
   * @returns {boolean}
   */
  get processing(): boolean {
    return this._processing;
  }

  set processing(value: boolean) {
    this._processing = value;
  }

  /**
   * 返回上传控制信息(七牛服务器返回前一次上传返回的分片上传控制信息,用于下一次上传,第一个chunk此值为空)
   * @returns {string}
   */
  get ctx(): string {
    return this._ctx;
  }

  set ctx(value: string) {
    this._ctx = value;
  }
}

export { ChunkTask, Block, Chunk };

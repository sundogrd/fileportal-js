# fileportal-js

## 1. 基本功能

### 1.1 概览

该SDK是为了博客的上传文件功能所开发，默认上传到[幻日研发团队](https://github.com/sundogrd)资源服务器，用户可自定义上传地址。

### 1.2 目标

1. 单文件上传
2. 多文件上传
3. 小文件简单上传
4. 大文件分片上传
5. 取消上传
6. 上传进度
7. 暂停/恢复上传
8. 图片预览
9. 断点续传

## 2. API

### 2.1 初始化

```javascript
const client = new FilePortal(option: FilePortalOption);
```
**FilePortalOption**

name | type | default | ismust |des
---- | --- | --- | --- | ---
apikey | string | '' | true | 注册apikey
isClient | boolean | true | false | 是否是客户端
token | string | '' | true | 身份token
host | string | '' | false | 全局的上传地址，可被任务上传地址覆盖
chunkStartSize | number | 1M | false | 默认上传方式时文件大于多少自动分片
concurrency | number | 3 | false | 分片上传时并发请求数
chunkSize | number | 1M | false | 分片大小
progressInterval | number | 100 | false | progress tricker 间隔时间
retryCount | number | 2 | false | 请求失败自动重试次数
retryMaxTime | number | 500 | false | 重试间隔
timeout | number | 5000 | false | 超时时间
delay | number | 0 | false | 延迟请求发送时间
mimetype | string | 'application/ocet-stream' | false | 默认文件类型
smart | boolean/simple/multipart | true | false | 是否智能分片


### 2.2 添加任务

```
let task: Task = client.addTask(file: String|Blob, option:TaskOption) 
```

**TaskOption extends FilePortalOption**

name | type | default | ismust |des
---- | --- | --- | --- | ---
name | string | 'task' | false | 任务名称
extra | object | {} | false | 自定义额外信息

### 2.3 开始任务

```javascript
let task: Task = client.start(tid: String);

eg: 
let {tid} = client.addTask('test', {});
let task = client.start(tid) 
```

### 2.4 事件监听

#### 2.4.1 FilePortal事件监听

```javascript
client.on(evt: String, cb: EventCB)
```
**PS: client.on('uploaded', cb) 等同于client.uploaded(cb);**


**EVENT**

event | des | callback
--- | --- | ---
'started' | 任务开始，只要有一个任务start则会回调 | (task?: Task, tasks?: Tasks) => any
'uploaded' | 某个任务完成回调 | (res?: any, task?: Task, tasks?: Tasks) => any
'completed' | 所有任务完成回调事件 | (tasks?: Tasks) => any
’error' | 只要有一个任务出错则会回调 | (err?: any, task?: Task, tasks?: Tasks) => any

#### 2.4.1 Task事件监听

```javascript
client.getTask(tid: String).on(evt: String, cb: EventCB) 
eg: 
let {tid} = client.addTask('test', {});
let task = client.start(tid);
task.on('success', (res, task, tasks) => {
    // code here
});
```
**EVENT**

event | des | callback
--- | --- | ---
'preupload' | 任务之前回调 | (task?: Task) => any
'retry' | 任务重试 | (fileOrBlock?: any, task?: Task) => any
'resume' | 任务恢复 | (task?: Task) => any
'pause' | 任务暂停 | (task?: Task) => any
'cancel' | 任务取消回调 | (task?: Task) => any
'fail' | 任务出错回调 | (err?: any, task?: Task) => any
'success' | 任务成功回调 | (res?: any, task?: Task) => any

### 2.5 取消任务

```javascript
let task: Task = client.cancel(tid: String, message?: String, cb?: (task?: Task) => any);

eg: 
let {tid} = client.addTask('test', {});
let task = client.cancel(tid) 
```

### 2.6 上传结果

&emsp;服务器能够接收到的内容如下:


name | des | content
--- | --- | ---
option | 上传对象基本信息 | `{size: 文件大小, type: '文件类型'}`
chunk | 对于分块上传方式有此信息 | `{chunkIndex: 第几块, size: 当前分块大小,  totalChunks: 所有分块数目, file: 目标文件}`


## 3. TODO

- [ ] 修复各种bug
- [ ] 增加pause resume
- [ ] 增加progress控制
- [ ] 细分分片任务的chunkError 和 taskError级别
- [ ] 断点续传
- [ ] 文件id的制定，现在是时间戳，但是这样并不能保证唯一性，md5如果文件太大也不可行
- [ ] 秒传
- [ ] 图片预览
- [ ] 大文件上传支持（现在估计支持得不是很好)
- [ ] 拖拽上传
- [ ] 后端
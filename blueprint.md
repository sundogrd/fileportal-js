# FilePortal蓝图
本项目是一个文件上传的JS SDK，初版功能主要包括
* 音频上传
* 流量控制
* 大文件分块上传
* 暂停与取消上传
* 多文件上传

## API设计

1. 构造函数
我个人认为sdk需要进行实例化，理由有几个，一个是实例化sdk可以让一个应用具有多个不同配置的实例，对于一些应用场景应该是很必要的。
```Javascript
const client = new FilePortal(options: IOptions)
```
关于配置我暂时想到如下配置
* tokenFun (() => Promise<string>) 一个函数返回Promise，resolve的值就是token，用于上传服务器的鉴权，隔离了客户端与业务方服务器的鉴权。（thinking这种方式与token写死然后refresh的方式）
* debug 主要用于开启console或者其他的调试效果？详情见调试方案
* chunkSize 分块大小
* accept 过滤文件类型，mimetype


2. （重置）上传凭证设置方法（废弃？）
由于凭证可能在过程中过期?，需要对外提供一个方法供上传凭证token的更新??。
这个有意义吗？一个token一次上传吗，还是说token是给sdk用的可能过期？？？？？？（thinking）

3. 事件监听机制
提供上传过程中的事件机制。（要附带源头，比如取消一个上传，说明源头是系统本身还是用户自己调API取消的）。同时需要能够跟踪一个具体的任务（在多文件上传中尤为重要，比如progress）
事件暂时想到如下
* 上传任务进入队列:enqueued（多文件上传）
* 上传任务开始:start（真正开始传输）
* 上传任务暂停:pause
* 上传任务取消:cancel
* 上传任务进度变更:process
* 上传任务成功:complete
* 上传任务失败并开始重传（暂时不加重传）
* 上传任务失败并重传次数达到上线（暂时不加重传）
* 分块合并事件:fileMerge    ？（这个能给吗，业务场景是什么）

所有事件返回当前Task的对象
// 全局级别事件监听
```Typescript
client.on(event, (task: Task, source: 'api' | 'system') => {

})
```
// task级别事件监听（方便多文件上传时进行组件化处理，应该能做。。）
```Typescript
client.getTask(taskId).on(event, (task: Task, source: 'api' | 'system') => {

})
```


4. 流量控制（pending）
设置uploader整体上传的流量控制。（可能需要服务器端支持）

5. 多文件上传管理
这部分要求做到当前正在上传的并发数的控制，同时上传完成后自动开始下一个上传
```Typescript
interface IOptions {
    // ...
    poolSize: number; // 最大连接数
}
const client = new FilePortal(options: IOptions)
client.setOptions(options: IOptions)
```


6. 上传，核心部分，用于文件上传到服务器
这部分由于需要多文件上传
```Typescript
client.add = ({
    token: () => Promise<string> | string, // 支持放一个返回promise的函数或者单纯的string，设置上传凭证
    file: File,
    extra: {}, // 扩展用
    config: {}  // 文件特定的设置？
}) => {}

client.start = (tid) => {}
client.pause = (tid) => {}
client.resume = (tid) => {}
client.cancel = (tid) => {}

client.getTasks = () => {} // 获取全部任务（包括已完成的，给调用者自己过滤）

```

7. 调试方案（pending）
参考quill的debug方案。

## 黑科技预定
1. 异步加载的模块picker有点黑科技啊，考虑后期加入一下

## TODO
1. 扫描生成MD5为id
2. 插件机制（designing）
3. 监测online/offline处理（自动pause和resume？）
4. drag and drop（picker？）

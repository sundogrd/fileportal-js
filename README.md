# fileportal-js

认认真真做一个设计

1. 该SDK默认上传到我们私有服务器，(后续 ：可业务方提供上传地址 -- 需要提供后端接口)
2. 分级： 任务级别和整个流程级别
3. 提供大文件上传和自适应上传接口（10M以上大文件）upload simpleUpload multipartUpload
4. 大于1M文件自动分片
5. 上传用户可自定义参数：
    1. 基本参数： 文件名 文件类型 文件 重传
    1. 对于自适应上传方式（chunkSize concurrency )
    2. 对于小文件上传方式
6. 原子上传事件：(内部)
    1. uploading
    2. progress
    3. retry
    4. error
    5. uploaded
    6. init
    7. abort
7. 任务上传事件
    1. preupload
    <!-- 2. uploding -->
    3. pause
    4. resume
    5. cancel
    6. success
    7. failed
    8. retry
8. filePortal事件:
    1. start
    <!-- 2. uploading -->
    3. uploaded // 某个任务完成触发
    4. error
    5. complete   // 所有任务完成触发
9. filePortal接口
    1.  addTask
    2.  on => 对应事件
    3.  setOption 全局配置参数， 用户自定义
    <!-- 4.  simpleUpload
    5.  upload
    6.  multipartUpload -->
    7.  start // 自适应上传 参数可配置是否自适应上传方式 ， 可强制简单或者复杂上传方式
    8.  startAll
    9.  cancel
    10. cancelAll
    11. stop
    12. stopAll



client.on('success', cb)

client.start(tid)

client.getTask.on('success')

import FilePortal from "src/lib/core";
import BaseTask from 'src/lib/task/BaseTask';
import { FilePortalOptions } from 'src/lib/types';

// !!!!! https://github.com/lsxiao/qiniu4js

export class QiniuFilePortal extends FilePortal {
    public constructor(options?: FilePortalOptions) {
        super(options)
    }
}


class QiniuTask extends BaseTask {
    public upload() {

    }
}
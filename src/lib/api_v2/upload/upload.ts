import {
    State, UploadOptions, UploadConfig, Context, Status
  } from './types';
import Config from '../../../config'
import { getFile, closeFile, getPart } from '../../../utils/file';
import {requestWithSource} from '../request'
/**
 * @private
 */
const statuses = {
    INIT: Status.INIT,
    RUNNING: Status.RUNNING,
    DONE: Status.DONE,
    FAILED: Status.FAILED,
    PAUSED: Status.PAUSED,
};

export const upload = async (fileStringOrBlob, options: UploadOptions, storeOptions, token = {}): Promise<any> => {
    const fileBlob: any = await getFile(fileStringOrBlob);
    if ((fileBlob.size !== undefined && fileBlob.size === 0) || fileBlob.length === 0) {
      return Promise.reject(new Error('file has a size of 0.'));
    }
    // Configurables
    const config: UploadConfig = {
        ...Config,
        ...options,
    };
    
    const initialState: State = {
        // parts: {},
        progressTick: null,
        previousPayload: null,
        retries: {},
        status: statuses.INIT,
    };

    const context: Context = {
        file: fileBlob,
        config,
        state: initialState,
    };
    return uploadFile(context, token);
};

const getProgress = ({ config, state, file }: Context) => {
    console.log('this is get progress');
    return {totalPercent: 10};
}


/**
 * Starts the multi-part upload flow (/multipart/start)
 * @private
 * @param file    Valid File instance
 * @param config  Upload config
 * @returns {Promise}
 */
export const start = ({ config, file }: Context): Promise<any> => {
    const fields: any = {
        apikey: config.apikey,
        filename: file.name,
        mimetype: config.mimetype || file.type || 'application/octet-stream',
        size: file.size,
    };
    // Security
    // if (config.policy && config.signature) {
    //     fields.policy = config.policy;
    //     fields.signature = config.signature;
    // }
    // Intelligent Ingestion
    // if (config.intelligent) {
    //     fields.multipart = true;
    // }
    const formData = Object.keys(fields).reduce((rt, field: string) => {
        const value = fields[field];
        rt[field] = typeof value === 'string' ? value : JSON.stringify(value);
        return rt;
    }, {});
    return requestWithSource('post', `${config.host}/upload`)
        .timeout(config.timeout)
        .field(formData);
};

export const uploadFile = async (ctx: Context, token: any) : Promise<any> => {
    const { file, state, config } = ctx;
    const startProgress = (onProgress?: any): void => {
        if (onProgress) {
          state.progressTick = setInterval(() => {
            const payload = getProgress(ctx);
            if (payload.totalPercent === 100) {
              clearInterval(state.progressTick);
            }
            onProgress(payload);
          }, config.progressInterval);
        }
    };
    
    const finishProgress = (onProgress?: any): void => {
        if (onProgress) {
            onProgress({
            totalBytes: file.size,
            totalPercent: 100,
            });
            clearInterval(state.progressTick);
        }
    };

    /**
    * Will pause progress tick and set state
    */
    token.pause = (): void => {
        if (state.status === statuses.RUNNING) {
            // state.status = statuses.PAUSED;
            // clearInterval(state.progressTick);
        }
    };

    /**
    * Will resume flow and start progress tick again
    */
    token.resume = (): void  => {
        if (state.status === statuses.PAUSED) {
            // state.status = statuses.RUNNING;
            // startProgress(config.onProgress);
        }
    }

    const cancel = new Promise((_, reject) => {
        token.cancel = (): void  => {
            if (state.status === statuses.RUNNING || state.status === statuses.PAUSED) {
                // failAndCleanUp();
                reject(new Error('Upload cancelled'));
            }
        };
    });
    
    const cancellable = (p: Promise<any>): Promise<any> => {
        return Promise.race([cancel, p]);
    };

    // 运行的代码
    state.status = statuses.RUNNING;
    const { body: params } = await cancellable(start(ctx));
    ctx.params = params;
};

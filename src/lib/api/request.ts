import axios, { AxiosInstance, AxiosRequestConfig, CancelToken, Canceler } from 'axios';
import baseConfig from '../../config/request';
import { RequestInstance } from './upload/types';

// 默认1级配置
export function createAxios(): RequestInstance {

  let instance: RequestInstance = axios.create({
    ...baseConfig,
  }); // 默认
  let cancelToken = new axios.CancelToken((cancel => {
    instance.cancelHandler = cancel;
  }));
  modifyAxiosConfig(instance, {
    cancelToken: cancelToken,
  });
  return instance;
}

// 2级配置
export function modifyAxiosConfig(instance: AxiosInstance, options: AxiosRequestConfig): AxiosInstance {
  Object.keys(options).forEach(option => {
    instance['defaults'][option] = options[option]; // 一级配置
  });
  return instance;
}

export function getCancelHandler(instance: RequestInstance) {
  return instance.cancelHandler;
}

function request(url: string, data?: any, config?: AxiosRequestConfig) {
  return createAxios().post(url, data, config);
}

export default request;

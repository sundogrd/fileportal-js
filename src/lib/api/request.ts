import axios, { AxiosInstance, AxiosRequestConfig, CancelToken, Canceler } from 'axios';
import baseConfig from '../../config/request';
import { RequestInstance } from './upload/types';

// 默认1级配置
export function createAxios(): RequestInstance {
  let instance: RequestInstance = axios.create({
    ...baseConfig,
  }); // 默认
  function cancelInterceptor(config: AxiosRequestConfig): AxiosRequestConfig {
    config.cancelToken = new axios.CancelToken((cancel => {
      instance.cancelHandler = cancel;
    }));
    return config;
  }

  instance.interceptors.request.use(cancelInterceptor, error => Promise.reject(error));
  return instance;
}

// 2级配置
export function modifyAxiosConfig(instance: AxiosInstance, options: AxiosRequestConfig): AxiosInstance {
  Object.keys(options).forEach(option => {
    instance['defaults'][option] = options[option]; // 一级配置
  });
  return instance;
}

export function getCancelHandler(instance: RequestInstance): Canceler {
  return instance.cancelHandler;
}

function request(url: string, data?: any, config?: AxiosRequestConfig) {
  return createAxios().post(url, data, config);
}

export default request;

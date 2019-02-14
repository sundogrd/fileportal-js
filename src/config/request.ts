import { AxiosRequestConfig } from 'axios';

const config: AxiosRequestConfig =  {
  timeout: 10000,
  withCredentials: false, // 默认的
    // `xsrfCookieName` 是用作 xsrf token 的值的cookie的名称
  xsrfCookieName: 'XSRF-FILEPORTAL-TOKEN', // default
    // `xsrfHeaderName` 是承载 xsrf token 的值的 HTTP 头的名称
  xsrfHeaderName: 'X-XSRF-FILEPORTAL-TOKEN', // 默认的
  maxContentLength: 200000,
};

export default config;

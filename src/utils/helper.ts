import { resolve } from 'path';

export function getObjType(obj: any): string {
  return Object.prototype.toString.call(obj).slice(8, -1);
}

export function sleeper(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function noop(): void {
  return ;
}

export function extractObj(obj: Object, keys: string[]): any {
  return Object.keys(obj).reduce((ret: Object, key: string) => {
    if (keys.includes(key)) {
      ret[key] = obj[key];
    }
    return ret;
  }, {});
}

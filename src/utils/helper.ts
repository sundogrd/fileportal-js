export function getObjType(obj: any): string {
  return Object.prototype.toString.call(obj).slice(8, -1);
}

export function sleeper(ms) {
  return new Promise(resolve => setTimeout(() => resolve(), ms));
}

export function noop(): void {
  return ;
}

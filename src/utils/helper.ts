export function getObjType(obj: any): string {
  return Object.prototype.toString.call(obj).slice(8, -1);
}

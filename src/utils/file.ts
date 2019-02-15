import { atob } from 'abab';
import { getMD5 } from './md5';
import { PartObj, Context } from '../lib/api/upload/types';

/**
 * Is file?
 *
 * @private
 * @return {Boolean}
 */
const isFile = (file: any): boolean => {
  return file.toString() === '[object File]';
};

/**
 * Is blob?
 *
 * @private
 * @param blob
 * @returns {Boolean}
 */
const isBlob = (blob: any): boolean => {
  return isFile(blob) || (blob.toString() === '[object Blob]');
};

/**
 * Convert encoded base64 string or dataURI to blob
 * @param b64data     String to decode
 * @param sliceSize   Byte quantity to split data into
 * @private
 * @returns {Blob}
 */
const b64toBlob = (b64Data: string, sliceSize = 512) => {
  let byteString;
  let contentType = '';
  if (b64Data.split(',')[0].indexOf('base64') >= 0) {
    byteString = b64Data.split(',')[1];
  }
  if (byteString !== undefined) {
    contentType = b64Data.split(',')[0].split(':')[1].split(';')[0];
    b64Data = decodeURI(byteString);
  }
  const byteCharacters = atob(b64Data); // base64解码
  const byteArrays: any[] = [];
  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i += 1) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
};

/**
 * Get start and end for slice operations
 * @private
 * @returns Object where keys are `start` and `end`
 */
const getRange = ({ config, file }: Context, partNumber: number) => {
  const start = partNumber * config.partSize;
  const end = Math.min(start + config.partSize, file.size);
  return { start, end };
};

/**
 * Slice file into a single part
 * @private
 */
const sliceFile = (ctx: Context, partNumber: number) => {
  const slice = File.prototype.slice;
  const { start, end } = getRange(ctx, partNumber);
  return slice.call(ctx.file, start, end);
};

/**
 * Reads file as ArrayBuffer using HTML5 FileReader implementation
 * @private
 * @param file  Valid File instance
 * @returns     {Promise}
 */
const readFile = (file: any) => {
  return new Promise((resolve, reject) => {
    let reader;
    if (File && FileReader && Blob) {
      reader = new FileReader();
      reader.onloadend = resolve;
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error('The File APIs are not fully supported by your browser'));
    }
  });
};

/**
 * Reads a slice of a file based on the current part.
 * @private
 */
export const getPart = async (part: PartObj, ctx: Context): Promise<PartObj> => {
  const evt = await readFile(sliceFile(ctx, part.number)) as any;
  const buffer = evt.target.result;
  const newPart = {
    ...part,
    buffer,
    size: buffer.byteLength,
    md5: await getMD5(buffer, null),
  };
  return newPart;
};

/**
 * Get a Blob from a File or string.
 * @private
 */
export const getFile = (fileOrString: String | Blob): Blob | TypeError => {
  let file: any = fileOrString;
  if (typeof fileOrString === 'string') {
    file = b64toBlob(file);
  }
  if (!file || !isBlob(file)) {
    return new TypeError('File argument is not a valid Blob');
  }
  return file;
};

/**
 * This is a noop in browsers
 */
export const closeFile = (fd: number) => undefined;

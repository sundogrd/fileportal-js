import CryptoJS from 'crypto-js';

function readChunked(file: Blob, chunkCallback, endCallback: (err: any) => void) {
  let fileSize   = file.size;
  let chunkSize  = 4 * 1024 * 1024; // 4MB
  let offset     = 0;

  let reader = new FileReader();
  reader.onload = function() {
    if (reader.error) {
      endCallback(reader.error || {});
      return;
    }
    offset += (reader.result as any).length;
      // callback for handling read chunk
      // TODO: handle errors
    chunkCallback(reader.result, offset, fileSize);
    if (offset >= fileSize) {
      endCallback(null);
      return;
    }
    readNext();
  };

  reader.onerror = function(err) {
    endCallback(err || {});
  };

  function readNext() {
    let fileSlice = file.slice(offset, offset + chunkSize);
    reader.readAsBinaryString(fileSlice);
  }
  readNext();
}

export function getMD5(blob: Blob, cbProgress: (progress: number) => void) {
  return new Promise((resolve, reject) => {
    let md5 = CryptoJS.algo.MD5.create();
    readChunked(blob, (chunk, offs, total) => {
      md5.update(CryptoJS.enc.Latin1.parse(chunk));
      if (cbProgress) {
        cbProgress(offs / total);
      }
    }, err => {
      if (err) {
        reject(err);
      } else {
            // TODO: Handle errors
        let hash = md5.finalize();
        let hashHex = hash.toString(CryptoJS.enc.Hex);
        resolve(hashHex);
      }
    });
  });
}

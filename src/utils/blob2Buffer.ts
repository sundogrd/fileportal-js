/* global Blob, FileReader */

export default function blobToBuffer (blob: Blob) {
  if (typeof Blob === 'undefined' || !(blob instanceof Blob)) {
    throw new Error('first argument must be a Blob');
  }
  let reader = new FileReader();

  return new Promise((resolve, reject) => {
    function onLoadEnd (e) {
      reader.removeEventListener('loadend', onLoadEnd, false);
      if (e.error) {
        reject(e.error);
      } else {
        resolve(Buffer.from(reader.result as string));
      }
    }

    reader.addEventListener('loadend', onLoadEnd, false);
    reader.readAsArrayBuffer(blob);
  });

}

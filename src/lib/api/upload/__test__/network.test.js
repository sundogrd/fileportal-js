const network = require('../network')
const getMD5 = require('../../../../utils/md5').getMD5
const blob2Buffer = require('../../../../utils/blob2Buffer').default

const makeFile = (data, type = 'image/gif') => {
  return new Blob([data], { type });
};

const smallFile = makeFile('helloworld');

describe('post request for uploading', () => {
  // it('start', (done) => {
  //   const ctx = {
  //     config: {
  //       host: 'http://127.0.0.1:8898',
  //       customName: 'test.txt',
  //       timeout: 3000,
  //     },
  //     file: {
  //       fd: 13,
  //       name: 'afsf.txt',
  //       size: 148913,
  //       type: 'image/gif',
  //     },
  //   }
  //   network.start(ctx).then(res => {
  //     console.log(res);
  //     done()
  //   })
  // });
  it('upload', (done) => {
    const ctx = {
      config: {
        host: 'localhost:8898',
        timeout: 4000,
      },
      params: {}
    }

    Promise.all([getMD5(smallFile, null), blob2Buffer(smallFile)]).then(res => {
      const part = {
        size: smallFile.size,
        md5: res[0],
        buffer: res[1], 
        ext: 'txt'
      }
      network.directUpload(part, ctx).then(res => {
        console.log(res);
        done()
      })
    })
  })
});

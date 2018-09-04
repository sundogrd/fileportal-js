const network = require('../network')
describe('post request for uploading', () => {
  it('start', (done) => {
    const ctx = {
      config: {
        host: 'http://127.0.0.1:8898',
        customName: 'test.txt',
        timeout: 3000,
      },
      file: {
        fd: 13,
        name: 'afsf.txt',
        size: 148913,
        type: 'image/gif',
      },
    }
    network.start(ctx).then(res => {
      console.log(res);
      done()
    })
  });
  it('upload', (done) => {
    const ctx = {}
    network.upload(ctx).then(res => {
      console.log(res);
      done()
    })
  })
});

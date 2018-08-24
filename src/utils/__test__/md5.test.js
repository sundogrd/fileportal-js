const getMD5 = require('../md5').getMD5
describe('Utils md5', () => {
  it('md5 compute perfectly', async () => {
    const trueMD5 = 'add7403b95c4164509110b1eac281ae6'

    const blob = new Blob([JSON.stringify({hello: "world"}, null, 2)], {type : 'application/json'});
    const md5 = await getMD5(blob, null)
    console.log(md5);
    expect(md5).toEqual(trueMD5);
  });
});

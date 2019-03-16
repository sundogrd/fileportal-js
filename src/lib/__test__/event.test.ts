import EventEmitter from '../EventEmitter';
import { emit } from 'cluster';

describe('event emitter normal procedure', () => {
  it('sync event', (done) => {
    let em = new EventEmitter();
    let ctx = {
      to: 'test',
    };
    em.on('test', (context, ...params) => {
      if (context.to === 'test') {
        done();
      }
    }, ctx);

    em.emit('test', 'rest');
  });

  it('async event', (done) => {
    let em = new EventEmitter();
    let ctx = {
      to: 'test',
    };
    em.on('test', (context, ...params) => {
      if (context.to === 'test') {
        done();
      }
    }, ctx);

    setTimeout(() => {
      em.emit('test', 'rest', 'rest2', 'rest3');
    }, 1000);
  });

  it('once event', (done) => {
    let em = new EventEmitter();
    let ctx = {
      to: 'test',
    };
    let count = 0;
    em.once('test', (...params) => {
      console.log(params);
      console.log(this);
      console.log('you can receive here once');
      count++;
    }, ctx);

    em.emit('test', 'rest');
    em.emit('test', 'mdzz');

    setTimeout(function() {
      if (count === 1) {
        done();
      }
    }, 4000);
  });

  it('remove special listener of one event', (done) => {
    let em = new EventEmitter();
    let ctx = {
      data: 'test',
    };
    let count = 0;
    let fn = (...params) => {
      count ++;
    };
    em.on('removeable', fn, ctx);

    setTimeout(() => {
      em.removeListener('removeable', fn, ctx);
    }, 300);

    setTimeout(() => {
      em.emit('removeable');
    }, 1300);

    setTimeout(function() {
      if (count === 0) {
        done();
      }
    });
  });

  it('remove all listeners of same event', (done) => {
    let em = new EventEmitter();
    let ctx = {
      data: 'test',
    };
    let count = 0;
    let fn = (...params) => {
      count ++;
    };

    let fn1 = (...params) => {
      count ++;
    };

    em.on('removeable', fn, ctx);
    em.on('removeable', fn1, ctx);
    setTimeout(() => {
      em.removeListener('removeable', fn, ctx);
    }, 300);

    setTimeout(() => {
      em.emit('removeable');
    }, 1300);

    setTimeout(function() {
      if (count === 0) {
        done();
      }
    });
  });
});

import Remote from '../provider/remote';
import { decode } from 'asset-parser';
import { complex } from './fixtures';
describe('Remote', () => {
  const uri = 'http://example.com/complex/bundle.svg';
  const format = 'bundle';
  const method = 'GET';

  function parse(form, data, fn) {
    if (typeof data === 'string') {
      return decode(data, function (err, payload) {
        if (err) return fn(err);

        return fn(null, payload.data);

      });
    }

    fn(null, {});
  }

  let remote;

  beforeEach(() => {
    remote = new Remote();
  });

  describe('#fetch', () => {
    it('returns items from cache', next => {
      const item = remote.queue.id(method, uri);
      const mock = { hello: 'world' };

      remote.cache[item] = mock;

      remote.fetch({ format, method, uri }, { parse }, (err, data) => {
        expect(err).toBeNull();
        expect(data).toEqual(mock);

        next();
      });
    });

    it('returns `undefined` when a response is cached', () => {
      const item = remote.queue.id(method, uri);
      const mock = { hello: 'world' };

      remote.cache[item] = mock;

      expect(remote.fetch({ format, method, uri }, { parse }, () => {})).toBeUndefined();
    });

    it('returns `true` when a request for the same URL is progress', () => {
        expect(remote.fetch({ format, method, uri }, { parse }, () => {})).toBe(false);
        expect(remote.fetch({ format, method, uri }, { parse }, () => {})).toBe(true);
        expect(remote.fetch({ format, method, uri }, { parse }, () => {})).toBe(true);
        expect(remote.fetch({ format, method, uri }, { parse }, () => {})).toBe(true);
      }
    );

    [404, 500].forEach(function each(status) {
      it(`does not store items in cache on ${status} error`, next => {
        expect(Object.keys(remote.cache)).toHaveLength(0);

        /*eslint-disable */
        remote.fetch({
          uri: `http://example.com/${status}`,
          format,
          method
        }, { parse }, (err, data) => {
          expect(err).toBeInstanceOf(Error);
          expect(data).toBeInstanceOf(Object);

          expect(Object.keys(remote.cache)).toHaveLength(0);

          next();
        });
        /* eslint-enable */
      });
    });

    it(`does not store items in cache on error`, next => {
      expect(Object.keys(remote.cache)).toHaveLength(0);

      remote.fetch({
        uri: `http://example-non-existing-nobody-buy-this-domain-plx.lol/`,
        timeout: 10, // Just to speed up the test here so it fails faster
        format,
        method
      }, { parse }, (err, data) => {
        expect(err).toBeInstanceOf(Error);
        expect(data).toBeInstanceOf(Object);
        expect(Object.keys(remote.cache)).toHaveLength(0);
        next();
      });
    });

    it.skip('calls the parser when data is received correctly', next => {
      remote.fetch({ format, method, uri }, { parse: (form, data, fn) => {
        expect(form).toEqual(format);
        expect(typeof data).toBe('string');
        expect(fn).toBeInstanceOf(Function);

        decode(data, function (err, payload) {
          if (err) return fn(err);

          expect(typeof payload.version).toBe('string');
          expect(payload.data).toBeInstanceOf(Object);
          expect(payload.data).toEqual(complex);

          fn(null, { what: 'lol' });
        });
      } }, (err, data) => {
        expect(data).toEqual({ what: 'lol' });
        next(err);
      });
    });

    it.skip('caches the correctly parsed data', next => {
      const item = remote.queue.id(method, uri);
      const mock = { hello: 'world' };

      expect(Object.keys(remote.cache)).toHaveLength(0);

      remote.fetch({ format, method, uri }, { parse: (form, data, fn) => {
        fn(null, mock);
      } }, (err, data) => {
        expect(data).toEqual(mock);
        expect(Object.keys(remote.cache)).toHaveLength(1);
        expect(remote.cache[item]).toEqual(mock);

        next(err);
      });
    });

    it.skip('broadcasts the parsed and cached data to all queued fns', next => {
        next = assume.wait(3, next);

        ['green', 'green', 'green'].forEach(function (name) {
          remote.fetch({
            uri: `http://example.com/${name}/bundle.svgs`,
            format,
            method
          }, { parse }, (err, svgs) => {
            expect(svgs).toBeInstanceOf(Object);
            next(err);
          });
        });
      }
    );
  });
});

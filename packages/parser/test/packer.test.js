/* eslint max-nested-callbacks: ["error", 10]*/
import { encode, decode, version as specification } from '../index.js';
describe('packer', () => {
  describe('#encode', () => {
    it('packs an object into a string that can be decoded again', next => {
        const example = { foo: 'bar' };

        encode(specification, example, function (err, str) {
          expect(err).toBeNull();
          expect(str).toContain('foo');

          decode(str, function (error, payload) {
            expect(error).toBeNull();
            expect(payload).toBeInstanceOf(Object);

            const { version, data } = payload;

            expect(data).toEqual(example);
            expect(version).toEqual(specification);

            next();
          });
        });
      }
    );

    it('will call the error first on encode error', next => {
      const example = { foo: 'bar' };
      example.example = example; // Circular ref, explode.

      encode(specification, example, function (err, str) {
        expect(err).toBeInstanceOf(Error);
        expect(str).toBeUndefined();

        next();
      });
    });
  });

  describe('#decode', () => {
    it('will call the callback with error first on decode error', next => {
        decode(`${specification}§{ not really: "data" }`, function (err, data) {
          expect(err).toBeInstanceOf(Error);
          expect(data).toBeUndefined();

          next();
        });
      }
    );
  });
});

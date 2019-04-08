import dimensions from '../dimensions';
import { fixtures } from 'asset-test';
import Bundle from '../index';
import path from 'path';

describe('dimensions', () => {

  function setup(asset, next) {
    const bundle = new Bundle([asset]);

    bundle.read([asset], function (err, files) {
      if (err) return next(err);

      bundle.optimize(files, function (fail, svgos) {
        if (fail) return next(fail);

        bundle.parse(svgos, function (errs, data) {
          if (err) return next(errs);

          bundle.traverse(data, next);
        });
      });
    });
  }

  it('extracts the viewBox from the svg', next => {
    const godaddy = path.join(fixtures, 'godaddy.svg');

    setup(godaddy, function (err, svgs) {
      if (err) return next(err);

      const item = svgs[0];
      expect(item.viewBox).toBeUndefined();

      dimensions(item, function (err, svg) {
        expect(err).toBeNull();
        expect(svg).toEqual(item);

        expect(item.viewBox).toEqual('0 0 127 55.2');
        next();
      });
    });
  });

  it('extracts the full viewBox by rendering headless', next => {
    const tiger = path.join(fixtures, 'tiger.svg');

    setup(tiger, function (err, svgs) {
      if (err) return next(err);

      const item = svgs[0];
      expect(item.viewBox).toBeUndefined();

      dimensions(item, function (err, svg) {
        expect(err).toBeNull();
        expect(svg).toEqual(item);

        expect(typeof item.viewBox).toBe('string');
        expect(item.viewBox).toEqual('16.072994232177734 55.62681579589844 493.87457275390625 509.17413330078125');
        next();
      });
    });
  });
});

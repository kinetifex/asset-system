import { decode } from 'asset-parser';
import { fixtures } from 'asset-test';
import Bundle from '../index';
import path from 'path';
import fs from 'fs';

/**
 * Small helper function to finding all the fixtures.
 *
 * @param {String} ext Extension name
 * @param {String} name File name
 * @returns {String} Absolute location
 * @private
 */
function find(ext, name) {
  return path.join(fixtures, name + '.' + ext);
}

/**
 * List of all the fixtures we're testing.
 *
 * @type {Array}
 * @private
 */
const tests = [
  'tiger', 'homer', 'homer-no-viewbox', 'godaddy'
];

describe('snapshots', () => {

  let bundle;
  let svgs;

  beforeAll(function (next) {
    bundle = new Bundle(tests.map(find.bind(find, 'svg')));

    bundle.run(function run(err, str) {
      if (err) return next(err);

      decode(str, function (fail, payload) {
        if (fail) return next(fail);

        svgs = payload.data;

        next();
      });
    });
  });

  tests.forEach(function each(name) {
    it(`correctly transforms the ${name} fixture`, () => {
      const item = svgs[name];
      const output = JSON.parse(fs.readFileSync(find('json', name), 'utf-8'));

      expect(item).toBeInstanceOf(Array);
      expect(item).toEqual(output);

      //
      // Uncomment the following line if you want to change the new snapshot:
      //
      // - fs.writeFileSync(find('json', name), JSON.stringify(item), 'utf-8');
    });
  });
});

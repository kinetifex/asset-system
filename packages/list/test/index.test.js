import { fixtures } from 'asset-test';
import Bundle from 'asset-bundle';
import List from '../index.js';
import clone from 'clone';
import path from 'path';

describe('List', () => {
  const godaddy = path.join(fixtures, 'godaddy.svg');
  const tiger = path.join(fixtures, 'tiger.svg');
  const homer = path.join(fixtures, 'homer.svg');

  let output;
  let bundle;
  let svgs;
  let svg;
  let list;

  beforeAll(function (next) {
    bundle = new Bundle([ godaddy, tiger, homer ]);
    bundle.once('done', (err, out, data) => {
      output = out;
      svgs = data;
      svg = data[0];

      next();
    });

    bundle.run(function nope(err) {
      if (err) next(err);
    });

    list = new List(bundle, {
      file: path.join(__dirname, '..', 'dist', 'bundle.svgs')
    });
  });

  describe('#link', () => {
    it('is a function', () => {
      expect(list.link).toBeInstanceOf(Function);
    });

    it('removes slashes', () => {
      expect(list.link('hello/world')).toEqual('helloworld');
    });

    it('lowercases', () => {
      expect(list.link('WHATDOING')).toEqual('whatdoing');
    });

    it('removes spaces', () => {
      expect(list.link('Long title here')).toEqual('long-title-here');
    });

    it('removes - suffix', () => {
      expect(list.link('Long title here-')).toEqual('long-title-here');
    });
  });

  describe('#contents', () => {
    it('is a function', () => {
      expect(list.contents).toBeInstanceOf(Function);
    });

    it('generates a table of contents', () => {
      const res = list.contents(clone(svgs));

      expect(typeof res).toBe('string');
      expect(res).toContain('## Table of Contents');
      expect(res).toContain('- [godaddy](#godaddy)');
    });

    it('generates deep indentation for namespaces', () => {
      const res = list.contents([
        { name: 'foo' },
        { name: 'foo/bar' },
        { name: 'foo/bar/baz' },
        { name: 'foo/bar/world' },
        { name: 'hello' },
        { name: 'unknown/namespace' }
      ]);

      expect(res).toContain('  - [foo](#foo)');
      expect(res).toContain('    - [bar](#foobar)')
      expect(res).toContain('      - [world](#foobarworld)');

      expect(res).toContain('  - unknown');
      expect(res).toContain('    - [namespace](#unknownnamespace)');
    });
  });

  describe('#details', () => {
    it('is a function', () => {
      expect(list.details).toBeInstanceOf(Function);
    });

    it('includes the details of the bundle', () => {
      const res = list.details(output, clone(svgs));

      expect(res).toContain('- **81.2KB** uncompressed');
      expect(res).toContain('- **30.99KB** compressed(gzip)');
      expect(res).toContain('- Contains **3** asset');
      expect(res).toContain('- Build according to specification **0.1.0**');
    });
  });

  describe('#categories', () => {
    it('is a function', () => {
      expect(list.categories).toBeInstanceOf(Function);
    });

    it('returns an object', () => {
      const res = list.categories([
        { name: 'foo' },
        { name: 'foo/bar' },
        { name: 'foo/bar/baz' },
        { name: 'foo/bar/world' },
        { name: 'hello' }
      ]);

      expect(res).toBeInstanceOf(Object);
    });
  });

  describe('#asset', () => {
    it('is a function', () => {
      expect(list.asset).toBeInstanceOf(Function);
    });

    it('includes the name of the Asset as header', () => {
      const res = list.asset(svg);

      expect(res).toContain('### godaddy');
    });

    it('includes an example', () => {
      const res = list.asset(svg);

      expect(res).toContain('<Asset name="godaddy" width={ 127 } height={ 55.2 } />');
    });

    it('includes with width and heigh', () => {
      const res = list.asset(svg);

      expect(res).toContain('| 127');
      expect(res).toContain('| 55.2');
    });

    it('includes an example', () => {
      const res = list.asset(svg);

      expect(res).toContain('<img src="');
    });

    it('prefixes the url with a hosted url', () => {
      const hosted = new List(bundle, {
        file: path.join(__dirname, '..', 'dist', 'bundle.svgs'),
        hosted: 'https://google.com/github/proxy/'
      });

      const res = hosted.asset(svg);
      expect(res).toContain('https://google.com');
    });
  });

  describe('#generate', () => {
    it('is a function', () => {
      expect(list.generate).toBeInstanceOf(Function);
    });

    it('emits a `done` event', next => {
      list.once('done', function (readme) {
        expect(typeof readme).toBe('string');

        next();
      });

      list.generate(null, output, clone(svgs));
    });

    it('emits an `error` event when first arg is an Error', next => {
      list.once('error', function (err) {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toEqual('F = Failure');

        next();
      });

      list.generate(new Error('F = Failure'));
    });
  });
});

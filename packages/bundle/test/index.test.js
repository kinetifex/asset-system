import { fixtures } from 'asset-test';
import { decode } from 'asset-parser';
import EventEmitter from 'events';
import Bundle from '../index';
import path from 'path';

describe('asset-bundle', () => {
  const godaddy = path.join(fixtures, 'godaddy.svg');
  let bundle;

  function nope() { /* empty callback */ }

  beforeEach(() => {
    bundle = new Bundle([godaddy]);
  });

  it('is an instance of EventEmitter', () => {
    expect(bundle).toBeInstanceOf(EventEmitter);
  });

  it('deep merges config.svgo', () => {
    bundle = new Bundle([godaddy], {
      svgo: [
        { removeViewBox: true }
      ]
    });

    expect(bundle.config.root).toEqual(null);
    expect(bundle.config.multipass).toBe(false);
    expect(bundle.config.svgo.length).toEqual(Bundle.defaults.svgo.length);

    const removeViewBox = bundle.config.svgo.find(item => {
      return Object.keys(item)[0] === 'removeViewBox';
    });

    expect(removeViewBox).toBeInstanceOf(Object);
    expect(removeViewBox.removeViewBox).toBe(true);
  });

  it('exposes the constructor through module.exports', () => {
    const BUNDLEOFJOY = require('../');

    expect(typeof BUNDLEOFJOY).toBe('function');

    const test = new BUNDLEOFJOY([godaddy]);

    expect(test.modify).toBeInstanceOf(Function);
    expect(test.run).toBeInstanceOf(Function);
  });

  describe('#modify', () => {
    it('is a function', () => {
      expect(bundle.modify).toBeInstanceOf(Function);
    });

    it('registers a new transformation hook', () => {
      expect(Object.keys(bundle.hooks)).toHaveLength(0);

      const example = () => {};
      bundle.modify('name', example);

      expect(Object.keys(bundle.hooks)).toHaveLength(1);
      expect(bundle.hooks.name).toEqual(example);
    });
  });

  describe('#plugin', () => {
    it('is a function', () => {
      expect(bundle.plugin).toBeInstanceOf(Function);
    });

    it('executes the supplied Constructor', next => {
      function Test(b, o) {
        expect(b).toEqual(bundle);
        expect(o).toEqual(options);

        next();
      }

      const options = {};
      expect(bundle.plugin(Test, options)).toBeInstanceOf(Test);
    });
  });

  describe('#name', () => {
    it('is a function', () => {
      expect(bundle.name).toBeInstanceOf(Function);
    });

    it('produces the name of the asset based on the file name', () => {
      const loc = '/foo/bar/hello-world.svg';
      const name = bundle.name(loc);

      expect(name).toEqual('hello-world');
    });

    it('uses folder names as namespace when root option is provided', () => {
        bundle = new Bundle([godaddy], {
          root: __dirname
        });

        const loc = path.join(__dirname, 'name', 'space', 'ship.svg');
        const name = bundle.name(loc);

        expect(name).toEqual('name/space/ship');
      }
    );
  });

  describe('#read', () => {
    it('is a function', () => {
      expect(bundle.read).toBeInstanceOf(Function);
    });

    it('reads the passed files', next => {
      bundle.read([godaddy], function (err, svgs) {
        expect(err).toBeNull();
        expect(svgs).toBeInstanceOf(Array);
        expect(Object.keys(svgs)).toHaveLength(1);

        const item = svgs[0];

        expect(item.name).toEqual('godaddy');
        expect(item.loc).toEqual(godaddy);
        expect(typeof item.data).toBe('string');
        expect(item.data).toContain('Generator: Adobe Illustrator 18.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)');

        next();
      });
    });

    it('calls with error when file does not exist', next => {
      bundle.read([path.join(fixtures, 'does-not.exist')], function (err) {
        expect(err.message).toEqual(expect.stringContaining('ENOENT: no such file or directory'));

        next();
      });
    });

    it('emits the `read` event', next => {
      bundle.once('read', function (err, svgs) {
        expect(err).toBeNull();
        expect(svgs).toBeInstanceOf(Array);

        const item = svgs[0];

        expect(item.name).toEqual('godaddy');
        expect(item.loc).toEqual(godaddy);
        expect(typeof item.data).toBe('string');
        expect(item.data).toContain('Generator: Adobe Illustrator 18.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)');

        next();
      });

      bundle.read([godaddy], nope);
    });
  });

  describe('#optimize', () => {
    let data;

    beforeAll(function (next) {
      bundle.read([godaddy], function (err, svgs) {
        if (err) return next(err);

        data = svgs;
        next();
      });
    });

    it('is a function', () => {
      expect(bundle.optimize).toBeInstanceOf(Function);
    });

    it('optimizes the svgs', next => {
      bundle.optimize(data, function (err, svgs) {
        expect(err).toBeNull();
        expect(svgs).toBeInstanceOf(Array);
        expect(Object.keys(svgs)).toHaveLength(1);

        const item = svgs[0];

        expect(item.name).toEqual('godaddy');
        expect(item.loc).toEqual(godaddy);
        expect(item.info).toBeInstanceOf(Object);
        expect(typeof item.data).toBe('string');
        expect(item.data).not.toEqual(expect.stringContaining('Generator: Adobe Illustrator 18.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)'));

        next();
      });
    });

    it('calls with an error on incorrect svg data', next => {
      bundle.optimize([{
        name: 'lol', data: '@not really data@', loc: __filename
      }], function (err) {
        expect(err).toBeInstanceOf(Error);

        next();
      });
    });

    it('emits the `optimize` event', next => {
      bundle.once('optimize', function (err, svgs) {
        expect(err).toBeNull();
        expect(svgs).toBeInstanceOf(Array);
        expect(Object.keys(svgs)).toHaveLength(1);

        const item = svgs[0];

        expect(item.name).toEqual('godaddy');
        expect(item.loc).toEqual(godaddy);
        expect(item.info).toBeInstanceOf(Object);
        expect(typeof item.data).toBe('string');
        expect(item.data).not.toEqual(expect.stringContaining('Generator: Adobe Illustrator 18.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)'));

        next();
      });

      bundle.optimize(data, nope);
    });
  });

  describe('#parse', () => {
    it('is a function', () => {
      expect(bundle.optimize).toBeInstanceOf(Function);
    });

    it('parses svg data into a DOM tree', next => {
      bundle.read([godaddy], function (err, data) {
        if (err) return next(err);

        bundle.parse(data, function (errs, svgs) {
          expect(errs).toBeNull();
          expect(svgs).toBeInstanceOf(Array);
          expect(svgs).toHaveLength(1);

          const item = svgs[0];

          expect(item.tree).not.toBeNull();
          next();
        });
      });
    });

    it('emits the `parse` event', next => {
      bundle.once('parse', function (errs, svgs) {
        expect(errs).toBeNull();
        expect(svgs).toBeInstanceOf(Array);
        expect(svgs).toHaveLength(1);

        const item = svgs[0];

        expect(item.tree).not.toBeNull();
        next();
      });

      bundle.read([godaddy], function (err, data) {
        bundle.parse(data, nope);
      });
    });
  });

  describe('#traverse', () => {
    let data;

    beforeAll(function (next) {
      bundle.read([godaddy], function (err, files) {
        if (err) return next(err);

        bundle.parse(files, function (errs, svgs) {
          if (err) return next(errs);

          data = svgs;
          next();
        });
      });
    });

    it('is a function', () => {
      expect(bundle.traverse).toBeInstanceOf(Function);
    });

    it('transform the DOM structure in a array', next => {
      bundle.traverse(data, function (err, svgs) {
        expect(err).toBeNull();

        expect(svgs).toBeInstanceOf(Array);
        expect(svgs).toHaveLength(1);

        const item = svgs[0];

        expect(item.struc).toBeInstanceOf(Array);
        next();
      });
    });

    it('calls the transformation hook', next => {
      bundle.modify('ellipse', function (attrs, element, name) {
        if (name !== 'Ellipse') return;

        attrs.example = 'cool';
        return 'RENAMED THE COMPONENT';
      });

      bundle.traverse(data, function (err, svgs) {
        expect(err).toBeNull();

        const struc = svgs[0].struc;

        struc[struc.length - 1].forEach(function (item) {
          if (item[0] !== 'RENAMED THE COMPONENT') return;

          expect(item[1]).toBeInstanceOf(Object);
          expect(item[1].example).toEqual('cool');

          next();
        });
      });
    });

    it('emits the `traverse` event', next => {
      bundle.once('traverse', function (err, svgs) {
        expect(err).toBeNull();

        expect(svgs).toBeInstanceOf(Array);
        expect(svgs).toHaveLength(1);

        const item = svgs[0];

        expect(item.struc).toBeInstanceOf(Array);
        next();
      });

      bundle.traverse(data, nope);
    });
  });

  describe('#viewBox', () => {
    let data;

    beforeAll(function (next) {
      bundle.read([godaddy], function (err, files) {
        if (err) return next(err);

        bundle.parse(files, function (errs, svgs) {
          if (err) return next(errs);

          data = svgs;
          next();
        });
      });
    });

    it('has a viewBox function', () => {
      expect(bundle.viewBox).toBeInstanceOf(Function);
    });

    it('emits the `viewBox` event', next => {
      bundle.once('viewBox', function (err, svgs) {
        expect(err).toBeNull();

        expect(svgs).toBeInstanceOf(Array);
        expect(svgs).toHaveLength(1);

        const item = svgs[0];

        expect(typeof item.viewBox).toBe('string');
        next();
      });

      bundle.viewBox(data, nope);
    });
  });

  describe('#encode', () => {
    let data;

    beforeAll(function (next) {
      bundle.read([godaddy], function (err, files) {
        if (err) return next(err);

        bundle.parse(files, function (errs, trees) {
          if (errs) return next(errs);

          bundle.traverse(trees, function (fail, svgs) {
            if (fail) return next(fail);

            data = svgs;
            next();
          });
        });
      });
    });

    it('is a function', () => {
      expect(bundle.encode).toBeInstanceOf(Function);
    });

    it('transforms the traversed tree in the resulting bundle', next => {
      bundle.encode(data, function (err, str) {
        expect(err).toBeNull();
        expect(typeof str).toBe('string');

        next();
      });
    });

    it('is encoded using `asset-parser`', next => {
      bundle.encode(data, function (err, str) {
        expect(err).toBeNull();
        expect(typeof str).toBe('string');

        decode(str, function (errs, payload) {
          if (errs) return next(errs);

          const version = payload.version;
          const svgs = payload.data;

          expect(version).toEqual(bundle.specification);
          expect(svgs).toBeInstanceOf(Object);
          expect(svgs.godaddy).toBeInstanceOf(Array);
          expect(svgs.godaddy).toEqual(data[0].struc);

          next();
        });
      });
    });

    it('emits the `done` event', next => {
      bundle.once('done', function (err, str, svgs) {
        expect(err).toBeNull();
        expect(typeof str).toBe('string');

        expect(svgs).toBeInstanceOf(Array);
        expect(svgs).toHaveLength(1);

        const item = svgs[0];

        expect(item).toBeInstanceOf(Object);

        next();
      });

      bundle.encode(data, nope);
    });
  });

  describe('#run', () => {
    it('is a function', () => {
      expect(bundle.run).toBeInstanceOf(Function);
    });

    it('executes all the steps', next => {
      bundle.run(function (err, str) {
        expect(err).toBeNull();
        expect(typeof str).toBe('string');

        decode(str, function (errs, payload) {
          expect(errs).toBeNull();
          expect(payload).toBeInstanceOf(Object);

          const version = payload.version;
          const svgs = payload.data;

          expect(version).toEqual(bundle.specification);
          expect(svgs).toBeInstanceOf(Object);
          expect(svgs.godaddy).toBeInstanceOf(Array);

          next();
        });
      });
    });
  });

  describe('svgo', () => {
    it('does not mangle classNames', next => {
      const fixture = path.join(fixtures, 'homer-classnames.svg');
      const bundler = new Bundle([ fixture ]);

      bundler.run((err, str) => {
        expect(err).toBeNull();
        expect(typeof str).toBe('string');

        expect(str).toContain('"className":"another multiple names"');
        expect(str).toContain('{"className":"classnames-on-group"}');

        next();
      });
    });
  });
});

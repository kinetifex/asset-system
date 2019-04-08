import { createContext, runInContext } from 'vm';
import { fixtures } from 'asset-test';
import Pipeline from '../index.js';
import Bundle from 'asset-bundle';
import webpack from 'webpack';
import path from 'path';
import fs from 'fs';

const entry = path.join(fixtures, 'entry.js');

describe('Asset Pipeline', () => {
  let pipeline;

  function setup(filename, options) {
    pipeline = new Pipeline(filename, options);
  }

  it('exposes the constructor through module.exports', () => {
    const Packer = require('../');

    expect(Packer).toBeInstanceOf(Function);

    const test = new Packer('example', {});

    expect(test.hash).toBeInstanceOf(Function);
    expect(test.apply).toBeInstanceOf(Function);
  });

  describe('#loader', () => {
    beforeEach(() => {
      setup('filename.svgs');
    });

    it('has a loader method', () => {
      expect(pipeline.loader).toBeInstanceOf(Function);
    });

    it('pre-configures the loader to our own loader', () => {
      const loader = pipeline.loader();

      expect(loader).toBeInstanceOf(Object);
      expect(loader.loader).toEqual(require.resolve('../loader'));
    });

    it('provides a internal override function that uses bundle#name', () => {
        const loader = pipeline.loader();
        const name = loader.options.internal;

        [
          path.join(__dirname, 'test.svg'),
          path.join(__dirname, 'test/bar.svg')
        ].forEach(function (filename) {
          expect(name(filename)).toEqual(pipeline.bundle.name(filename));
        });
      }
    );
  });

  describe('#hash', () => {
    const content = '08080ad8fa0d98f0sd98fa0sd98fa0s lol what is this';

    it('returns the filename if theres no replace tokens', () => {
      setup('example.svgs');

      const name = pipeline.hash(content);
      expect(name).toEqual('example.svgs');
    });

    it('replaces [hash] with md5 hash', () => {
      setup('example.[hash].svgs');

      const name = pipeline.hash(content);
      expect(name).toEqual('example.a09246d44e397b3903a4fc5efd6b9566.svgs');
    });
  });
});

describe('WebPack Integration', () => {

  function clonepack(merge, fn) {
    const pipeline = new Pipeline('bundle.svgs', {
      root: entry,
      namespace: true
    });

    const config = {
      entry: entry,
      output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'output.js'
      },

      module: {
        rules: [
          { test: /\.svg$/, use: pipeline.loader() }
        ]
      },

      plugins: [
        pipeline
      ]
    };

    webpack({ ...config, ...merge }, fn);
  }

  it('executes the plugin without errors', next => {
    clonepack({}, function (err, stats) {
      if (err) return next(err);

      if (stats.hasErrors()) {
        return next(stats.toString());
      }

      const dist = path.join(__dirname, 'dist');
      const bundle = fs.readFileSync(path.join(dist, 'bundle.svgs'), 'utf-8');
      const output = fs.readFileSync(path.join(dist, 'output.js'), 'utf-8');

      //
      // Ensure that the imports are rewritten
      //
      const sandbox = {};
      createContext(sandbox);
      runInContext(output, sandbox);

      //
      // Validate that the require statements return the name of the asset.
      //
      expect(sandbox.godaddy).toEqual('godaddy');
      expect(sandbox.homer).toEqual('deeper/homer');
      expect(sandbox.tiger).toEqual('tiger');

      //
      // Validate that these names are actually in the bundle.
      //
      expect(bundle).toContain('"deeper/homer":');
      expect(bundle).toContain('"godaddy":');
      expect(bundle).toContain('"tiger":');

      next();
    });
  });

  it('allows plugin configuration through webpack', next => {
    clonepack({
      plugins: [
        new Pipeline('bungle.svgs', {
          plugins: [
            [
              function example(bundle, opts) {
                expect(bundle).toBeInstanceOf(Bundle);
                expect(opts).toBeInstanceOf(Object);
                expect(typeof opts.file).toBe('string');
                expect(opts.file).toContain('bungle.svgs');
                expect(opts.foo).toEqual('bar');

                next();
              },
              { foo: 'bar' }
            ]
          ]
        })
      ]
    }, function () { /* ignore me */});
  });

  it('allows modify configuration through webpack', next => {
    let called = false;
    clonepack({
      plugins: [
        new Pipeline('bungle.svgs', {
          modify: {
            foo: function () {
              if (!called) {
                called = true;
                next();
              }
            }
          }
        })
      ]
    }, function () { /* ignore me */});
  });
});

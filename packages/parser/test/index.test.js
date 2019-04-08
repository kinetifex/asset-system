import AssetParser, { encode, decode, Asset, version } from '../index.js';
import { create } from 'asset-test';
import * as svgs from 'svgs';
import React from 'react';

const { complex } = create(svgs, React);

describe('asset-parser', () => {
  it('exports all utilties', () => {
    expect(version).toEqual(expect.stringMatching(/\d\.\d\.\d/));
    expect(encode).toBeInstanceOf(Function);
    expect(decode).toBeInstanceOf(Function);
    expect(Asset).toBeInstanceOf(Function);
    expect(AssetParser).toBeInstanceOf(Function);
  });

  describe('AssetParser', () => {
    let asset;

    function setup() {
      asset = new AssetParser();
    }

    describe('#modify', () => {
      it('registers a new hook', () => {
        setup();

        expect(Object.keys(asset.hooks)).toHaveLength(0);

        const what = () => {};
        asset.modify('what', what);

        expect(Object.keys(asset.hooks)).toHaveLength(1);
        expect(asset.hooks.what).toBeInstanceOf(Array);
        expect(asset.hooks.what).toHaveLength(1);
        expect(asset.hooks.what[0]).toEqual(what);
      });

      it('can register multiple modifiers for a given property', () => {
        setup();

        const one = () => {};
        const two = () => {};

        asset.modify('color', one);
        asset.modify('color', two);

        expect(Object.keys(asset.hooks)).toHaveLength(1);
        expect(asset.hooks.color).toBeInstanceOf(Array);
        expect(asset.hooks.color).toHaveLength(2);
        expect(asset.hooks.color[0]).toEqual(one);
        expect(asset.hooks.color[1]).toEqual(two);
      });

      it('ignores duplicates for a given prop', () => {
        setup();

        const one = () => {};
        const two = () => {};

        asset.modify('color', one);
        asset.modify('color', two);
        asset.modify('color', two);

        expect(Object.keys(asset.hooks)).toHaveLength(1);
        expect(asset.hooks.color).toBeInstanceOf(Array);
        expect(asset.hooks.color).toHaveLength(2);
        expect(asset.hooks.color[0]).toEqual(one);
        expect(asset.hooks.color[1]).toEqual(two);
      });
    });

    describe('#modifiers', () => {
      it('returns an array with the names of the modifiers', () => {
        setup();

        asset.modify('foo', () => {});
        asset.modify('bar', () => {});
        asset.modify('bar', () => {});

        expect(asset.modifiers()).toBeInstanceOf(Array);
        expect(asset.modifiers()).toEqual(['foo', 'bar']);
      });
    });

    describe('#parse', () => {
      let str;

      beforeAll((next) => {
        setup();

        encode(version, { complex: complex.structure }, (err, data) => {
          if (err) return next(err);

          str = data;
          next();
        });
      });

      it('decodes the playload and returns a list of Asset instances', next => {
          asset.parse('bundle', str, (err, svgs) => {
            if (err) return next(err);

            expect(err).toBeNull();
            expect(svgs).toBeInstanceOf(Object);

            expect(svgs.complex).toBeInstanceOf(Asset);
            next();
          });
        }
      );

      it('passes pass errors in to callback', next => {
        asset.parse('bundle', `${version}§l{}`, (err, svgs) => {
          expect(err).toBeInstanceOf(Error);
          expect(err.message).toContain('Unexpected token');

          expect(svgs).toBeInstanceOf(Object);
          expect(Object.keys(svgs)).toHaveLength(0);

          next();
        });
      });

      it('returns error on invalid data structure', next => {
        asset.parse('bundle', `${version}§[{"foo":"bar"}]`, (err, svgs) => {
          expect(err).toBeInstanceOf(Error);
          expect(err.message).toEqual(`Failed to decode payload, spec(${version})`);

          expect(svgs).toBeInstanceOf(Object);
          expect(Object.keys(svgs)).toHaveLength(0);

          next();
        });
      });
    });
  });
});

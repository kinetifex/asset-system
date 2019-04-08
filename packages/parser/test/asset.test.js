import { create } from 'asset-test';
import { mount } from 'enzyme';
import * as svgs from 'svgs';
import Asset from '../asset';
import React from 'react';

const fixture = create(svgs, React);
const Svg = svgs.Svg;

describe('Asset', () => {
  let asset;

  function setup(name, hooks) {
    asset = new Asset(fixture[name].structure, hooks);
  }

  it('is exported as a function', () => {
    expect(Asset).toBeInstanceOf(Function);
  });

  it('does not transform the asset by default', () => {
    setup('complex');

    expect(asset.data).toEqual(fixture.complex.structure);
    expect(asset.parsed).toBeNull();
  });

  describe('#render', () => {
    it('parses the data if its not parsed before', () => {
      setup('complex');

      asset.render();
      const parsed = asset.parsed;

      expect(parsed).not.toBeNull();

      asset.data = fixture.g.structure;
      asset.render();

      expect(asset.parsed).toEqual(parsed);
    });

    it('returns a <Pass> component', () => {
      setup('childs');

      const result = asset.render();
      const wrapper = mount(<Svg { ...result.props }>{ result.svg }</Svg>);

      expect(mount(fixture.childs.output).html()).toContain(wrapper.html());
    });

    it('passes the changes to the <Pass /> component', () => {
      setup('green', {
        'color': [function modify(attributes, props) {
          if (!attributes.fill) return;

          attributes.fill = props.color;
        }]
      });

      const result = asset.render({ color: 'red' });
      const wrapper = mount(<Svg { ...result.props }>{ result.svg }</Svg>);

      expect(wrapper.html()).toContain('<g fill="red"></g>');
    });
  });
});

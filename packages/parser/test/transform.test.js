import { Pass } from '../passthrough';
import transform from '../transform';
import { create } from 'asset-test';
import { mount } from 'enzyme';
import * as svgs from 'svgs';
import React from 'react';

const fixture = create(svgs, React);
const Text = svgs.Text;
const Svg = svgs.Svg;

// TODO: try out jest's snapshot feature for these tests
describe.skip('transform', () => {
  let wrapper;
  let output;

  function setup(data, hooks) {
    const { svg, props } = transform(data, hooks);
    wrapper = mount(<Pass><Svg { ...props }>{ svg }</Svg></Pass>);
    output = wrapper.html();
  }

  it('is exported as a function', () => {
    expect(transform).toBeInstanceOf(Function);
  });

  it('transforms the first element of an array to component', () => {
    setup(fixture.g.structure);

    expect(wrapper).toContain(fixture.g.output);
    expect(wrapper).to.not.contain(<Text />); // sanity check
  });

  it('applies the second element of the array as properties', () => {
    setup(fixture.green.structure);

    expect(wrapper).toContain(fixture.green.output);
  });

  it('adds child components when an array is encountered', () => {
    setup(fixture.childs.structure);

    expect(output).toContain(mount(fixture.childs.output).html());
  });

  it('complex deeply tested svgs', () => {
    setup(fixture.complex.structure);

    expect(output).toContain(mount(fixture.complex.output).html());
  });

  it('returns props even when no svg with props is found in structure', () => {
      const result = transform([['Text', ['Hello']]]);

      expect(result.props).toBeInstanceOf(Object);
      expect(result.props).toHaveLength(0);
    }
  );

  it('returns text when a component cannot be found', () => {
    const result = transform([['what']]).svg;
    expect(result).toEqual(['what']);
  });

  it('extracts the Svg element from the structure and adds its props to props', () => {
      const result = transform(fixture.json.godaddy);

      expect(result.props).toBeInstanceOf(Object);
      expect(result.props).toHaveLength(1);
      expect(result.props.viewBox).toEqual('0 0 127 55.2');
    }
  );
});

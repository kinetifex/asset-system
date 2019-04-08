import { Pass, Through } from '../passthrough';
import { shallow } from 'enzyme';
import React from 'react';

describe('passthrough', () => {
  let wrapper;
  let pass;

  describe('<Pass />', () => {
    function setup(props = {}) {
      wrapper = shallow(<Pass { ...props }><div /></Pass>);
      pass = wrapper.instance();
    }

    it('exported as function', () => {
      expect(Pass).toBeInstanceOf(Function);
    });

    describe('#modify', () => {
      it('is a function', () => {
        setup();

        expect(pass.modify).toBeInstanceOf(Function);
      });

      it('returns the modifiers', () => {
        const modify = { name: () => {} };
        const props = { foo: 'bar', bar: 'foo', modify };

        setup(props);
        expect(pass.modify()).toEqual(modify);
      });

      it('is shared through React context', () => {
        setup();

        expect(pass.getChildContext().modify).toEqual(pass.modify);
      });
    });

    describe('#pass', () => {
      it('is a function', () => {
        setup();

        expect(pass.pass).toBeInstanceOf(Function);
      });

      it('passes the received props throught he pass function', () => {
        const props = { foo: 'bar', bar: 'foo' };
        setup(props);

        expect(pass.pass()).toEqual(props);
      });

      it('is shared through React context', () => {
        setup();

        expect(pass.getChildContext().pass).toEqual(pass.pass);
      });
    });
  });

  describe('<Through />', () => {
    function setup(props, data = {}, modify = {}) {
      wrapper = shallow(<Through { ...props }><div/></ Through>, {
        context: {
          modify: function () {
            return modify;
          },
          pass: function () {
            return data;
          }
        }
      });
    }

    it('exported as a function', () => {
      expect(Through).toBeInstanceOf(Function);
    });

    it('only allows a single component', next => {
      try {
        shallow(<Through><div/><div /></Through>, {
          context: {
            modify: function () {
              return {};
            },
            pass: function () {
              return {};
            }
          }
        });
      } catch (e) {
        expect(e.message).toContain('single React element');
        return next();
      }
    });

    it('passes the props to the child component', () => {
      setup({ className: 'bar' });

      expect(wrapper.first().name()).toEqual('div');
      expect(wrapper.first().hasClass('bar')).toBe(true);
    });

    it('calls the modify functions with attributes', () => {
      setup({}, { className: 'red' }, {
        className: [(attributes) => {
          expect(attributes).toBeInstanceOf(Object);
          attributes.className = 'blue';
        }]
      });

      expect(wrapper.first().hasClass('blue')).toBe(true);
    });

    it('only triggers the modifier if we have a matching property', () => {
      setup({}, { className: 'red' }, {
        another: [(attributes) => {
          throw new Error('I should never be called');
        }],
        className: [(attributes) => {
          expect(attributes).toBeInstanceOf(Object);
          attributes.className = 'blue';
        }]
      });

      expect(wrapper.first().hasClass('blue')).toBe(true);
    });

    it('triggers all assigned modifiers for a given property', () => {
      setup({}, { className: 'red' }, {
        className: [(attributes) => {
          expect(attributes).toBeInstanceOf(Object);
          attributes.className = 'blue';
        }, (attributes) => {
          expect(attributes.className).toEqual('blue');
          attributes.id = 'foo';
        }]
      });

      expect(wrapper.html()).toContain('<div class="blue" id="foo"></div>');
    });

    it('calls all modifiers for matching props', () => {
      setup({}, { className: 'red', id: 'foo' }, {
        className: [(attributes) => {
          expect(attributes).toBeInstanceOf(Object);
          attributes.className = 'blue';
        }],
        id: [(attributes, props) => {
          expect(attributes.className).toEqual('blue');
          attributes.id = props.id;
        }]
      });

      expect(wrapper.html()).toContain('<div class="blue" id="foo"></div>');
    });

    it('receives the props as arguments', next => {
      const cows = { cows: 'moo' };

      setup({ className: 'red' }, cows, {
        cows: [(attributes, props) => {
          expect(attributes).toBeInstanceOf(Object);
          expect(props).toBeInstanceOf(Object);
          expect(props).toEqual(cows);

          next();
        }]
      });

      expect(wrapper.html()).toContain('<div class="red"></div>');
    });

    it('receives the child as arguments', next => {
      setup({}, { trigger: 'red' }, {
        trigger: [(attributes, props, child) => {
          expect(child.props).toBeInstanceOf(Object);
          expect(child.type).toEqual('div');

          next();
        }]
      });
    });

    it('can change the child component', () => {
      setup({ className: 'red' }, { trigger: 'blue' }, {
        trigger: [(attributes, props, child) => {
          expect(child.props).toBeInstanceOf(Object);
          expect(child.type).toEqual('div');

          return (
            <span>changed</span>
          );
        }]
      });

      expect(wrapper.html()).toContain('<span class="red">changed</span>');
    });
  });
});

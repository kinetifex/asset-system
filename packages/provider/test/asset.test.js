import Fallback from '../fallback';
import { shallow } from 'enzyme';
import Asset from '../asset';
import { Text } from 'svgs';
import React from 'react';

describe('Asset', () => {
  const data = <Text>Context</Text>;
  let wrapper;
  let output;
  let asset;

  function setup(Component, props, render) {
    wrapper = shallow(<Component { ...props } />, {
      lifecycleExperimental: true,
      context: {
        modifiers: () => {
          return [];
        },
        getItem: (name, fn) => {
          if (render) return fn(null, { render });

          fn(null, {
            render: function () {
              return {
                svg: 'what', props: {}
              };
            }
          });
        }
      }
    });

    asset = wrapper.instance();
    output = wrapper.html();
  }

  describe('#loading', () => {
    it('renders the children if its still loading', () => {
      wrapper = shallow(
        <Asset width={ 100 } height={ 100 } name='example'>
          <div className='foo'>anything is allowed here</div>
        </Asset>, {
          context: {
            modifiers: () => {
              return [];
            },
            getItem: (name, fn) => {
              setTimeout(() => {
                fn(null, {
                  render: () => {
                    return {
                      svg: <Text>Loaded</Text>,
                      props: {}
                    };
                  }
                });
              }, 10);
            }
          }
        });

      output = wrapper.html();

      expect(output).toEqual('<div class="foo">anything is allowed here</div>');
    });

    it('displays a transparent rect in exactly the same size', () => {
      wrapper = shallow(
        <Asset width={ 100 } height={ 100 } name='example' />, {
          context: {
            modifiers: () => {
              return [];
            },
            getItem: (name, fn) => {
              setTimeout(() => {
                fn(null, {
                  render: () => {
                    return {
                      svg: <Text>Loaded</Text>,
                      props: {}
                    };
                  }
                });
              }, 10);
            }
          }
        });

      output = wrapper.html();

      expect(output).toContain('<svg');
      expect(output).toContain('<rect y="0" x="0" opacity="0" width="100" height="100">');
      expect(output).toContain('</svg>');
    });
  });

  describe('data={ .. }', () => {
    it('does not fetch resources when data is provided manually', () => {
      setup(Asset, { data, width: 100, height: 100 }, () => {
        throw new Error('I should not render');
      });

      expect(asset.state.svg).toEqual(data);
    });

    it('renders the supplied data', () => {
      setup(Asset, { data, width: 100, height: 100 });

      expect(wrapper.first().name()).toEqual('SvgWrapper');
      expect(output).toContain('<text>Context</text>');
      expect(output).toContain('<svg');
      expect(output).toContain('</svg>');
    });
  });

  describe('name={ .. }', () => {
    it('fetches the element from the context', () => {
      setup(Asset, { name: 'example', width: 100, height: 200 }, () => {
        return {
          svg: data,
          props: {}
        };
      });

      expect(output).toContain('<svg');
      expect(output).toContain('<text>Context</text>');
      expect(output).toContain('</svg>');
    });

    it('renders the fallback SVG on errors', () => {
      wrapper = shallow(
        <Asset width={ 100 } height={ 100 } name='example' />, {
          context: {
            modifiers: () => {
              return [];
            },
            getItem: (name, fn) => {
              fn(new Error('unknown whatever error'), Fallback);
            }
          }
        });

      asset = wrapper.instance();
      output = wrapper.html();

      expect(asset.state.svg).toEqual(Fallback);

      expect(output).toContain('<svg width="100" height="100">');
      expect(output).toContain('<svg width="100" height="100" viewBox="0 0 128 64"');
      expect(output).toContain('</svg>');
    });

    it('renders with viewBox if supplied', () => {
      setup(Asset, { name: 'example', width: 100, height: 200 }, () => {
        return {
          svg: data,
          props: { }
        };
      });

      expect(output).toContain('<svg');
      expect(output).not.toContain('viewBox="0 0 140 100"');
      expect(output).not.toContain('preserveAspectRatio="xMidYMid meet"');
      expect(output).toContain('<text>Context</text>');
      expect(output).toContain('</svg>');

      setup(Asset, { name: 'example', width: 100, height: 200 }, () => {
        return {
          svg: data,
          props: { viewBox: '0 0 140 100' }
        };
      });

      expect(output).toContain('<svg');
      expect(output).toContain('viewBox="0 0 140 100"');
      expect(output).toContain('preserveAspectRatio="xMidYMid meet"');
      expect(output).toContain('<text>Context</text>');
      expect(output).toContain('</svg>');
    });
  });

  describe('title={ .. }', () => {
    it('renders the asset with accessiblity information', () => {
      setup(Asset, { name: 'example', width: 100, height: 200, title: 'work work work' }, () => {
        return {
          svg: data,
          props: {}
        };
      });

      expect(output).toContain('aria-label="[title]"');
      expect(output).toContain('<title>work work work</title>');
    });
  });

  describe('#attributes', () => {
    function modify(modifiers) {
      wrapper = shallow(<Asset style={{}} onClick={ () => {} } name='foo' height={ 1 } width={ 1 } color='red' />, {
        lifecycleExperimental: true,
        context: {
          modifiers: () => {
            return modifiers;
          },
          getItem: (name, fn) => {
            fn(null, {
              render: function () {
                return {
                  svg: data,
                  props: {}
                };
              }
            });
          }
        }
      });

      asset = wrapper.instance();
    }

    it('removes all PropsTypes that should not be on SVG elements', () => {
      modify(['color']);

      const attributes = asset.attributes();

      expect(attributes).not.toHaveProperty('name');
      expect(attributes).not.toHaveProperty('color');
      expect(attributes).not.toHaveProperty('viewBox');
      expect(attributes).toHaveProperty('height');
      expect(attributes).toHaveProperty('width');
      expect(attributes).toHaveProperty('style');
      expect(attributes).toHaveProperty('title');
    });

    it('merges with the supplied props', () => {
      modify(['color']);

      const attributes = asset.attributes({ viewBox: '0 0 1 1' });

      expect(attributes).not.toHaveProperty('name');
      expect(attributes).not.toHaveProperty('color');
      expect(attributes).toHaveProperty('height');
      expect(attributes).toHaveProperty('width');
      expect(attributes).toHaveProperty('style');
      expect(attributes).toHaveProperty('title');
      expect(attributes).toHaveProperty('viewBox');
    });
  });

  describe('events', () => {
    it('invokes `onLoadStart` when an asset is starting to load', next => {
        setup(Asset, {
          onLoadStart: function () {
            expect(this).toBeInstanceOf(Asset);
            expect(this.state.svg).toBeNull();

            next();
          },
          width: 10,
          height: 10,
          name: 'foo'
        }, () => {
          return {
            svg: data,
            props: { viewBox: '0 0 140 100' }
          };
        });
      }
    );

    it('invokes `onLoadStart` for `data=` assets', next => {
      setup(Asset, {
        onLoadStart: function () {
          expect(this).toBeInstanceOf(Asset);
          expect(this.state.svg).toEqual(data);

          next();
        },
        width: 10,
        height: 10,
        name: 'foo', data
      });
    });

    it('invokes `onLoad` when the asset is loaded', next => {
      setup(Asset, {
        onLoad: function () {
          expect(this).toBeInstanceOf(Asset);
          expect(this.state.svg).toEqual(data);

          next();
        },
        width: 10,
        height: 10,
        name: 'foo'
      }, () => {
        return {
          svg: data,
          props: { viewBox: '0 0 140 100' }
        };
      });
    });

    it('invokes `onLoad` for `data=` assets', next => {
      setup(Asset, {
        onLoad: function () {
          expect(this).toBeInstanceOf(Asset);
          expect(this.state.svg).toEqual(data);

          next();
        },
        width: 10,
        height: 10,
        data
      });
    });

    it.skip('invokes `onError` when an asset fails to load', next => {
      const error = new Error('Example failure');
      function onError(err) {
        expect(this).toBeInstanceOf(Asset);
        expect(err).toBeInstanceOf(Error);
        expect(err).toEqual(error);

        next();
      }

      shallow(<Asset name='foo' width={ 10 } height={ 10 } onError={ onError } />, {
        lifecycleExperimental: true,
        context: {
          getItem: (name, fn) => {
            fn(error);
          }
        }
      });
    });
  });

  describe('#componentWillReceiveProps', () => {
    it('updates rendered svg with the new changes', () => {
      const render = [
        (props) => {
          expect(props).toBeInstanceOf(Object);
          expect(props.name).toEqual('foo');
          expect(props.foo).toEqual('foo');

          return {
            svg: data,
            props: {
              viewBox: '1 3 3 7'
            }
          };
        },
        (props) => {
          expect(props).toBeInstanceOf(Object);
          expect(props.name).toEqual('foo');
          expect(props.foo).toEqual('bar');

          return {
            svg: data,
            props: {
              viewBox: '7 3 3 1'
            }
          };
        }
      ];

      setup(Asset, { name: 'foo', width: 10, height: 10, foo: 'bar' }, (...args) => {
        return render.pop()(...args);
      });

      expect(wrapper.html()).toContain('viewBox="7 3 3 1"');

      wrapper.setProps({ foo: 'foo' });
      expect(wrapper.html()).toContain('viewBox="1 3 3 7"');
      expect(wrapper.props().foo).toEqual('foo');
    });

    it('processes name changes', next => {
      const payload = {
        render: function () {
          return {
            svg: data,
            props: {}
          };
        }
      };

      const getItems = [
        (name, fn) => {
          expect(name).toEqual('bar');
          fn(null, payload);

          next();
        },
        (name, fn) => {
          expect(name).toEqual('foo');

          fn(null, payload);
        }
      ];

      wrapper = shallow(<Asset name='foo' width={ 10 } height={ 10 } />, {
        lifecycleExperimental: true,
        context: {
          modifiers: () => {
            return [];
          },
          getItem: (name, fn) => {
            getItems.pop()(name, fn);
          }
        }
      });

      wrapper.setProps({ name: 'bar' });
    });
  });
});

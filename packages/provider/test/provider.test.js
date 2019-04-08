/* eslint max-nested-callbacks: ["error", 10]*/

import Provider, { Asset, context, Fallback, READYSTATES, parser as p } from '../index';
import { shallow } from 'enzyme';
import React from 'react';

describe('Provider', () => {
  let testContext;

  beforeEach(() => {
    testContext = {};
  });

  let provider;
  let wrapper;

  const parser = {
    parse: function parser(format, data, fn) {
      fn(null, {});
    },
    modifiers: p.modifiers.bind(p)
  };

  beforeEach(() => {
    wrapper = shallow(
      <Provider uri='http://example.com/500' parser={ parser }>
        <div>Example</div>
      </Provider>
    );

    provider = wrapper.instance();
  });

  describe('#fetch', () => {
    it('sets the state to LOADING', () => {
      expect(provider.state.readyState).toEqual(READYSTATES.NOPE);

      provider.fetch(() => {});

      //
      // Sketchy assertion, because state updates are async, this start
      // failing in future updates of React.
      //
      expect(provider.state.readyState).toEqual(READYSTATES.LOADING);
    });

    it('calls the callback once done with final state update', next => {
      expect(provider.state.error).toBeNull();

      provider.fetch(() => {
        expect(provider.state.readyState).toEqual(READYSTATES.LOADED);
        expect(provider.state.error).toBeInstanceOf(Error);
        expect(provider.state.svgs).toBeInstanceOf(Object);

        next();
      });
    });

    it('does not call the fetch callback when we unmount', () => {
      expect(provider.mounted).toBe(true);

      provider.fetch(() => {
        throw new Error('I should never be called as we unmounted the instance');
      });

      wrapper.unmount();
      expect(provider.mounted).toBe(false);
    })

    it('props.url can be a function that returns the URL', next => {
      function uri(done) {
        expect(done).toBeInstanceOf(Function);
        expect(provider.state.url).toBeNull();

        done(null, 'http://example.com/500');

        setTimeout(function () {
          expect(typeof provider.state.url).toBe('string');
          expect(provider.state.url).toEqual('http://example.com/500');

          next();
        }, 10);
      }

      wrapper = shallow(
        <Provider uri={ uri } parser={ parser }>
        <Asset name='example' width='100' height='100' />
        </Provider>
      );

      provider = wrapper.instance();
      provider.fetch(() => {});
    });

    it.skip('executes props.url function in the same context as the component', next => {
        function uri(done) {
          done(null, 'http://example.com/500');

          expect(testContext.props).toBeInstanceOf(Object);
          expect(this).toEqual(provider);

          next();
        }

        wrapper = shallow(
          <Provider uri={ uri } parser={ parser }>
          <Asset name='example' width='100' height='100' />
          </Provider>
        );

        provider = wrapper.instance();
        provider.fetch(() => {});
      }
    );

    it('only calls props.url once to prevent multiple async URL lookups', next => {
        function uri(done) {
          expect(done).toBeInstanceOf(Function);
          expect(provider.state.url).toBeNull();

          done(null, 'http://example.com/500');

          setTimeout(function () {
            expect(typeof provider.state.url).toBe('string');
            expect(provider.state.url).toEqual('http://example.com/500');

            next();

            //
            // The extra fetch calls here are intentionally here, if the function
            // is executed multiple times, we will call the mocha next callback
            // multiple times which will result in an error.
            //
            provider.fetch(() => {});
            provider.fetch(() => {});
            provider.fetch(() => {});
          }, 10);
        }

        wrapper = shallow(
          <Provider uri={ uri } parser={ parser }>
          <Asset name='example' width='100' height='100' />
          </Provider>
        );

        provider = wrapper.instance();
        provider.fetch(() => {});
      }
    );

    it('sets readyState to LOADED if URL resolving failed', next => {
      function uri(done) {
        const failure = new Error('Failed to resolve URL in a timely manner');
        done(failure);

        setTimeout(function () {
          expect(provider.state.readyState).toEqual(READYSTATES.LOADED);
          expect(provider.state.error).toEqual(failure);
          expect(provider.state.svgs).toBeInstanceOf(Object);

          next();
        }, 10);
      }

      wrapper = shallow(
        <Provider uri={ uri } parser={ parser }>
        <Asset name='example' width='100' height='100' />
        </Provider>
      );

      provider = wrapper.instance();
      provider.fetch(() => {});
    });
  });

  describe('#modifiers', () => {
    it('returns an array', () => {
      expect(provider.modifiers()).toBeInstanceOf(Array);
    });

    it('returns the names of the props which have modifiers', () => {
      p.modify('fill', () => {});
      p.modify('color', () => {});

      expect(provider.modifiers()).toEqual(['fill', 'color']);
    });
  });

  describe('#getItem', () => {
    const ancestorFallback = () => <div>I feel so old</div>;
    const customFallback = () => <div>¯\_(ツ)_/¯</div>;

    function useCustomFallbackProvider(opts) {
      const fallback = opts ? opts.fallback : customFallback
      wrapper = shallow(
        <Provider uri='http://example.com/500' parser={ parser } fallback={ fallback }>
          <div>Example</div>
        </Provider>,
        opts && opts.options
      );

      provider = wrapper.instance();
    }

    it('queues the action if we are currently fetching a resource', () => {
      expect(provider.queue).toHaveLength(0);

      provider.getItem('what', () => {});

      expect(provider.queue).toHaveLength(1);
      expect(provider.queue[0][0]).toEqual('what');
    });

    it('starts fetching when we havent started fetching yet', () => {
      expect(provider.queue).toHaveLength(0);
      expect(provider.state.readyState).toEqual(READYSTATES.NOPE);

      provider.getItem('what', () => {});

      expect(provider.state.readyState).toEqual(READYSTATES.LOADING);
      expect(provider.queue).toHaveLength(1);
    });

    it('clears the queue after fetching is done', next => {
      provider.getItem('what', (err, data) => {
        expect(provider.queue).toHaveLength(1);
        expect(provider.queue[0][0]).toEqual('what');

        expect(provider.state.readyState).toEqual(READYSTATES.LOADED);

        expect(err).toBeInstanceOf(Error);
        expect(data).toEqual(Fallback);

        setTimeout(() => {
          expect(provider.queue).toHaveLength(0);
          next();
        }, 0);
      });
    });

    it('returns the fallback and error in case of error state', next => {
      provider.state.readyState = READYSTATES.LOADED;
      provider.state.error = new Error('Something went wrong');

      provider.getItem('name', (err, data) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toEqual('Something went wrong');

        expect(data).toEqual(Fallback);

        next();
      });
    });

    it('returns the custom fallback and error in case of error state', next => {
        useCustomFallbackProvider({ fallback: customFallback });
        provider.state.readyState = READYSTATES.LOADED;
        provider.state.error = new Error('Something went wrong');

        provider.getItem('name', (err, data) => {
          expect(err).toBeInstanceOf(Error);
          expect(err.message).toEqual('Something went wrong');

          expect(data).toEqual(customFallback);

          next();
        });
      }
    );

    it('returns the local custom fallback and error in case of error state', next => {
        useCustomFallbackProvider({
          fallback: customFallback,
          options: { context: { Fallback: ancestorFallback }}
        });
        provider.state.readyState = READYSTATES.LOADED;
        provider.state.error = new Error('Something went wrong');

        provider.getItem('name', (err, data) => {
          expect(err).toBeInstanceOf(Error);
          expect(err.message).toEqual('Something went wrong');

          expect(data).toEqual(customFallback);

          next();
        });
      }
    );

    it('returns the ancestor custom fallback and error in case of error state', next => {
        useCustomFallbackProvider({ options: { context: { Fallback: ancestorFallback }}});
        provider.state.readyState = READYSTATES.LOADED;
        provider.state.error = new Error('Something went wrong');

        provider.getItem('name', (err, data) => {
          expect(err).toBeInstanceOf(Error);
          expect(err.message).toEqual('Something went wrong');

          expect(data).toEqual(ancestorFallback);

          next();
        });
      }
    );

    it('returns the fallback and error when receiving an unknown name', next => {
        provider.state.readyState = READYSTATES.LOADED;

        provider.getItem('name', (err, data) => {
          expect(err).toBeInstanceOf(Error);
          expect(err.message).toEqual('Unknown SVG requested');

          expect(data).toEqual(Fallback);

          next();
        });
      }
    );

    it('returns the custom fallback and error when receiving an unknown name', next => {
        useCustomFallbackProvider({ fallback: customFallback });
        provider.state.readyState = READYSTATES.LOADED;

        provider.getItem('name', (err, data) => {
          expect(err).toBeInstanceOf(Error);
          expect(err.message).toEqual('Unknown SVG requested');

          expect(data).toEqual(customFallback);

          next();
        });
      }
    );

    it('returns the local custom fallback and error when receiving an unknown name', next => {
        useCustomFallbackProvider({
          fallback: customFallback,
          options: { context: { Fallback: ancestorFallback }}
        });
        provider.state.readyState = READYSTATES.LOADED;

        provider.getItem('name', (err, data) => {
          expect(err).toBeInstanceOf(Error);
          expect(err.message).toEqual('Unknown SVG requested');

          expect(data).toEqual(customFallback);

          next();
        });
      }
    );


    it('returns the ancestor custom fallback when no local fallback and error when receiving an unknown name', next => {
        useCustomFallbackProvider({ options: { context: { Fallback: ancestorFallback }}});
        provider.state.readyState = READYSTATES.LOADED;

        provider.getItem('name', (err, data) => {
          expect(err).toBeInstanceOf(Error);
          expect(err.message).toEqual('Unknown SVG requested');

          expect(data).toEqual(ancestorFallback);

          next();
        });
      }
    );

    it('returns the stored svg', next => {
      provider.state.readyState = READYSTATES.LOADED;
      provider.state.svgs = {
        name: 'data'
      };

      provider.getItem('name', (err, data) => {
        expect(err).toBeNull();
        expect(data).toEqual('data');

        next();
      });
    });
  });

  describe('.context', () => {
    it('shares the getItem method with the consumers', () => {
      const childContext = provider.getChildContext();

      expect(childContext).toBeInstanceOf(Object);
      expect(childContext.getItem).toEqual(provider.getItem);
    });

    it('shares the modifiers method with the consumers', () => {
      const childContext = provider.getChildContext();

      expect(childContext).toBeInstanceOf(Object);
      expect(childContext.modifiers).toEqual(provider.modifiers);
    });

    it('shares the Fallback svg with consumers', () => {
      const childContext = provider.getChildContext();

      expect(childContext).toBeInstanceOf(Object);
      expect(childContext.Fallback).toEqual(Fallback);
    });

    describe('{ context }', () => {
      it('shares its context proptypes', () => {
        expect(context).toBeInstanceOf(Object);

        expect(Provider.contextTypes).toEqual(context);
        expect(Provider.childContextTypes).toEqual(context);
      });
    });
  });
});

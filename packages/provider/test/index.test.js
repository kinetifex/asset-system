import Provider, { Asset, Fallback, context, parser } from '../index';
import Parser from 'asset-parser';
import { mount } from 'enzyme';
import React from 'react';

describe('Asset Provider', () => {
  /**
   * Assert that the complex fixture is present in the output.
   *
   * @param {String} html HTML output
   * @private
   */
  function complex(html) {
    /*eslint-disable */
    expect(html).toContain('<text y="20" dx="5 5"><tspan x="10">tspan line 1</tspan><tspan x="10" dy="15">tspan line 2</tspan><tspan x="10" dx="10" dy="15">tspan line 3</tspan></text>');
    expect(html).toContain('<text fill="red" style="font-size: 14px;" x="10" y="60"><tspan dy="5 10 20">12345</tspan><tspan fill="blue" dx="0 5 5" dy="15"><tspan>6</tspan><tspan>7</tspan></tspan><tspan style="font-size: 12px; font-weight: bold;" dx="0 10 20" dy="0 20">89a</tspan></text>');
    expect(html).toContain('<text y="140" dx="0 5 5" dy="0 -5 -5">delta on text</text>');
    /* eslint-enable */
  }
  /**
   * Assert that the godaddy fixture is present in the output.
   *
   * @param {String} html HTML output
   * @private
   */
  function godaddy(html) {
    expect(html).toContain('viewBox="0 0 127 55.2"');
    expect(html).toContain('viewBox="0 0 127 55.2"');
    expect(html).toContain('<path fill="#FFF" d="M8.3 32.5c-3.1 1.1-3.6 2.3-3.4 4.1.2 1.8 2.3 2.6 4.4 2.4">');
  }

  it('exposes all core components', () => {
    expect(parser).toBeInstanceOf(Parser);

    expect(Asset).toBeInstanceOf(Function);
    expect(Fallback).toBeInstanceOf(Function);

    expect(context).toBeInstanceOf(Object);
    expect(context).toEqual(Provider.contextTypes);
  });

  it('renders assets', next => {
    const wrapper = mount(
      <Provider uri='http://example.com/complex/bundle.svgs'>
        <Asset name='complex' height={ 100 } width={ 100 } />
      </Provider>
    );

    setTimeout(function () {
      const html = wrapper.html();
      complex(html);

      next();
    }, 100);
  });

  it('correctly resolves the `uri` function', next => {
    function uri(resolved) {
      setTimeout(function () {
        resolved(null, 'http://example.com/complex/bundle.svgs');
      }, 10);
    }

    const wrapper = mount(
      <Provider uri={ uri }>
        <Asset name='complex' height='100' width='100' />
      </Provider>
    );

    setTimeout(function () {
      const html = wrapper.html();
      complex(html);

      next();
    }, 100);
  })

  it('renders through nested context', next => {
    const wrapper = mount(
      <div>
        <Provider uri='http://example.com/complex/bundle.svgs'>
          <Provider uri='http://example.com/godaddy/bundle.svgs'>
            <Asset name='complex' height={ 100 } width={ 100 } />
            <Asset name='godaddy' height={ 100 } width={ 100 } />
          </Provider>
        </Provider>
      </div>
    );

    setTimeout(function () {
      const html = wrapper.html();

      complex(html);
      godaddy(html);

      next();
    }, 100);
  });
});

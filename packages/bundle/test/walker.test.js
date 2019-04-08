import * as walker from '../walker';
describe('walker', () => {
  describe('#componentName', () => {
    it('transforms svg elements to svgs component names', () => {
      expect(walker.componentName('tspan')).toEqual('TSpan');
      expect(walker.componentName('path')).toEqual('Path');
      expect(walker.componentName('radialGradient')).toEqual('RadialGradient');
    });
  });

  describe('#attributes', () => {
    it('camelCases the attributes', () => {
      const result = walker.attributes({
        'stroke-width': '10px'
      });

      expect(Object.keys(result)).toHaveLength(1);
      expect(result.strokeWidth).toEqual('10px');
    });

    it('renames properties if needed', () => {
      const result = walker.attributes({
        class: 'blue'
      });

      expect(Object.keys(result)).toHaveLength(1);
      expect(result.className).toEqual('blue');
    });

    it('transforms values to number when possible', () => {
      const result = walker.attributes({
        height: '10'
      });

      expect(Object.keys(result)).toHaveLength(1);
      expect(result.height).toEqual(10);
    });
  });
});

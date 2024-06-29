import { TClock } from '../../index';

describe('Interface: Package', function () {
  describe('global', function () {
    it('global', function () {
      // @ts-ignore
      assert(global['TClock'] !== Cache);
    });
  });

  describe('TClock', function () {
    it('TClock', function () {
      assert(typeof TClock === 'function');
    });
  });

});

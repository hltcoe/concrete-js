// As of v2.1.1, PhantomJS does not support Number.isInteger():
//   https://github.com/ariya/phantomjs/issues/14014
//
// The implementation below is copied from MDN:
//   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger

Number.isInteger = Number.isInteger || function(value) {
  return typeof value === 'number' &&
    isFinite(value) &&
    Math.floor(value) === value;
};

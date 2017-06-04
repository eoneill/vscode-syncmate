module.exports = function merge(target, ...sources) {
  return sources.reduce((target, source) => {
    Object.keys(source).forEach((key) => {
      target[key] = source[key];
    });
    return target;
  }, target || {});
};

module.exports = function merge(target, ...sources) {
  console.log('[merge#target]', target);
  console.log('[merge#sources]', sources);
  return sources.reduce((target, source) => {
    Object.keys(source).forEach((key) => {
      console.log('[key]', key, source.hasOwnProperty(key));
      target[key] = source[key];
    });
    return target;
  }, target || {});
};

let timer;
module.exports = function throttle(func, wait = 100) {
  return function throttled() {
    if (!timer) {
      timer = setTimeout(() => {
        func();
        timer = clearTimeout(timer);
      }, wait);
    }
  };
};

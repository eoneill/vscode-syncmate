module.exports = function pluralize(count, string = 'source') {
  if (Array.isArray(count)) {
    count = count.length;
  }
  return `${count} ${string}${count > 1 ? 's' : ''}`;
};

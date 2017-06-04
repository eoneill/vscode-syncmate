// simple logger
function Logger(outputChannel, verbose) {
  this.outputChannel = outputChannel;
  this.verbose = verbose;
}

function log(message, severity) {
  // only log error messages unless verbose
  if (!this.verbose && severity !== 'error') {
    return;
  }
  if (this.outputChannel && message) {
    const prefix = `[${severity.toUpperCase()}] `;
    message = message.replace(/(^|\n)/g, `$1${prefix}`);
    // don't repeat identical messages (reduces some noise)
    if (this.lastMessage !== message) {
      this.lastMessage = message;
      this.outputChannel.appendLine(message);
    }
  }
}

Logger.prototype.error = function(message) {
  log.call(this, message, 'error');
};

Logger.prototype.warn = function(message) {
  log.call(this, message, 'warning');
};

Logger.prototype.info = function(message) {
  log.call(this, message, 'info');
};

module.exports = Logger;

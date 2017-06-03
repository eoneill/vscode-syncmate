// simple logger
function Logger(outputChannel) {
  this.outputChannel = outputChannel;
}

function log(message, severity) {
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

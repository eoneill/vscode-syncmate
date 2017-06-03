const exec = require('child_process').exec;

function getSyncCommand(files) {
  const sources = files.map((file) => {
    return `"${file}"`;
  }).join(' ');
  return [
    `export SSH_AUTH_SOCK=$(find /tmp/*launch*/Listeners -user "${this.user}" -type s | head -1)`,
    `rsync -v -zarR ${this.flags} -e "ssh -p ${this.port}" ${sources} "${this.user}@${this.host}:${this.dest}"`
  ].join(' && ');
}

function SyncMate(options, cwd, outputChannel) {
  if (!options.host) {
    throw new Error('no host');
  }

  Object.assign(this, {
    port: 22,
    user: '$USER',
    host: null,
    dest: '/',
    flags: '',
    verbose: false
  }, options);

  this.cwd = cwd || process.cwd();

  this.log = function () {};
  if (this.verbose && outputChannel) {
    this.log = outputChannel.appendLine.bind(outputChannel);
  }

  this.inProgress = 0;
  this.tasks = [];
}

SyncMate.prototype.sync = function(files) {
  files = [].concat(files);
  this.log('Syncing files...');
  files.forEach((file) => {
    this.log(` - ${file}`);
  });
  const command = getSyncCommand.call(this, files);
  this.inProgress++;
  const promise = new Promise((resolve, reject) => {
    this.log('Executing rsync command...');
    this.log(`  ${command}`);
    exec(command, {
      cwd: this.cwd
    }, (error, stdout, stderr) => {
      this.inProgress--;
      this.log(`[stdout]`);
      this.log(stdout || '');
      this.log(`[stderr]`);
      this.log(stderr || '');
      if (error) {
        this.log(error);
        reject(error);
      } else {
        this.log('SUCCESS!');
        resolve();
      }
    });
  });

  this.tasks.push(promise);
  return promise;
};

SyncMate.prototype.done = function() {
  return new Promise((resolve) => {
    // if nothing in progress, we're done...
    if (!this.inProgress) {
      resolve();
    } else {
      const plural = this.inProgress > 1 ? 's' : '';
      this.log(`Waiting for ${this.inProgress} task${plural} to complete`);
      const retry = () => {
        // try again...
        this.done().then(resolve);
      };
      // when all the known tasks complete...
      Promise.all(this.tasks).then(retry).catch(retry);
    }
  });
};

module.exports = SyncMate;

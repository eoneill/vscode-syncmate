const exec = require('child_process').exec;
const p = require('./utils/pluralize');

function getSyncCommand(sources) {
  sources = sources.map((source) => {
    return `"${source}"`;
  }).join(' ');
  return [
    `export SSH_AUTH_SOCK=$(find /tmp/*launch*/Listeners -user "${this.user}" -type s | head -1)`,
    `rsync -zarR ${this.verbose ? '-v': ''} ${this.flags} -e "ssh -p ${this.port}" ${sources} "${this.user}@${this.host}:${this.dest}"`
  ].join('; ');
}

function SyncMate(options, cwd, log, excludes) {
  if (!options.host) {
    throw new Error('No host was provided');
  }

  Object.assign(this, options);

  this.cwd = cwd || process.cwd();
  this.log = log;

  this.inProgress = 0;
  this.tasks = [];

  // if no destination was provided...
  if (!this.dest) {
    // assume cwd on remote machine
    this.dest = cwd;
  }

  // move excludes to flags
  if (this.exclude) {
    const flags = Object.keys(this.exclude).reduce((excludes, key) => {
      if (this.exclude[key]) {
        excludes.push(key);
        // exclude nested files
        // prevents an error when saving a saved file in a directory that should be ignored
        excludes.push(`${key}/**/*`);
      }
      return excludes;
    }, []).map((key) => {
      return `--exclude="${key}"`;
    }).join(' ');

    if (flags) {
      this.flags = `${this.flags} ${flags}`;
    }
  }
}

SyncMate.prototype.sync = function(sources) {
  this.log.info(`Syncing ${p(sources)}...`);
  sources.forEach((source) => {
    this.log.info(`  ${sources}`);
  });
  const command = getSyncCommand.call(this, sources);
  this.inProgress++;
  const promise = new Promise((resolve, reject) => {
    this.log.info('Executing rsync command...');
    this.log.info(`  ${command}`);
    exec(command, {
      cwd: this.cwd
    }, (error, stdout, stderr) => {
      this.inProgress--;
      this.log.info(stdout);
      this.log.error(stderr);
      if (error) {
        this.log.error(error.message);
        reject(error);
      } else {
        this.log.info('SUCCESS!');
        resolve();
      }
    });
  });

  this.tasks.push(promise);
  this.done();
  return promise;
};

SyncMate.prototype.done = function() {
  return new Promise((resolve, reject) => {
    // if nothing in progress, we're done...
    if (!this.inProgress) {
      resolve();
      this.tasks = [];
    } else {
      this.log.info(`Waiting for ${p(this.inProgress, 'task')} to complete`);
      const retry = () => {
        // try again...
        this.done().then(resolve, reject);
      };
      // when all the known tasks complete...
      Promise.all(this.tasks).then(retry).catch(retry);
    }
  });
};

module.exports = SyncMate;

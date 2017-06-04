const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const SyncMate = require('./SyncMate');
const Logger = require('./Logger');
const p = require('./utils/pluralize');
const throttle = require('./utils/throttle');

let watcher;

exports.activate = function activate(context) {
  // get the syncmate config...
  const config = Object.assign({}, vscode.workspace.getConfiguration('syncmate'));

  // if enabled...
  if (config.enabled) {
    // create a logger instance using the output channel
    const log = new Logger(vscode.window.createOutputChannel('SyncMate'), config.verbose);

    // adjust the excludes
    const excludes = vscode.workspace.getConfiguration('files').exclude;
    if (config.exclude) {
      if (typeof config.exclude === 'object') {
        config.exclude = Object.assign(excludes, config.exclude);
      } else {
        config.exclude = excludes;
      }
    }

    // log our config
    log.info('SyncMate Config...');
    log.info(JSON.stringify(config, null, 2));

    // get workspace directory
    const rootPath = vscode.workspace.rootPath;

    // keep track of whether or not things are paused
    const pausedSources = new Set();
    let allPaused = false;

    // create SyncMate instance
    const syncMate = new SyncMate(config, rootPath, log);

    function setStatus(message) {
      if (message) {
        vscode.window.setStatusBarMessage(`SyncMate: ${message}`, 2000);
      }
    }

    // main function for syncing everything via SyncMate instance
    function syncDocuments(documents) {
      // exit if no documents passed in or we're paused all paused
      if (!documents || allPaused) {
        return;
      }

      // filter the documents into sources to sync
      const sources = [].concat(documents).filter((document) => {
        // path of the document
        const fsPath = document.uri.fsPath;

        // helper function to log why we skipped a source
        function skip(reason) {
          if (reason) {
            log.warn(`Skipping ${fsPath} (${reason})`);
          }
        }

        // not a "real" source
        if (document.isUntitled) {
          return skip();
        }

        // not in workspace
        if (!fsPath.startsWith(rootPath)) {
          return skip(`not in the workspace (${rootPath})`);
        }

        // does not exist
        if (!fs.existsSync(fsPath)) {
          return skip('does not exist');
        }

        // paused from syncing, skip
        if (pausedSources.has(fsPath)) {
          return skip();
        }

        // isDirty
        if (document.isDirty) {
          // if the dirty option is set
          if (config.dirty) {
            // ensure the `onSave` handler doesn't also fire
            pausedSources.add(fsPath);
            // save the document
            log.info(`Saving dirty file ${fsPath} (syncmate.dirty)`);
            // TODO - this might be a race condition
            //  if `save` doesn't complete by the time we invoke rsync
            document.save().then(() => {
              pausedSources.delete(fsPath);
            });
          } else {
            // otherwise, skip it
            return skip('dirty (unsaved) - set `syncmate.dirty: true` to sync dirty files');
          }
        }

        // if we got here, we want to sync the source
        return true;
      }).map((document) => {
        // map to relative path
        // NOTE: need to use path.relative instead of workspace.asRelativePath
        //  because asRelativePath returns an absolute path for when fsPath == rootPath
        return path.relative(rootPath, document.uri.fsPath) || './'; // ./ for syncProject
      });

      // no sources? exit
      if (!sources.length) {
        return;
      }

      // self-executing closure so we can retry if needed
      (function trySync() {
        setStatus(`Syncing ${p(sources)}`);
        // start the sync for the given sources
        syncMate.sync(sources).then(() => {
          // sync finished
          setStatus(`Completed ${p(sources)}`);
        }, () => {
          // sync failed
          setStatus(`Failed`);
          // if we're not in quiet mode...
          if (!config.quiet) {
            // let the user know things didn't work
            // ask them if they want to retry
            vscode.window.showErrorMessage(`SyncMate failed to sync all sources (see Output). Would you like to retry?`, {
              title: 'Retry'
            }).then((ok) => {
              // if yes...
              if (ok) {
                // try it again
                trySync();
              }
            })
          }
        });
      }());

      // after all syncs are done...
      syncMate.done().then(() => {
        log.info('All sync tasks finished');
        // wait 1 second
        setTimeout(() => {
          // then show done
          setStatus('Done');
        }, 1000);
      });
    }

    // sync an entire directory
    function syncDirectory(dir = '') {
      // helper function to wrap the directory as a TextDocument
      function sync() {
        syncDocuments({
          uri: {
            fsPath: path.join(rootPath, dir)
          }
        });
      }

      // if syncmate.dirty...
      if (config.dirty) {
        // pause all syncs until we finish saving...
        allPaused = true;
        // save all open files...
        vscode.workspace.saveAll().then(() => {
          // unpause
          allPaused = false;
          // then sync
          sync();
        });
      } else {
        // otherwise, just sync now
        sync();
      }
    }

    // watch modes...
    if (config.watch) {
      // if not a string...
      if (typeof config.watch !== "string") {
        config.watch = "**/*"; // watch everything
      }
      log.info(`watching ${config.watch}`);

      let updates = [];

      watcher = vscode.workspace.createFileSystemWatcher(config.watch);

      const sync = throttle(function sync(uri) {
        syncDocuments(updates);
        updates = [];
      });
      function handleFSEvent(uri) {
        updates.push({
          uri
        });
        sync();
      }

      // on fs events...
      watcher.onDidChange(handleFSEvent);
      watcher.onDidCreate(handleFSEvent);
    } else if (config.onSave) { // otherwise handle onSave
      vscode.workspace.onDidSaveTextDocument(syncDocuments, this, context.subscriptions);
    }

    if (config.onInit) {
      log.info("auto-syncing on initialization...");
      syncDirectory();
    }

    // syncOpenFiles
    context.subscriptions.push(vscode.commands.registerCommand('syncmate.syncOpenFiles', () => {
      // TODO: this doesn't seem to always grab _all_ "open" files
      syncDocuments(vscode.workspace.textDocuments);
    }));

    // syncProject
    context.subscriptions.push(vscode.commands.registerCommand('syncmate.syncProject', () => {
      // syncs the entire rootPath
      syncDirectory();
    }));

    // syncDirectory
    context.subscriptions.push(vscode.commands.registerCommand('syncmate.syncDirectory', () => {
      // prompt for the directory to sync
      vscode.window.showInputBox({
        prompt: `Diretory path to sync (relative to ${rootPath})`
      }).then(syncDirectory);
    }));
  } else {
    // otherwise, stub out all the actions to prompt the user to enable

    function promptToReload() {
      vscode.window.showInformationMessage('SyncMate will be enabled when you reload VS Code. Would you like to reload it now?', {
        title: 'Reload'
      }).then((ok) => {
        // if they approve...
        if (ok) {
          // reload!
          vscode.commands.executeCommand('workbench.action.reloadWindow');
        }
      });
    }

    function promptToEnable() {
      // warn user that syncmate is disabled and ask if they want to enable it
      vscode.window.showWarningMessage(`SyncMate is not enabled. Do you want to enable it?`, {
        title: 'Enable'
      }).then((ok) => {
        // if they approve
        if (ok) {
          // update `syncmate.enabled` in the config
          config.update('enabled', true).then(() => {
            // and now ask the user if they want to reload
            promptToReload();
          });
        }
      });
    }

    ['syncOpenFiles', 'syncProject', 'syncDirectory'].forEach((command) => {
      context.subscriptions.push(vscode.commands.registerCommand(`syncmate.${command}`, () => {
        const config = vscode.workspace.getConfiguration('syncmate');
        // if it's enabled now, we must reload
        if (config.enabled) {
          promptToReload();
        } else {
          promptToEnable();
        }
      }));
    });
  }
};

exports.deactivate = function deactivate() {
  if (watcher) {
    watcher.dispose();
  }
};

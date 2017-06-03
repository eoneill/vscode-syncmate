const vscode = require('vscode');
const path = require('path');
const SyncMate = require('./SyncMate');

exports.activate = function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('syncmate.reloadConfig', () => {
        init();

    }));

    function init() {
        const config = vscode.workspace.getConfiguration('syncmate');
        if (config.enabled) {
            const outputChannel = vscode.window.createOutputChannel('SyncMate');
            if (config.verbose) {
                outputChannel.appendLine(`Config...`);
                outputChannel.appendLine(JSON.stringify(config, null, 2));
            }
            const cwd = vscode.workspace.rootPath;
            const syncMate = new SyncMate(config, cwd, outputChannel);
            vscode.workspace.onDidSaveTextDocument((document) => {
                const file = path.relative(cwd, document.uri.fsPath);
                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Window,
                    title: 'SyncMate'
                }, (progress) => {
                    return new Promise((resolve) => {
                        syncMate.sync(file).then(() => {
                            progress.report({ message: `synced ${file}` });
                        }, () => {
                            progress.report({ message: `failed to sync ${file}` });
                            if (!config.quiet) {
                                vscode.window.showErrorMessage(`Failed to sync ${file}`);
                            }
                        });

                        // after all syncs are done...
                        syncMate.done().then(() => {
                            if (config.verbose) {
                                outputChannel.appendLine('All tasks completed');
                            }
                            // wait 2 seconds before we clear the progress status
                            setTimeout(resolve, 2000);
                        });
                    });
                });
            }, this, context.subscriptions);
        }
    }

    init();
};

exports.deactivate = function deactivate() {
};

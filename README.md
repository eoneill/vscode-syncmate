# SyncMate

A simple rsync extensions for VSCode. Inspired by [`SyncMate` for TextMate](https://github.com/eoneill/SyncMate.tmbundle).

## Features

- Sync a file on save
- Sync all open files
- Sync a directory
- Sync the entire project workspace

## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `syncmate.enabled` | Whether or not this extension is enabled | `false` |
| `syncmate.watch` | Whether or not to auto-sync files on change. Optionally, set a glob pattern to watch. If `true` will watch the entire workspace (`**/*`) | `true` |
| `syncmate.onSave` | Whether or not to auto-sync on file save. If `watch` mode is enabled, `onSave` is ignored and the watcher is used instead. | `true` |
| `syncmate.host` | The remote host location (hostname or IP) | `localhost` |
| `syncmate.dest` | The destination path on the remote | `/` |
| `syncmate.user` | The username to rsync with | `$(whoami)` |
| `syncmate.port` | The remote port | `22` |
| `syncmate.flags` | Additonal [rsync flags](https://download.samba.org/pub/rsync/rsync.html) to pass |  |
| `syncmate.verbose` | Whether or not to log additional details to the `Output` console | `false` |
| `syncmate.quiet` | If `false`, failures are displayed in an error banner. If `true`, failures are only shown in the status bar. | `false` |
| `syncmate.dirty` | Whether or not to sync dirty (unsaved) files | `false` |
| `syncmate.exclude` | Files to exclude. If `true`, defaults to `files.exclude`. If `false`, no excludes (other than specified via `syncmate.flags`). If an `Object` is provided, value is merged with `files.exclude` | `true` |

## Commands

| Command | Actions |
|---------|---------|
| `syncmate.syncOpenFiles` | Sync all open files. Does not sync "dirty" (unsaved) files unless `syncmate.dirty` is `true` |
| `syncmate.syncProject` | Sync the entire project |
| `syncmate.syncDirectory` | Sync an individual directory |

## Debugging / Troubleshooting

Set `syncmate.verbose` to `true` to see additional debugging details. You might have to pass additional rsync flags (`syncmate.flags`) to meet your needs.

If you're working in a project that has a lot of file system events (e.g. a broccoli build), you might want to disable the watcher (`syncmate.watch`).

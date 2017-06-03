# SyncMate

A simple rsync extensions for VSCode. Inspired by [`SyncMate` for TextMate](https://github.com/eoneill/SyncMate.tmbundle).

## Features

SyncMate will `rsync` a file on save.

## Extension Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `syncmate.enabled` | Whether or not this extension is enabled | `false` |
| `syncmate.host` | The remote host location (hostname or IP) | `"localhost"` |
| `syncmate.dest` | The destination path on the remote | `"/"` |
| `syncmate.user` | The username to rsync with | `"$USER"` |
| `syncmate.port` | The remote port | `22` |
| `syncmate.flags` | Additonal [rsync flags](https://download.samba.org/pub/rsync/rsync.html) to pass | `""` |
| `syncmate.verbose` | Whether or not to log additional details to the `Output` console | `false` |
| `syncmate.quiet` | If `false`, failures are displayed in an error banner. If `true`, failures are only shown in the status bar. | `false` |

## Debugging

Set `syncmate.verbose` to `true` to see additional debugging details. You might have to pass additional rsync flags (`syncmate.flags`) to meet your needs.

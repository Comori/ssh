# SSH exec command and transfer files

[![GitHub Super-Linter](https://github.com/actions/typescript-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/actions/typescript-action/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

A Github Action that lets you connect remote server with `SSH` , exec `command`
and transfer files.

> This action support: `linux`, `windows`, `macos`

## Usage

See [action.yml](action.yml)

| Fields      | Describe                                                                            |
| ----------- | ----------------------------------------------------------------------------------- |
| host        | Hostname or IP address of the server `required`                                     |
| username    | Username for authentication. eg: root `required`                                    |
| port        | Port number of the server.                                                          |
| password    | Password for password-based user authentication.                                    |
| privateKey  | private key for either key-based or hostbased user authentication (OpenSSH format). |
| command     | The shell command you want to execute. Multiple commands are separated by newlines. |
| sourceFiles | Source files to be transferred                                                      |
| targetDir   | Destination folder for file transfer                                                |
| scpFirst    | Whether to execute scp first. default `false`                                       |

**Basic**:

This is basic useage to exec `command` on remote server. connect with `password`

```yaml
- name: Exec cmd on remote server
  uses: Comori/ssh@v0.0.1
  with:
    host: ${{ secrets.HOST }}
    username: ${{ secrets.USERNAME }}
    password: ${{ secrets.PASSWORD }}
    command: |
      cd /data
      mkdir test
      jps -l
```

**SCP Files & Exec Command**

This is useage to SCP Files and exec `command` on remote server.

```yaml
- name: Exec cmd on remote server
  uses: Comori/ssh@v0.0.1
  with:
    host: ${{ secrets.HOST }}
    username: ${{ secrets.USERNAME }}
    privateKey: ${{ secrets.PRIVATEKEY }}
    command: |
      cd /data
      unzip -o dist.zip
    sourceFiles: |
      dist.zip
      dist/*
    targetDir: /data
    scpFirst: true
```

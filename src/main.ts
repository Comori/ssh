import * as core from '@actions/core'
import { NodeSSH } from 'node-ssh'
import * as glob from '@actions/glob'
import * as fs from 'fs'
import { basename, join } from 'path'

export class MainRunner {
  host: string
  port?: number
  username: string
  password?: string
  privateKey?: string
  command?: string[]
  sourceFiles?: string[]
  targetDir?: string
  scpFirst: boolean

  constructor() {
    this.host = core.getInput('host')
    this.username = core.getInput('username')
    this.password = core.getInput('password')
    this.privateKey = core.getInput('privateKey')
    if (this.isNull(this.password) && this.isNull(this.privateKey)) {
      core.error(`❌ password and privateKey cannot both empty!!!`)
      core.setFailed('😭 ssh params error!')
    }
    this.command = core.getMultilineInput('command')
    this.sourceFiles = core.getMultilineInput('sourceFiles')
    this.targetDir = core.getInput('targetDir')
    this.scpFirst = core.getBooleanInput('scpFirst')
    if (this.scpFirst) {
      if (this.isArrayEmpty(this.sourceFiles) || this.isNull(this.targetDir)) {
        core.error(`❌ if scpFirst, sourceFiles or targetDir cannot empty!!!`)
        core.setFailed('😭 ssh params error!')
      }
    }
  }

  async run(): Promise<boolean> {
    try {
      const ssh = new NodeSSH()
      const sshConfig: {
        host: string
        username: string
        password?: string
        privateKey?: string
        tryKeyboard: boolean
      } = { host: this.host, username: this.username, tryKeyboard: true }
      if (!this.isNull(this.password)) {
        sshConfig.password = this.password
      } else if (!this.isNull(this.privateKey)) {
        sshConfig.privateKey = this.privateKey
      }
      await ssh.connect(sshConfig)
      core.debug(`✅ ssh connect ${this.host} successfully!`)
      if (this.scpFirst) {
        await this.scpFun(ssh)
        await this.cmdFun(ssh)
      } else {
        await this.cmdFun(ssh)
        await this.scpFun(ssh)
      }
      core.debug(`✅ all task exec successfully!`)
      ssh.connection?.destroy()
    } catch (error) {
      core.error(`❌ Error : ${error}`)
      core.setFailed('😭 ssh run failed!')
    }
    return true
  }

  private async cmdFun(ssh: NodeSSH): Promise<boolean> {
    if (!this.isArrayEmpty(this.command)) {
      core.debug(`👉 exec raw command ${this.command}`)
      const cmdStr = this.command!.join(' && ')
      core.info(`👉 exec command ${cmdStr}`)
      const result = await ssh.execCommand(cmdStr)
      core.debug(`👉 exec result stdout: ${result.stdout}`)
      core.debug(`👉 exec result stderr: ${result.stderr}`)
      if (result.code !== 0) {
        core.error(`❌ exec command error : ${result.stderr}`)
        core.setFailed('😭 ssh exec cmd failed!')
        return false
      }
    } else {
      core.debug(`👉 raw command is empty!`)
    }
    return true
  }

  private async scpFun(ssh: NodeSSH): Promise<boolean> {
    core.debug(`👉 first to scp file`)
    const rootGlobber = await glob.create('./')
    const rootDir = rootGlobber.getSearchPaths()
    core.info(`👉 rootDir === ${rootDir}`)
    const globber = await glob.create(this.sourceFiles!.join('\n'))
    const filePathList = await globber.glob()
    core.info(`📋 files to upload:\n${filePathList.join('\n')}`)
    const putFiles: { local: string; remote: string }[] = []
    const putDirs: string[] = []
    for (const filePath of filePathList) {
      core.debug(`👉 filePath is : ${filePath}`)
      if (isDirectory(filePath)) {
        putDirs.push(filePath)
      } else {
        const exitsInDir =
          !this.isArrayEmpty(putDirs) &&
          putDirs.every(dir => filePath.includes(dir))
        core.debug(`👉 file is exitsInDir: ${exitsInDir}`)
        if (!exitsInDir) {
          putFiles.push({
            local: filePath,
            remote: join(this.targetDir!, basename(filePath))
          })
        }
      }
    }
    core.debug(`👉 putFiles list : ${putFiles.join('\n')}`)
    core.debug(`👉 putDirs list : ${putDirs.join('\n')}`)

    if (!this.isArrayEmpty(putDirs)) {
      for (const dir of putDirs) {
        await ssh.putDirectory(dir, this.targetDir!, { recursive: true })
      }
    }
    if (!this.isArrayEmpty(putFiles)) {
      await ssh.putFiles(putFiles)
    }
    return true
  }

  private isNull(str?: string): boolean {
    return str == null || str.length <= 0
  }

  private isArrayEmpty(
    ary?: string[] | { local: string; remote: string }[]
  ): boolean {
    return ary == null || ary.length <= 0
  }
}

function isDirectory(filePath: string): boolean {
  try {
    const stat: fs.Stats = fs.statSync(filePath)
    return stat.isDirectory()
  } catch (e) {
    // 如果路径不存在，则不是文件夹
    return false
  }
}

import * as tools from './tools'
import * as core from './core'

Object.assign(global, tools)
Object.assign(global, core)

declare global {
    const $: typeof core.$
    const argv: typeof core.argv
    const cd: typeof core.cd
    const kleur: typeof tools.kleur
    const fs: typeof tools.fs
    const glob: typeof tools.glob
    const nothrow: typeof core.nothrow
    const os: typeof tools.os
    const path: typeof tools.path
    const sleep: typeof core.sleep
    const YAML: typeof tools.YAML
    const io: typeof tools.io
    const read: typeof tools.read
    const write: typeof tools.write
    const template: typeof tools.template
    const style: typeof tools.style
    const resguard: typeof tools.resguard
}

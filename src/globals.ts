import * as _ from './index.js'

Object.assign(global, _)

declare global {
    const $: typeof _.$
    const argv: typeof _.argv
    const cd: typeof _.cd
    const kleur: typeof _.kleur
    const fs: typeof _.fs
    const glob: typeof _.glob
    const os: typeof _.os
    const path: typeof _.path
    const YAML: typeof _.YAML
    const io: typeof _.io
    const read: typeof _.read
    const write: typeof _.write
    const template: typeof _.template
    const style: typeof _.style
    const resguard: typeof _.resguard
    const exitHook: typeof _.exitHook
}

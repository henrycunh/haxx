import minimist from 'minimist'

export { default as os } from 'os'
export { default as path } from 'path'
export { default as kleur } from 'kleur'
export { default as fs } from 'fs-extra'
export { default as YAML } from 'yaml'
export { resguard } from 'resguard'

export * as glob from 'globby'
export { style } from 'kleur-template'
export { template } from './template.js'

export const argv = minimist(process.argv.slice(2))

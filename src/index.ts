import { spawn } from 'child_process'
import minimist from 'minimist'
import which from 'which'
import kleur from 'kleur'
import { ProcessPromise } from './process-promise'
import { ProcessOutput } from './process-output'
import { exitCodeInfo } from './utils/exit-code'

import { exists, io, read, remove, write } from './io'
import { template } from './template'

export const argv = minimist(process.argv.slice(2))
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export function $(tokens: string[], ...args: any[]) {
    const { verbose, shell, prefix, quote } = $

    const __from = (new Error('-').stack.split(/^\s*at\s/m)[2]).trim()

    let command = tokens[0]
    args.forEach((arg, index) => {
        const parsedArgument = Array.isArray(arg)
            ? arg.map(_arg => quote(pruneNewlines(_arg)))
            : quote(pruneNewlines(arg))
        command += parsedArgument + tokens[index]
    })

    let resolve, reject
    const promise = new ProcessPromise((...args) => [resolve, reject] = args)

    promise._run = () => {
        if (promise.child) return
        if (promise._prerun) promise._prerun()
        if (verbose) printCommand(command)

        const child = spawn(prefix + command, {
            cwd: process.cwd(),
            shell: typeof shell === 'string' ? shell : true,
            stdio: [promise._inheritStdin ? 'inherit' : 'pipe', 'pipe', 'pipe'],
            windowsHide: true,
        })
        let stdout = ''; let stderr = ''; let combined = ''
        child.on('exit', (exitCode) => {
            child.on('close', () => {
                const output = new ProcessOutput({
                    exitCode, stdout, stderr, combined, message: `${stderr || '\n'}    at ${__from}\n    exit code: ${exitCode}${exitCodeInfo(exitCode) ? ` (${exitCodeInfo(exitCode)})` : ''}`,
                })
                const resolveOrReject = (exitCode === 0 || promise._nothrow ? resolve : reject)
                resolveOrReject(output)
                promise._resolved = true
            })
        })
        const onStdout = (data) => {
            if (verbose) process.stdout.write(data)
            stdout += data
            combined += data
        }
        const onStderr = (data) => {
            if (verbose) process.stderr.write(data)
            stderr += data
            combined += data
        }
        if (!promise._piped) child.stdout.on('data', onStdout)
        child.stderr.on('data', onStderr)
        promise.child = child
        if (promise._postrun) promise._postrun()
    }

    setTimeout(promise._run, 0) // Make sure all subprocesses started.
    return promise
}

$.verbose = !argv.quiet
$.quote = quote

if (typeof argv.shell === 'string') {
    $.shell = argv.shell
    $.prefix = ''
}
else {
    try {
        $.shell = which.sync('bash')
        $.prefix = 'set -euo pipefail;'
    }
    catch (e) {
        $.prefix = ''
    }
}
if (typeof argv.prefix === 'string')
    $.prefix = argv.prefix

export function cd(path: string) {
    if ($.verbose) console.log('$', colorize(`cd ${path}`))
    process.chdir(path)
}

export function nothrow(promise) {
    promise._nothrow = true
    return promise
}

function pruneNewlines(argument: string | ProcessOutput) {
    if (argument instanceof ProcessOutput)
        return argument.stdout.replace(/\n$/, '')

    return argument.toString()
}

function quote(arg) {
    if (/^[a-z0-9/_.-]+$/i.test(arg) || arg === '')
        return arg

    const argScaped = arg
        .replace(/'/g, '\\\'')
        .replace(/\f/g, '\\f')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')
        .replace(/\v/g, '\\v')
        .replace(/\0/g, '\\0')
    return `$'${argScaped}'`
}

function printCommand(command: string) {
    if (/\n/.test(command)) {
        const colorizedCommand = command
            .split('\n')
            .map((line, i) => `${i === 0 ? '$' : '>'} ${colorize(line)}`)
            .join('\n')
        console.log(colorizedCommand)
    }
    else {
        console.log('$', colorize(command))
    }
}

function colorize(command: string) {
    return command.replace(/^[\w_.-]+(\s|$)/, (str) => {
        return kleur.green().bold(str)
    })
}
export { io, write, read, exists, remove, template }

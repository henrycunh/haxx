import minimist from 'minimist'
import which from 'which'
import { inspect } from 'util'
import kleur from 'kleur'

export const argv = minimist(process.argv.slice(2))
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const $ = (tokens: string[], ...args: any[]) => {
    const { verbose, shell, prefix, quote } = $

    const __from = (new Error('-').stack.split(/^\s*at\s/m)[2]).trim()

    let command = tokens.shift()
    args.forEach((arg, index) => {
        const parsedArgument = Array.isArray(arg) 
            ? arg.map(_arg => quote(pruneNewlines(_arg)))
            : quote(pruneNewlines(arg))
        command += parsedArgument + tokens[index]
    })

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

export class ProcessOutput extends Error {

    #exitCode: number
    #stdout: any
    #stderr: any
    #combined: any

    public constructor({ exitCode, stdout, stderr, combined, message }) {
        super(message)
        this.#exitCode = exitCode
        this.#stdout = stdout
        this.#stderr = stderr
        this.#combined = combined
    }

    toString() {
        return this.#combined
    }

    get stdout() {
        return this.#stdout
    }

    get stderr() {
        return this.#stderr
    }

    get exitCode() {
        return this.#exitCode
    }

    [inspect.custom]() {
        const render = (text: string, color?: Function) => 
            text.length ? (color ? color(text) : text) : `''` 
        return `ProcessOutput {
        stdout: ${render(this.stdout, kleur.green)},
        stderr: ${render(this.stderr, kleur.red)},
        exitCode: ${
            (this.exitCode === 0 
                ? kleur.green 
                : kleur.red
            )(this.exitCode)
        }${
            (exitCodeInfo(this.exitCode) 
                ? kleur.grey(' (' + exitCodeInfo(this.exitCode) + ')') 
                : ''
            )
        }
}`
    }
}

function pruneNewlines (argument: string | ProcessOutput) {
    if (argument instanceof ProcessOutput) {
        return argument.stdout.replace(/\n$/, '')
    }
    return argument.toString()
}

function exitCodeInfo(exitCode) {
    return {
        2: 'Misuse of shell builtins',
        126: 'Invoked command cannot execute',
        127: 'Command not found',
        128: 'Invalid exit argument',
        129: 'Hangup',
        130: 'Interrupt',
        131: 'Quit and dump core',
        132: 'Illegal instruction',
        133: 'Trace/breakpoint trap',
        134: 'Process aborted',
        135: 'Bus error: "access to undefined portion of memory object"',
        136: 'Floating point exception: "erroneous arithmetic operation"',
        137: 'Kill (terminate immediately)',
        138: 'User-defined 1',
        139: 'Segmentation violation',
        140: 'User-defined 2',
        141: 'Write to pipe with no one reading',
        142: 'Signal raised by alarm',
        143: 'Termination (request to terminate)',
        145: 'Child process terminated, stopped (or continued*)',
        146: 'Continue if stopped',
        147: 'Stop executing temporarily',
        148: 'Terminal stop signal',
        149: 'Background process attempting to read from tty ("in")',
        150: 'Background process attempting to write to tty ("out")',
        151: 'Urgent data available on socket',
        152: 'CPU time limit exceeded',
        153: 'File size limit exceeded',
        154: 'Signal raised by timer counting virtual time: "virtual timer expired"',
        155: 'Profiling timer expired',
        157: 'Pollable event',
        159: 'Bad syscall',
    }[exitCode]
}

function quote (arg) {
    if (/^[a-z0-9/_.-]+$/i.test(arg) || arg === '') {
        return arg
    }
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
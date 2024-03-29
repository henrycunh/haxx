#!/usr/bin/env node
import { createRequire } from 'module'
import path from 'path'
import { tmpdir } from 'os'
import url from 'url'
import fs from 'fs-extra'
import { $, ProcessOutput } from './index.js'

const { log } = console

async function cli() {
    await import('./globals.js')

    if (argv.version) return log(getVersion())

    if (argv.quiet) $.verbose = false
    if (argv.shell) $.shell = argv.shell
    if (argv.prefix) $.prefix = argv.prefix

    if (argv.help) return printUsage()

    if (argv.eval) await runScript(argv.eval)

    const firstArg = argv._.shift()
    if (typeof firstArg === 'undefined' || firstArg === '-') {
        const ok = await scriptFromStdin()
        if (!ok) {
            printUsage()
            process.exit(2)
        }
    }

    else if (/^https:?:/.test(firstArg)) {
        await scriptFromHttp(firstArg)
    }

    if (firstArg) {
        const filepath = firstArg.startsWith('file:///')
            ? url.fileURLToPath(firstArg)
            : path.resolve(firstArg)

        await importPath(filepath)
    }
}

try {
    await cli()
}
catch (p) {
    if (p instanceof ProcessOutput) {
        console.error(`Error: ${p.message}`)
        process.exit(1)
    }
    else {
        throw p
    }
}

async function runScript(script: string) {
    const filepath = path.join(process.cwd(), `zx-${randomId()}.mjs`)
    await writeAndImport(script, filepath)
}

async function scriptFromStdin() {
    let script = ''
    if (!process.stdin.isTTY) {
        process.stdin.setEncoding('utf8')
        for await (const chunk of process.stdin)
            script += chunk

        if (script.length > 0) {
            const filepath = path.join(
                tmpdir(),
                `${Math.random().toString(36).substr(2)}.mjs`,
            )
            await fs.mkdtemp(filepath)
            await writeAndImport(script, filepath, path.join(process.cwd(), 'stdin.mjs'))
            return true
        }
    }
    return false
}

async function scriptFromHttp(remote: string) {
    const res = await fetch(remote)
    if (!res.ok) {
        console.error(`Error: Can't get ${remote}`)
        process.exit(1)
    }
    const script = await res.text()
    const filename = new URL(remote).pathname
    const filepath = path.join(tmpdir(), path.basename(filename))
    await fs.mkdtemp(filepath)
    await writeAndImport(script, filepath, path.join(process.cwd(), path.basename(filename)))
}

async function writeAndImport(script: string | Buffer, filepath: string, origin = filepath) {
    await fs.writeFile(filepath, script)
    const wait = importPath(filepath, origin)
    await fs.rm(filepath)
    await wait
}

async function importPath(filepath: string, origin = filepath) {
    const ext = path.extname(filepath)

    if (ext === '') {
        const tmpFilename = fs.existsSync(`${filepath}.mjs`)
            ? `${path.basename(filepath)}-${Math.random().toString(36).slice(2)}.mjs`
            : `${path.basename(filepath)}.mjs`

        return await writeAndImport(
            await fs.readFile(filepath),
            path.join(path.dirname(filepath), tmpFilename),
            origin,
        )
    }

    if (ext === '.ts') {
        const tmpFilename = `${path.basename(filepath)}-${Math.random().toString(36).slice(2)}.mjs`
        const tmpFilepath = path.join(path.dirname(filepath), tmpFilename)
        await $`tsc --outFile ${tmpFilepath} ${filepath}`
        // await importPath(tmpFilepath, origin)
        return
    }

    const __filename = path.resolve(origin)
    const __dirname = path.dirname(__filename)
    const require = createRequire(origin)
    Object.assign(global, { __filename, __dirname, require })
    await import(url.pathToFileURL(filepath).toString())
}

function printUsage() {
    console.log(`
    Usage:
            haxx [options] <script>
    Options:
            --quiet            : don't echo commands
            --shell=<path>     : custom shell binary
            --prefix=<command> : prefix all commands
`)
}

function getVersion(): string {
    return createRequire(import.meta.url)('../package.json').version
}

function randomId() {
    return Math.random().toString(36).slice(2)
}

#!/usr/bin/env bun
import { createRequire } from 'module'
import path from 'path'
import { tmpdir } from 'os'
import url from 'url'
import fs from 'fs-extra'
import { registerGlobals } from './global'
import { ProcessOutput } from './process-output'

registerGlobals()

try {
    if (['--version', '-v', '-V'].includes(process.argv[2] || '')) {
        console.log(`haxx version ${createRequire(import.meta.url)('./package.json').version}`)
        process.exit(0)
    }
    const firstArg = process.argv.slice(2).find(a => !a.startsWith('--'))
    if (typeof firstArg === 'undefined' || firstArg === '-') {
        const ok = await scriptFromStdin()
        if (!ok) {
            printUsage()
            process.exit(2)
        }
    }
    else if (firstArg.startsWith('http://') || firstArg.startsWith('https://')) {
        await scriptFromHttp(firstArg)
    }
    else {
        let filepath
        if (firstArg.startsWith('/'))
            filepath = firstArg

        else if (firstArg.startsWith('file:///'))
            filepath = url.fileURLToPath(firstArg)

        else
            filepath = path.resolve(firstArg)

        await importPath(filepath)
    }
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

async function scriptFromHttp(remote) {
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

async function writeAndImport(script, filepath, origin = filepath) {
    await fs.writeFile(filepath, script)
    const wait = importPath(filepath, origin)
    await fs.rm(filepath)
    await wait
}

async function importPath(filepath, origin = filepath) {
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

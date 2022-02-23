import { inspect } from 'util'
import kleur from 'kleur'
import { exitCodeInfo } from './utils/exit-code'

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
        return this.#combined.trim()
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
            text.length ? (color ? color(text) : text) : '\'\''
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
        ? kleur.grey(` (${exitCodeInfo(this.exitCode)})`)
        : ''
    )
}
}`
    }
}

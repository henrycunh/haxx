import { promisify } from 'util'
import psTree from 'ps-tree'

const psTreeAsync = promisify(psTree)

export class ProcessPromise<T = Function> extends Promise<T> {
    child = undefined
    _nothrow = false
    _resolved = false
    _inheritStdin = true
    _piped = false
    _prerun: Function
    _run: Function
    _postrun: Function

    get stdin() {
        this._inheritStdin = false
        this._run()
        return this.child.stdin
    }

    get stdout() {
        this._inheritStdin = false
        this._run()
        return this.child.stdout
    }

    get stderr() {
        this._inheritStdin = false
        this._run()
        return this.child.stderr
    }

    get exitCode() {
        return this
            .then((process: any) => process.exitCode)
            .catch((process: any) => process.exitCode)
    }

    then<TR1 = T, TR2 = never>(
        onFullfiled?: ((value: T) => TR1 | PromiseLike<TR1>) | undefined | null,
        onRejected?: ((reason: any) => TR2 | PromiseLike<TR2>) | undefined | null,
    ) {
        if (this._run) this._run()
        return super.then(onFullfiled, onRejected)
    }

    pipe(dest) {
        if (typeof dest === 'string')
            throw new Error('The pipe() method does not take strings. Forgot $?')

        if (this._resolved === true)
            throw new Error('The pipe() method shouldn\'t be called after promise is already resolved!')

        this._piped = true
        if (dest instanceof ProcessPromise) {
            dest._inheritStdin = false
            dest._prerun = this._run
            dest._postrun = () => this.stdout.pipe(dest.child.stdin)
            return dest
        }
        else {
            this._postrun = () => this.stdout.pipe(dest)
            return this
        }
    }

    async kill(signal = 'SIGTERM') {
        this.catch(_ => _)
        const children = await psTreeAsync(this.child.pid)
        for (const p of children) {
            try {
                process.kill(p.PID, signal)
            }
            catch (e) {
            }
        }
        try {
            process.kill(this.child.pid, signal)
        }
        catch (e) {
        }
    }
}

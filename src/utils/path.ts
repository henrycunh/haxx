
import path from 'path'

export function interpretPath(args) {
    // @ts-expect-error argument spreading :[
    const pathFromArgs = typeof args[0] === 'string' ? args[0] : String.raw(...args)
    return path.resolve(process.cwd(), pathFromArgs)
}

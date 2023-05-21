import fs from 'fs-extra'
import yaml from 'yaml'
import { interpretPath } from './utils/path'

interface IOObject<T> {
    data: any
    write: (data: T) => Promise<void>
    read: () => Promise<T>
}

async function createObject<T>(
    read: () => Promise<T>,
    write: (data: T) => Promise<void>,
): Promise<IOObject<T>> {
    const obj = {
        data: await read(),
        write: async(data = obj.data) => {
            return await write(data)
        },
        read: async() => {
            obj.data = await read()
            return obj.data
        },
    }
    return obj
}

async function createSyncObject(read: Function, write: Function) {
    const obj = {
        data: read(),
        save: (data = obj.data) => {
            return write(data)
        },
        read: () => {
            obj.data = read()
            return obj.data
        },
    }
    return obj
}

export function exists(...args: any[]): boolean {
    const path = interpretPath(args)
    return fs.existsSync(path)
}

export async function remove(...args: any[]) {
    const path = interpretPath(args)
    return fs.remove(path)
}

export async function read(...args: string[]) {
    const path = interpretPath(args)
    return fs.readFile(path, 'utf-8')
}

read.sync = (...args: any) => {
    const path = interpretPath(args)
    return fs.readFileSync(path, 'utf-8')
}

async function readJSON(...args: any[]) {
    const path = interpretPath(args)
    return fs.readJSON(path)
}

readJSON.sync = (...args: any) => {
    const path = interpretPath(args)
    return fs.readJSONSync(path)
}

read.json = readJSON

async function readYAML(...args: any[]) {
    const path = interpretPath(args)
    return yaml.parse(await read(path))
}

readYAML.sync = (...args: any) => {
    const path = interpretPath(args)
    return yaml.parse(read.sync(path))
}

read.yaml = readYAML

export async function write(path: number | fs.PathLike, content: any) {
    return fs.writeFile(path, content, 'utf-8')
}

write.sync = (path: fs.PathOrFileDescriptor, content: string | NodeJS.ArrayBufferView) => {
    return fs.writeFileSync(path, content, 'utf-8')
}

write.json = async(path: string, content: any, spaces = 2) => {
    return fs.writeJSON(path, content, { spaces })
}

write.yaml = (path: number | fs.PathLike, content: any, spaces = 2) => {
    return fs.writeFile(path, yaml.stringify(content, {
        indent: spaces,
    }), 'utf-8')
}

export async function io(...args: any[]): Promise<IOObject<string> & {
    json: IOObject<any>
    yaml: IOObject<any>
}> {
    const path = interpretPath(args)

    return await createObject(
        () => fs.readFile(path, 'utf-8'),
        (data: any) => fs.writeFile(path, data, 'utf-8'),
    ) as any
}

io.sync = (...args: any) => {
    const path = interpretPath(args)
    return createSyncObject(
        () => fs.readFileSync(path, 'utf-8'),
        (data: string | NodeJS.ArrayBufferView) => fs.writeFileSync(path, data, 'utf-8'),
    )
}

async function jsonIO(...args: any[]) {
    const path = interpretPath(args)

    return await createObject(
        () => fs.readJSON(path),
        (data: any) => fs.writeJSON(path, data),
    )
}

jsonIO.sync = (...args: any) => {
    const path = interpretPath(args)

    return createSyncObject(
        () => fs.readJSONSync(path),
        (data: any) => fs.writeJSONSync(path, data),
    )
}

jsonIO.spaces = 0
io.json = jsonIO

async function yamlIO(...args: any[]) {
    const path = interpretPath(args)

    return await createObject(
        () => new Promise<any>((resolve, reject) => {
            fs.readFile(path, 'utf-8', (err, data) => {
                if (err) return reject(err)
                resolve(yaml.parse(data))
            })
        }),
        (data: any) => new Promise<void>((resolve, reject) => {
            fs.writeFile(path, yaml.stringify(data, {
                indent: yamlIO.spaces,
            }), 'utf-8', (err) => {
                if (err) return reject(err)
                resolve()
            })
        }),
    )
}

yamlIO.sync = (...args: any) => {
    const path = interpretPath(args)

    return createSyncObject(
        () => yaml.parse(fs.readFileSync(path, 'utf-8')),
        (data: any) => fs.writeFileSync(path, yaml.stringify(data, {
            indent: yamlIO.spaces,
        }), 'utf-8'),
    )
}

yamlIO.spaces = 2
io.yaml = yamlIO

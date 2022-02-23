import fs from 'fs-extra'
import yaml from 'yaml'
import { interpretPath } from './utils/path'

async function createObject(read, write) {
    const obj = {
        data: await read(),
        save: async(data = obj.data) => {
            return await write(data)
        },
        read: async() => {
            obj.data = await read()
            return obj.data
        },
    }
    return obj
}

async function createSyncObject(read, write) {
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

export function exists(...args) {
    const path = interpretPath(args)
    return fs.existsSync(path)
}

export async function remove(...args) {
    const path = interpretPath(args)
    return fs.remove(path)
}

export async function read(...args) {
    const path = interpretPath(args)
    return fs.readFile(path, 'utf-8')
}

read.sync = (...args) => {
    const path = interpretPath(args)
    return fs.readFileSync(path, 'utf-8')
}

async function readJSON(...args) {
    const path = interpretPath(args)
    return fs.readJSON(path)
}

readJSON.sync = (...args) => {
    const path = interpretPath(args)
    return fs.readJSONSync(path)
}

read.json = readJSON

async function readYAML(...args) {
    const path = interpretPath(args)
    return yaml.parse(await read(path))
}

readYAML.sync = (...args) => {
    const path = interpretPath(args)
    return yaml.parse(read.sync(path))
}

read.yaml = readYAML

export async function write(path, content) {
    return fs.writeFile(path, content, 'utf-8')
}

write.sync = (path, content) => {
    return fs.writeFileSync(path, content, 'utf-8')
}

write.json = async(path, content, spaces = 2) => {
    return fs.writeJSON(path, content, { spaces })
}

write.yaml = (path, content, spaces = 2) => {
    return fs.writeFile(path, yaml.stringify(content, {
        indent: spaces,
    }), 'utf-8')
}

export async function io(...args) {
    const path = interpretPath(args)

    return await createObject(
        () => fs.readFileSync(path, 'utf-8'),
        data => fs.writeFile(path, data, 'utf-8'),
    )
}

io.sync = (...args) => {
    const path = interpretPath(args)
    return createSyncObject(
        () => fs.readFileSync(path, 'utf-8'),
        data => fs.writeFileSync(path, data, 'utf-8'),
    )
}

async function jsonIO(...args) {
    const path = interpretPath(args)

    return await createObject(
        () => fs.readJSON(path),
        data => fs.writeJSON(path, data),
    )
}

jsonIO.sync = (...args) => {
    const path = interpretPath(args)

    return createSyncObject(
        () => fs.readJSONSync(path),
        data => fs.writeJSONSync(path, data),
    )
}

jsonIO.spaces = 0
io.json = jsonIO

async function yamlIO(...args) {
    const path = interpretPath(args)

    return await createObject(
        () => new Promise<any>((resolve, reject) => {
            fs.readFile(path, 'utf-8', (err, data) => {
                if (err) return reject(err)
                resolve(yaml.parse(data))
            })
        }),
        data => new Promise<void>((resolve, reject) => {
            fs.writeFile(path, yaml.stringify(data, {
                indent: yamlIO.spaces,
            }), 'utf-8', (err) => {
                if (err) return reject(err)
                resolve()
            })
        }),
    )
}

yamlIO.sync = (...args) => {
    const path = interpretPath(args)

    return createSyncObject(
        () => yaml.parse(fs.readFileSync(path, 'utf-8')),
        data => fs.writeFileSync(path, yaml.stringify(data, {
            indent: yamlIO.spaces,
        }), 'utf-8'),
    )
}

yamlIO.spaces = 2
io.yaml = yamlIO

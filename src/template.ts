import path from 'path'
import mustache from 'mustache'
import fs from 'fs-extra'

export const template = (data: any, templateContent: string) => mustache.render(templateContent, data)

template.file = (data: any, filePath: string) => {
    const templateContent = fs.readFileSync(path.resolve(process.cwd(), filePath), 'utf-8')
    return mustache.render(templateContent, data)
}

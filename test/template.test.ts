import path from 'path'
import { describe, expect, it } from 'vitest'
import { template } from '../src/template'

describe('Templating feature', () => {
    const data = {
        name: 'John',
        age: 30,
    }

    it('should properly render a valid template', () => {
        const rendered = template(data, 'Hello {{ name }}, you are {{ age }} years old.')
        expect(rendered)
            .toMatchInlineSnapshot('"Hello John, you are 30 years old."')
    })

    it('should fail on an invalid template', () => {
        expect(() => template(data, 'Hello {{ name }'))
            .toThrowErrorMatchingInlineSnapshot('"Unclosed tag at 15"')
    })

    it('should properly render a valid template from a file', () => {
        const fixture = path.resolve(__filename, '../fixtures/template.mustache')
        const rendered = template.file(data, fixture)
        expect(rendered).toMatchInlineSnapshot('"Hello John, you are 30 years old."')
    })
})

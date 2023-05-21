import { describe, expect, it } from 'vitest'
import { $ } from '../src/index'

describe('Process parsing feature', async() => {
    it('should properly parse a process', async() => {
        const { data } = await $`echo hello world`
        expect(data)
            .toMatchInlineSnapshot('"hello world"')
        expect($`echo ${data}`._command)
            .toMatchInlineSnapshot('"echo $\'hello world\'"')
    })

    it('should be readable as string', async() => {
        const output = String(await $`echo my output`)
        expect(output).toMatchInlineSnapshot('"my output"')
    })
})

import { describe, expect, it } from 'vitest'
import { $ } from '../src/index'

describe('Process parsing feature', async() => {
    it('should properly parse a process', async() => {
        const process = $`echo hello world`
        expect(process.command)
            .toMatchInlineSnapshot('"echo hello world"')
        expect($`echo ${await process}`.command)
            .toMatchInlineSnapshot('"echo \'hello world\'"')
    })

    it('should be readable as string', async() => {
        const output = String(await $`echo my output`)
        expect(output).toMatchInlineSnapshot('"my output"')
    })
})

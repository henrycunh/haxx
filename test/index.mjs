/* eslint-disable no-undef */
const section = what => console.log(`\nTesting ${kleur.bold().green(what)}`)

section('file creation')
await write('test-file', 'test content')
await $`rm test-file`

section('JSON parsing')
await write.json('test-file.json', { test: 1 })
console.log(await read.json('test-file.json'))
await $`rm test-file.json`

section('YAML parsing')
await write.yaml('test-file.yaml', { test: 1 })
const { data, save } = await io.yaml`test-file.yaml`
data.test = 2
save()
console.log(await read.yaml('test-file.yaml'))
await $`rm test-file.yaml`

section('templating')
console.log(template({ test: 20 }, 'test value is {{ test }}'))

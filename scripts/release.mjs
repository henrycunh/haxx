import { $, argv, io, kleur, read } from '../dist/index.mjs'

// $.verbose = false
io.json.spaces = 4

const lastTag = `${await $`git tag | sort -V | tail -n 1`}`.trim()

const { _: [, type] } = argv
if (type === undefined) {
    console.log('usage: node release.mjs [type]')
    process.exit(1)
}

const nextVersion = ({
    patch: (version) => {
        const [major, minor, patch] = version.split('.')
        return `${major}.${minor}.${+patch + 1}`
    },
    minor: (version) => {
        const [major, minor] = version.split('.')
        return `${major}.${+minor + 1}.0`
    },
    major: (version) => {
        const [major] = version.split('.')
        return `${+major + 1}.0.0`
    },
})[type](lastTag)

console.log(`${kleur.green(type)} release version ${kleur.green(nextVersion)}`)

console.log(`changing version in package.json to ${kleur.green(nextVersion)}`)
const { data: pkg, save } = await io.json`package.json`
pkg.version = nextVersion
await save()

const commitMessage = `chore(release): ${nextVersion}`

await $`git add package.json`
await $`git commit -m ${commitMessage}`

console.log(`creating tag ${kleur.green(nextVersion)}`)
await $`git tag ${nextVersion}`

console.log('generating changelog...')
await $`npx conventional-changelog -y -p angular -i CHANGELOG.md -s -r 0 -o CHANGELOG.md`
await $`git add CHANGELOG.md`
await $`git commit --amend -m ${commitMessage}`

// get last tag changes from changelog
const changelog = await read`CHANGELOG.md`
const nextVersionChanges = changelog
    .split(/## \[/)
    .map((section) => {
        const content = section.split('\n').slice(1).join('\n').trim()
        const titleMatch = section.split('\n')[0].match(/([^\]]+)/)
        const title = titleMatch ? titleMatch[1] : ''
        return { title, content }
    })
    .filter(({ content }) => content.length)
    .find(({ title }) => title.includes(nextVersion))

console.log(`annotating tag ${kleur.green(nextVersion)}`)
await $`git tag -d ${nextVersion}`
await $`git tag ${nextVersion} -m ${nextVersionChanges.content}`

await $`git push origin ${nextVersion}`
await $`git push origin main`

await $`nr build`
await $`npm publish --access public`
console.log(`${kleur.green(nextVersion)} release complete`)

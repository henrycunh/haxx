import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
    declaration: true,
    rollup: {
        emitCJS: false,
        inlineDependencies: true,
        esbuild: { target: 'esnext' },
    },
    entries: [
        './src/index',
        './src/do',
    ],
})

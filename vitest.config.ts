import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        exclude: ['**/*.mjs', 'node_modules'],
    },
})

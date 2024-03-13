/// <reference types="vitest" />
import { defineConfig, mergeConfig } from 'vite'
import { defineConfig as defineVitestConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
const viteConfig = defineConfig({
  plugins: [tsconfigPaths()],
})

const vitestConfig = defineVitestConfig({
  test: {
    globals: true,
    testTimeout: 120000,
    hookTimeout: 60000,
  },
})

export default mergeConfig(viteConfig, vitestConfig)

import { defineConfig } from 'rollup'
import typescript from '@rollup/plugin-typescript'

const external = ['node:path', 'node:fs', 'find-up', 'rollup', 'typescript']

const plugins = [
  typescript({
    declaration: false,
    declarationMap: false,
  }),
]

export default defineConfig([
  {
    input: 'build/rollup-plugin-resolve-extensions/index.ts',
    output: {
      file: 'build/rollup-plugin-resolve-extensions/index.js',
      format: 'es',
    },
    plugins,
    external,
  },
])

import { defineConfig } from 'rollup'
import typescript from '@rollup/plugin-typescript'
import json from '@rollup/plugin-json'

const external = [
  '@noble/secp256k1',
  '@xmtp/proto',
  '@xmtp/user-preferences-bindings-wasm',
  'assert',
  'async-mutex',
  'benny',
  'crypto',
  'elliptic',
  'long',
  'viem',
]

const plugins = [
  typescript({
    declaration: false,
    declarationMap: false,
  }),
  json({
    preferConst: true,
  }),
]

export default defineConfig([
  {
    input: 'bench/index.ts',
    output: {
      file: 'dist/bench/index.cjs',
      format: 'cjs',
    },
    plugins,
    external,
  },
])

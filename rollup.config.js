import { defineConfig } from 'rollup'
import typescript from '@rollup/plugin-typescript'
import { dts } from 'rollup-plugin-dts'
import filesize from 'rollup-plugin-filesize'
import json from '@rollup/plugin-json'
import terser from '@rollup/plugin-terser'
import { resolveExtensions } from '@xmtp/rollup-plugin-resolve-extensions'

const external = [
  '@noble/secp256k1',
  '@xmtp/proto',
  '@xmtp/user-preferences-bindings-wasm',
  '@xmtp/user-preferences-bindings-wasm/web',
  '@xmtp/user-preferences-bindings-wasm/bundler',
  'async-mutex',
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
  filesize({
    showMinifiedSize: false,
  }),
  json({
    preferConst: true,
  }),
]

export default defineConfig([
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'es',
      sourcemap: true,
    },
    plugins,
    external,
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.cjs',
      format: 'cjs',
      sourcemap: true,
    },
    plugins,
    external,
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es',
    },
    plugins: [dts()],
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/browser/index.js',
      format: 'es',
      sourcemap: true,
    },
    plugins: [
      resolveExtensions({ extensions: ['.browser'] }),
      terser(),
      ...plugins,
    ],
    external,
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/bundler/index.js',
      format: 'es',
      sourcemap: true,
    },
    plugins: [
      resolveExtensions({ extensions: ['.bundler', '.browser'] }),
      terser(),
      ...plugins,
    ],
    external,
  },
])

import { defineConfig } from 'tsup'
import { resolveExtensionsPlugin } from './build/esbuild-plugin-resolve-extensions/index.ts'
import { Plugin } from 'esbuild'

export default defineConfig((options) => {
  const esbuildPlugins: Plugin[] = []

  // replace imports if there's a file with the same name but with a
  // `.bundler` or `.browser` extension
  // i.e. crypto.ts -> crypto.browser.ts
  esbuildPlugins.push(
    resolveExtensionsPlugin({
      extensions: ['.bundler', '.browser'],
    })
  )

  return {
    entry: ['src/index.ts'],
    outDir: 'dist/bundler',
    splitting: false,
    sourcemap: true,
    treeshake: true,
    clean: true,
    bundle: true,
    platform: 'browser',
    minify: true,
    dts: false,
    format: ['esm'],
    esbuildPlugins,
    target: 'esnext',
  }
})

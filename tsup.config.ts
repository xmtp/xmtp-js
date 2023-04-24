import { defineConfig } from 'tsup'
import externalGlobal from 'esbuild-plugin-external-global'
import { Plugin } from 'esbuild'

export default defineConfig((options) => {
  const esbuildPlugins: Plugin[] = []

  // for the browser bundle, replace `crypto` import with an object that
  // returns the browser's built-in crypto library
  if (options.platform === 'browser') {
    esbuildPlugins.push(
      externalGlobal.externalGlobalPlugin({
        crypto: '{ webcrypto: window.crypto }',
      })
    )
  }

  const isBench = options.entry?.[0] === 'bench/index.ts'

  return {
    entry: options.entry ?? ['src/index.ts'],
    outDir:
      options.outDir ?? (options.platform === 'browser' ? 'dist/web' : 'dist'),
    splitting: false,
    sourcemap: !isBench,
    treeshake: true,
    clean: true,
    bundle: true,
    platform: options.platform ?? 'node',
    minify: isBench ? false : options.platform === 'browser',
    dts: isBench ? false : options.platform !== 'browser',
    format:
      options.format ??
      (options.platform === 'browser' ? ['esm'] : ['esm', 'cjs']),
    esbuildPlugins,
  }
})

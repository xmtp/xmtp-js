import { defineConfig } from 'tsup'
import { resolveExtensionsPlugin } from './build/esbuild-plugin-resolve-extensions/index.ts'
import { Plugin } from 'esbuild'

export default defineConfig((options) => {
  const esbuildPlugins: Plugin[] = []

  // for browsers, replace imports if there's a file with the same name
  // but with a `.browser` extension
  // i.e. crypto.ts -> crypto.browser.ts
  if (options.platform === 'browser') {
    esbuildPlugins.push(
      resolveExtensionsPlugin({
        extensions: ['.browser'],
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

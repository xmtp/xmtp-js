import { basename, dirname, extname, format } from 'node:path'
import { existsSync } from 'node:fs'
import { getResolvedPath, loadCompilerOptions } from './utils'
import { Plugin } from 'esbuild'

type ResolveExtensionsPluginOptions = {
  extensions?: string[]
  tsconfigPath?: string
}

export const resolveExtensionsPlugin = (
  options?: ResolveExtensionsPluginOptions
): Plugin => {
  const { tsconfigPath, extensions = [] } = options ?? {}
  const compilerOptions = loadCompilerOptions(tsconfigPath)
  return {
    name: 'resolve-extensions',
    setup({ onResolve }) {
      onResolve({ filter: /.*/ }, async ({ kind, importer, path }) => {
        let result: null | { path: string } = null
        switch (kind) {
          case 'import-statement':
          case 'require-call':
          case 'dynamic-import':
          case 'require-resolve':
            {
              const resolvedPath = getResolvedPath(
                path,
                importer,
                compilerOptions
              )
              if (resolvedPath) {
                const ext = extname(resolvedPath)
                const base = basename(resolvedPath, ext)
                const dir = dirname(resolvedPath)
                // check for extensions
                extensions.some((extension) => {
                  const newPath = format({
                    dir,
                    name: base,
                    ext: `${extension}${ext}`,
                  })
                  const exists = existsSync(newPath)
                  if (exists) {
                    result = { path: newPath }
                    return true
                  }
                  return false
                })
              }
            }
            break
        }
        return result
      })
    },
  }
}

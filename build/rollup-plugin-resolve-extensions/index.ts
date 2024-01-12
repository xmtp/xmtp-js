import { basename, dirname, extname, format } from 'node:path'
import { existsSync } from 'node:fs'
import { Plugin } from 'rollup'
import { getResolvedPath, loadCompilerOptions } from '../utils'

export const resolveExtensions = (
  extensions: string[] = [],
  tsconfigPath?: string
): Plugin => {
  const compilerOptions = loadCompilerOptions(tsconfigPath)
  return {
    name: 'resolve-extensions',
    async resolveId(source, importer, options) {
      if (extensions.length && !options.isEntry && importer) {
        const resolvedPath = getResolvedPath(source, importer, compilerOptions)
        let updatedSource = ''

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
              updatedSource = newPath
              return true
            }
            return false
          })

          return updatedSource || null
        }
      }
      return null
    },
  }
}

import { readFileSync, existsSync } from 'node:fs'
import type { CompilerOptions } from 'typescript'
import ts from 'typescript'
import { findUpSync } from 'find-up'

const { nodeModuleNameResolver, sys } = ts

type TSConfig = {
  compilerOptions?: CompilerOptions
}

const loadJSON = (jsonPath: string) =>
  JSON.parse(readFileSync(jsonPath, 'utf8')) as TSConfig

export const loadCompilerOptions = (tsconfigPath?: string) => {
  let config: TSConfig = {}
  if (!tsconfigPath) {
    const configPath = findUpSync('tsconfig.json')
    if (configPath) {
      config = loadJSON(configPath)
    }
  } else {
    if (existsSync(tsconfigPath)) {
      config = loadJSON(tsconfigPath)
    }
  }
  return config?.compilerOptions ?? {}
}

export const getResolvedPath = (
  path: string,
  importer: string,
  compilerOptions: CompilerOptions
) => {
  const { resolvedModule } = nodeModuleNameResolver(
    path,
    importer,
    compilerOptions,
    sys
  )

  const resolvedFileName = resolvedModule?.resolvedFileName
  if (!resolvedFileName || resolvedFileName.endsWith('.d.ts')) {
    return null
  }

  return sys.resolvePath(resolvedFileName)
}

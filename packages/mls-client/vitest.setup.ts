import { unlink } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { glob } from 'fast-glob'

const __dirname = dirname(fileURLToPath(import.meta.url))
const testPath = join(__dirname, 'test')

export const teardown = async () => {
  const files = await glob('test-*.db3*', { cwd: testPath })
  await Promise.all(files.map((file) => unlink(join(testPath, file))))
}

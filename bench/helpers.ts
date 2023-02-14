import type Benchmark from 'benchmark'
import { suite, save, cycle } from 'benny'
import { Config } from 'benny/lib/internal/common-types'
import { crypto } from '../src/crypto/encryption'
import { PrivateKeyBundleV1 } from '../src/crypto/PrivateKeyBundle'
import { newWallet } from '../test/helpers'

const MAX_RANDOM_BYTES_SIZE = 65536

export const randomBytes = (size: number) => {
  const out = new Uint8Array(size)
  let remaining = size
  while (remaining > 0) {
    const chunkSize =
      remaining < MAX_RANDOM_BYTES_SIZE ? remaining : MAX_RANDOM_BYTES_SIZE
    const chunk = crypto.getRandomValues(new Uint8Array(chunkSize))
    out.set(chunk, size - remaining)
    remaining -= MAX_RANDOM_BYTES_SIZE
  }
  return out
}

export const newPrivateKeyBundle = () =>
  PrivateKeyBundleV1.generate(newWallet())

type BenchGenerator = (
  config: Config
) => Promise<(suiteObj: Benchmark.Suite) => Benchmark.Suite>

// Async test suites should be wrapped in a function so that they can be run one at a time
export const wrapSuite =
  (name: string, ...tests: BenchGenerator[]) =>
  () =>
    suite(
      name,
      ...tests,
      cycle(),
      save({ file: name, folder: 'bench/results', format: 'json' }),
      save({ file: name, folder: 'bench/results', format: 'table.html' }),
      save({ file: name, folder: 'bench/results', format: 'chart.html' })
    )

export const MESSAGE_SIZES = [128, 65536, 524288]

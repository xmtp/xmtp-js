import assert from 'assert'
import { Wallet } from 'ethers'
import { PrivateKey } from '../src'
import { promiseWithTimeout } from '../src/utils'

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

export const assertTimeout = async (
  callback: () => Promise<void>,
  timeoutMs: number
): Promise<void> => {
  let timeout = false
  try {
    await promiseWithTimeout<void>(timeoutMs, callback, 'timeout')
  } catch (err) {
    timeout = err instanceof Error && (err as Error).message === 'timeout'
  }
  assert.ok(timeout)
}

export async function waitFor<T>(
  callback: () => Promise<T>,
  timeoutMs: number,
  delayMs: number
): Promise<T> {
  const started = Date.now()
  try {
    return await callback()
  } catch (err) {
    if (delayMs) {
      await sleep(delayMs)
    }
    const elapsedMs = Date.now() - started
    const remainingTimeoutMs = timeoutMs - elapsedMs
    if (remainingTimeoutMs <= 0) {
      throw new Error('timeout exceeded')
    }
    return await waitFor(callback, remainingTimeoutMs, delayMs)
  }
}

export function newWallet(): Wallet {
  const key = PrivateKey.generate()
  if (!key.secp256k1) {
    throw new Error('invalid key')
  }
  return new Wallet(key.secp256k1.bytes)
}

import { Wallet } from 'ethers'
import { PrivateKey } from '../src'

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

export async function pollFor<T>(
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
    return await pollFor(callback, remainingTimeoutMs, delayMs)
  }
}

export function newWallet(): Wallet {
  const key = PrivateKey.generate()
  if (!key.secp256k1) {
    throw new Error('invalid key')
  }
  return new Wallet(key.secp256k1.bytes)
}

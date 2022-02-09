import { Wallet } from 'ethers'
import { PrivateKey, Message } from '../src'
import Stream from '../src/Stream'
import { promiseWithTimeout } from '../src/utils'

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

export async function dumpStream(
  stream: Stream<Message>,
  timeoutMs = 1000
): Promise<Message[]> {
  const messages: Message[] = []
  try {
    while (true) {
      const result = await promiseWithTimeout(
        timeoutMs,
        () => stream.next(),
        'timeout'
      )
      if (result.done) {
        break
      }
      messages.push(result.value)
    }
  } catch {
  } finally {
    stream.return()
  }
  return messages
}

export function newWallet(): Wallet {
  const key = PrivateKey.generate()
  if (!key.secp256k1) {
    throw new Error('invalid key')
  }
  return new Wallet(key.secp256k1.bytes)
}

import { Wallet } from 'ethers'
import {
  PrivateKey,
  Message,
  ContentCodec,
  ContentTypeId,
  TextCodec,
} from '../src'
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

// A helper to replace a full Client in testing custom content types,
// extracting just the codec registry aspect of the client.
export class CodecRegistry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _codecs: Map<string, ContentCodec<any>>

  constructor() {
    this._codecs = new Map()
    this.registerCodec(new TextCodec())
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerCodec(codec: ContentCodec<any>): void {
    const id = codec.contentType
    const key = `${id.authorityId}/${id.typeId}`
    this._codecs.set(key, codec)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  codecFor(contentType: ContentTypeId): ContentCodec<any> | undefined {
    const key = `${contentType.authorityId}/${contentType.typeId}`
    return this._codecs.get(key)
  }
}

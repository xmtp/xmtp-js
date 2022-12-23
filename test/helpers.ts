import { Wallet } from 'ethers'
import {
  PrivateKey,
  ContentCodec,
  ContentTypeId,
  TextCodec,
  Client,
  ClientOptions,
} from '../src'
import { Signer } from '../src/types/Signer'
import Stream from '../src/Stream'
import { promiseWithTimeout } from '../src/utils'
import assert from 'assert'
import { PublicKeyBundle, SignedPublicKeyBundle } from '../src/crypto'

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

export async function waitForUserContact(
  c1: Client,
  c2: Client
): Promise<PublicKeyBundle | SignedPublicKeyBundle> {
  return pollFor(
    async () => {
      const contact = await c1.getUserContact(c2.address)
      assert.ok(contact)
      return contact
    },
    20000,
    200
  )
}

export async function dumpStream<T>(
  stream: Stream<T>,
  timeoutMs = 1000
): Promise<T[]> {
  const messages: T[] = []
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

export function newCustomWallet(): Signer {
  const ethersWallet = newWallet()
  // Client apps don't have to use ethers, they can implement their
  // own Signer methods. Here we implement a custom Signer that is actually
  // backed by ethers.
  return {
    getAddress(): Promise<string> {
      return ethersWallet.getAddress()
    },
    signMessage(message: ArrayLike<number> | string): Promise<string> {
      return ethersWallet.signMessage(message)
    },
  }
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

// client running against local node running on the host,
// see github.com/xmtp/xmtp-node-go/scripts/xmtp-js.sh
export const newLocalHostClient = (
  opts?: Partial<ClientOptions>
): Promise<Client> =>
  Client.create(newWallet(), {
    env: 'local',
    ...opts,
  })

// client running against local node running on the host,
// with a non-ethers wallet
export const newLocalHostClientWithCustomWallet = (
  opts?: Partial<ClientOptions>
): Promise<Client> =>
  Client.create(newCustomWallet(), {
    env: 'local',
    ...opts,
  })

// client running against the dev cluster in AWS
export const newDevClient = (opts?: Partial<ClientOptions>): Promise<Client> =>
  Client.create(newWallet(), {
    env: 'dev',
    ...opts,
  })

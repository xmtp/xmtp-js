import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ContentTypeId,
  type ContentCodec,
  type EncodedContent,
} from '@xmtp/content-type-primitives'
import { createWalletClient, http, toBytes } from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import { Client, type ClientOptions } from '@/Client'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const createUser = () => {
  const key = generatePrivateKey()
  const account = privateKeyToAccount(key)
  return {
    key,
    account,
    wallet: createWalletClient({
      account,
      chain: sepolia,
      transport: http(),
    }),
  }
}

export type User = ReturnType<typeof createUser>

export const getSignature = async (client: Client, user: User) => {
  const signatureText = await client.signatureText()
  if (signatureText) {
    const signature = await user.wallet.signMessage({
      message: signatureText,
    })
    return toBytes(signature)
  }
  return null
}

export const createClient = async (user: User, options?: ClientOptions) => {
  const opts = {
    ...options,
    env: options?.env ?? 'local',
  }
  return Client.create(user.account.address, {
    ...opts,
    dbPath: join(__dirname, `./test-${user.account.address}.db3`),
  })
}

export const createRegisteredClient = async (
  user: User,
  options?: ClientOptions
) => {
  const client = await createClient(user, options)
  if (!client.isRegistered) {
    const signature = await getSignature(client, user)
    if (signature) {
      client.addSignature(signature)
    }
    await client.registerIdentity()
  }
  return client
}

export const ContentTypeTest = new ContentTypeId({
  authorityId: 'xmtp.org',
  typeId: 'test',
  versionMajor: 1,
  versionMinor: 0,
})

export class TestCodec implements ContentCodec<Record<string, string>> {
  get contentType(): ContentTypeId {
    return ContentTypeTest
  }

  encode(content: Record<string, string>): EncodedContent {
    return {
      type: this.contentType,
      parameters: {},
      content: new TextEncoder().encode(JSON.stringify(content)),
    }
  }

  decode(content: EncodedContent) {
    const decoded = new TextDecoder().decode(content.content)
    return JSON.parse(decoded)
  }

  fallback() {
    return undefined
  }

  shouldPush() {
    return false
  }
}

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createWalletClient, http, toBytes } from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import { Client, type XmtpEnv } from '@/Client'

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
  if (client.signatureText) {
    const signature = await user.wallet.signMessage({
      message: client.signatureText,
    })
    return toBytes(signature)
  }
  return null
}

export const createClient = async (user: User, env?: XmtpEnv) =>
  Client.create(user.account.address, {
    env: env ?? 'local',
    dbPath: join(__dirname, `./test-${user.account.address}.db3`),
  })

export const createRegisteredClient = async (user: User, env?: XmtpEnv) => {
  const client = await createClient(user, env)
  if (!client.isRegistered) {
    const signature = await getSignature(client, user)
    if (signature) {
      client.addEcdsaSignature(signature)
    }
    await client.registerIdentity()
  }
  return client
}

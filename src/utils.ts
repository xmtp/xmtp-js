import { PrivateKeyBundle } from './crypto'
import ContactBundle from './ContactBundle'
import { txClient } from './xmtp'
import { DirectSecp256k1Wallet } from '@cosmjs/proto-signing'

export const buildContentTopic = (name: string): string =>
  `/xmtp/0/${name}/proto`

export const buildDirectMessageTopic = (
  sender: string,
  recipient: string
): string => {
  const members = [sender, recipient]
  members.sort()
  return buildContentTopic(`dm-${members.join('-')}`)
}

export const buildUserContactTopic = (walletAddr: string): string => {
  return buildContentTopic(`contact-${walletAddr}`)
}

export const buildUserIntroTopic = (walletAddr: string): string => {
  return buildContentTopic(`intro-${walletAddr}`)
}

export const buildUserPrivateStoreTopic = (walletAddr: string): string => {
  return buildContentTopic(`privatestore-${walletAddr}`)
}

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

export const promiseWithTimeout = <T>(
  timeoutMs: number,
  promise: () => Promise<T>,
  failureMessage?: string
): Promise<T> => {
  let timeoutHandle: NodeJS.Timeout
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeoutHandle = setTimeout(
      () => reject(new Error(failureMessage)),
      timeoutMs
    )
  })

  return Promise.race([promise(), timeoutPromise]).then((result) => {
    clearTimeout(timeoutHandle)
    return result
  })
}

export async function publishUserContact(
  keys: PrivateKeyBundle,
  address: string
): Promise<void> {
  const contactBundle = new ContactBundle(keys.getPublicKeyBundle())
  if (!keys?.identityKey?.secp256k1?.bytes) {
    return
  }
  const wallet = await DirectSecp256k1Wallet.fromKey(
    keys.identityKey.secp256k1.bytes
  )
  const client = await txClient(wallet, {
    addr: process.env.XMTP_TX_URL || 'http://localhost:26657',
  })
  const accountAddr = (await wallet.getAccounts())[0].address
  console.log(accountAddr)
  console.log('Sending contact', address)
  await client.signAndBroadcast([
    client.msgCreateContact({
      actor: {
        account: accountAddr,
      },
      contact: {
        id: address,
        topic: buildUserContactTopic(address),
        updated_at: 0,
        created_at: 0,
        bundle: contactBundle.toHex(),
      },
    }),
  ])
}

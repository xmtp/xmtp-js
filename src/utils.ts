import { PublicKeyBundle } from './crypto'
import ContactBundle from './ContactBundle'
import { Message as MessageService } from './proto/message.pb'
import { b64Decode, b64Encode } from './proto/fetch.pb'

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
  keys: PublicKeyBundle,
  address: string
): Promise<void> {
  const contactBundle = new ContactBundle(keys)
  const bytes = contactBundle.toBytes()
  try {
    await MessageService.Publish(
      {
        contentTopic: buildUserContactTopic(address),
        message: b64Decode(b64Encode(bytes, 0, bytes.length)),
      },
      {
        pathPrefix: 'https://localhost:5000',
      }
    )
  } catch (err) {
    console.log(err)
  }
}

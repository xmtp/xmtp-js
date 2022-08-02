import { PublicKeyBundle } from './crypto'
import ContactBundle from './ContactBundle'
import { MessageApi, fetcher } from '@xmtp/proto'
const { b64Decode, b64Encode } = fetcher

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

// Implements type safe retries of arbitrary async functions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function retry<T extends (...arg0: any[]) => any>(
  fn: T,
  args: Parameters<T>,
  maxRetries: number,
  sleepTime: number,
  retryCount = 1
): Promise<Awaited<ReturnType<T>>> {
  const currRetry = typeof retryCount === 'number' ? retryCount : 1
  try {
    const result = await fn(...args)
    return result
  } catch (e) {
    console.log(e)
    if (currRetry > maxRetries) {
      throw e
    }
    await sleep(sleepTime)
    return retry(fn, args, maxRetries, sleepTime, currRetry + 1)
  }
}

export async function publishUserContact(
  keys: PublicKeyBundle,
  address: string
): Promise<void> {
  const contactBundle = new ContactBundle(keys)
  const bytes = contactBundle.toBytes()
  try {
    await MessageApi.Publish(
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

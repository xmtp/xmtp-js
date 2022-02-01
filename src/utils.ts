export const buildContentTopic = (name: string): string =>
  `/xmtp/0/${name}/proto`

export const buildDirectMessageTopic = (
  decoderWalletAddr: string,
  encoderWalletAddr: string
): string => buildContentTopic(`dm-${decoderWalletAddr}-${encoderWalletAddr}`)

export const buildUserContactTopic = (walletAddr: string): string => {
  return buildContentTopic(`contact-${walletAddr}`)
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

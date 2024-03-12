import type { messageApi } from '@xmtp/proto'
import type { Flatten } from './typedefs'

export type IsRetryable = (err?: Error) => boolean

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

const defaultIsRetryableFn = (err?: Error) => !!err

// Implements type safe retries of arbitrary async functions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function retry<T extends (...arg0: any[]) => any>(
  fn: T,
  args: Parameters<T>,
  maxRetries: number,
  sleepTime: number,
  isRetryableFn: IsRetryable = defaultIsRetryableFn,
  retryCount = 1
): Promise<Awaited<ReturnType<T>>> {
  const currRetry = typeof retryCount === 'number' ? retryCount : 1
  try {
    const result = await fn(...args)
    return result
  } catch (e) {
    if (!isRetryableFn(e as Error) || currRetry > maxRetries) {
      throw e
    }
    await sleep(sleepTime)
    return retry(fn, args, maxRetries, sleepTime, isRetryableFn, currRetry + 1)
  }
}

export type EnvelopeWithMessage = Flatten<
  messageApi.Envelope & Required<Pick<messageApi.Envelope, 'message'>>
>
export type EnvelopeMapperWithMessage<Out> = (
  env: EnvelopeWithMessage
) => Promise<Out>

export type EnvelopeMapper<Out> = (env: messageApi.Envelope) => Promise<Out>

// Takes an async generator returning pages of envelopes and converts to an async
// generator returning pages of an arbitrary type using a mapper function
export async function* mapPaginatedStream<Out>(
  gen: AsyncGenerator<messageApi.Envelope[]>,
  mapper: EnvelopeMapper<Out>
): AsyncGenerator<Out[]> {
  for await (const page of gen) {
    const results = await Promise.allSettled(page.map(mapper))
    const out: Out[] = []
    for (const result of results) {
      if (result.status === 'fulfilled') {
        out.push(result.value)
      } else {
        console.warn(
          'Failed to process envelope due to reason: ',
          result.reason
        )
      }
    }

    yield out
  }
}

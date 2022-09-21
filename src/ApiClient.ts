import { messageApi } from '@xmtp/proto'
import { NotifyStreamEntityArrival } from '@xmtp/proto/ts/dist/types/fetch.pb'
import { retry, sleep } from './utils'
import Long from 'long'
import AuthCache from './authn/AuthCache'
import { Authenticator } from './authn'
import { version } from '../package.json'
export const { MessageApi, SortDirection } = messageApi

const RETRY_SLEEP_TIME = 100
const ERR_CODE_UNAUTHENTICATED = 16

const clientVersionHeaderKey = 'X-Client-Version'

export type GrpcError = Error & { code?: number }

export type QueryParams = {
  startTime?: Date
  endTime?: Date
  contentTopics: string[]
}

export type QueryAllOptions = {
  direction?: messageApi.SortDirection
  limit?: number
}

export type QueryStreamOptions = Omit<QueryAllOptions, 'limit'> & {
  pageSize?: number
}

export type PublishParams = {
  contentTopic: string
  message: Uint8Array
  timestamp?: Date
}

export type SubscribeParams = {
  contentTopics: string[]
}

export type ApiClientOptions = {
  maxRetries?: number
}

export type SubscribeCallback = NotifyStreamEntityArrival<messageApi.Envelope>

export type UnsubscribeFn = () => Promise<void>

const toNanoString = (d: Date | undefined): undefined | string => {
  return d && Long.fromNumber(d.valueOf()).multiply(1_000_000).toString()
}

const isAbortError = (err?: Error): boolean => {
  if (!err) {
    return false
  }
  if (err.name === 'AbortError' || err.message.includes('aborted')) {
    return true
  }
  return false
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isAuthError = (err?: GrpcError): boolean => {
  if (err && err.code === ERR_CODE_UNAUTHENTICATED) {
    return true
  }
  return false
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isNotAuthError = (err?: GrpcError): boolean => !isAuthError(err)

/**
 * ApiClient provides a wrapper for calling the GRPC Gateway generated code.
 * It adds some helpers for dealing with paginated data and automatically retries idempotent calls
 */
export default class ApiClient {
  pathPrefix: string
  maxRetries: number
  private authCache?: AuthCache
  version: string

  constructor(pathPrefix: string, opts?: ApiClientOptions) {
    this.pathPrefix = pathPrefix
    this.maxRetries = opts?.maxRetries || 5
    this.version = 'xmtp-js/' + version
  }

  // Raw method for querying the API
  private _query(
    req: messageApi.QueryRequest
  ): ReturnType<typeof MessageApi.Query> {
    return retry(
      MessageApi.Query,
      [
        req,
        {
          pathPrefix: this.pathPrefix,
          mode: 'cors',
          headers: new Headers({
            [clientVersionHeaderKey]: this.version,
          }),
        },
      ],
      this.maxRetries,
      RETRY_SLEEP_TIME
    )
  }

  // Raw method for publishing to the API
  private async _publish(
    req: messageApi.PublishRequest,
    attemptNumber = 0
  ): ReturnType<typeof MessageApi.Publish> {
    const authToken = await this.getToken()
    try {
      return await retry(
        MessageApi.Publish,
        [
          req,
          {
            pathPrefix: this.pathPrefix,
            mode: 'cors',
            headers: new Headers({
              Authorization: `Bearer ${authToken}`,
              [clientVersionHeaderKey]: this.version,
            }),
          },
        ],
        this.maxRetries,
        RETRY_SLEEP_TIME,
        // Do not retry UnauthenticatedErrors
        isNotAuthError
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      // Try at most 2X. If refreshing the auth token doesn't work the first time, it won't work the second time
      if (isNotAuthError(e) || attemptNumber >= 1) {
        throw e
      }
      await this.authCache?.refresh()
      return this._publish(req, attemptNumber + 1)
    }
  }

  // Raw method for subscribing
  private _subscribe(
    req: messageApi.SubscribeRequest,
    cb: NotifyStreamEntityArrival<messageApi.Envelope>
  ): UnsubscribeFn {
    let abortController: AbortController

    const doSubscribe = () => {
      abortController = new AbortController()
      const startTime = +new Date()

      MessageApi.Subscribe(req, cb, {
        pathPrefix: this.pathPrefix,
        signal: abortController.signal,
        mode: 'cors',
        headers: new Headers({
          [clientVersionHeaderKey]: this.version,
        }),
      }).catch(async (err: GrpcError) => {
        if (isAbortError(err)) {
          return
        }
        console.warn('Stream connection lost. Resubscribing', err)
        // If connection was initiated less than 1 second ago, sleep for a bit
        // TODO: exponential backoff + eventually giving up
        if (+new Date() - startTime < 1000) {
          await sleep(1000)
        }
        doSubscribe()
      })
    }
    doSubscribe()

    return async () => {
      abortController?.abort()
    }
  }

  // Use the Query API to return the full contents of any specified topics
  async query(
    params: QueryParams,
    {
      direction = SortDirection.SORT_DIRECTION_ASCENDING,
      limit,
    }: QueryAllOptions
  ): Promise<messageApi.Envelope[]> {
    const out: messageApi.Envelope[] = []
    // Use queryIteratePages for better performance. 1/100th the number of Promises to resolve compared to queryStream
    for await (const page of this.queryIteratePages(params, {
      direction,
      // If there is a limit of < 100, use that as the page size. Otherwise use 100 and stop if/when limit reached.
      pageSize: limit && limit < 100 ? limit : 100,
    })) {
      for (const envelope of page) {
        out.push(envelope)
        if (limit && out.length === limit) {
          return out
        }
      }
    }
    return out
  }

  // Will produce an AsyncGenerator of Envelopes
  // Uses queryStreamPages under the hood
  async *queryIterator(
    params: QueryParams,
    options: QueryStreamOptions
  ): AsyncGenerator<messageApi.Envelope> {
    for await (const page of this.queryIteratePages(params, options)) {
      for (const envelope of page) {
        yield envelope
      }
    }
  }

  // Creates an async generator that will paginate through the Query API until it reaches the end
  // Will yield each page of results as needed
  private async *queryIteratePages(
    { contentTopics, startTime, endTime }: QueryParams,
    { direction, pageSize = 10 }: QueryStreamOptions
  ): AsyncGenerator<messageApi.Envelope[]> {
    if (!contentTopics || !contentTopics.length) {
      throw new Error('Must specify content topics')
    }

    const startTimeNs = toNanoString(startTime)
    const endTimeNs = toNanoString(endTime)
    let cursor: messageApi.Cursor | undefined

    while (true) {
      const pagingInfo: messageApi.PagingInfo = {
        limit: pageSize,
        direction,
        cursor,
      }

      const result = await this._query({
        contentTopics,
        startTimeNs,
        endTimeNs,
        pagingInfo,
      })

      if (result.envelopes?.length) {
        yield result.envelopes
      } else {
        return
      }

      if (result.pagingInfo?.cursor) {
        cursor = result.pagingInfo?.cursor
      } else {
        return
      }
    }
  }

  // Publish a message to the network
  // Will convert timestamps to the appropriate format expected by the network
  async publish(
    messages: PublishParams[]
  ): ReturnType<typeof MessageApi.Publish> {
    const toSend: messageApi.Envelope[] = []
    for (const { contentTopic, message, timestamp } of messages) {
      if (!contentTopic.length) {
        throw new Error('Content topic cannot be empty string')
      }

      if (!message.length) {
        throw new Error('0 length messages not allowed')
      }

      const dt = timestamp || new Date()
      toSend.push({
        contentTopic,
        timestampNs: toNanoString(dt),
        message: Uint8Array.from(message),
      })
    }

    return this._publish({ envelopes: toSend })
  }

  // Subscribe to a list of topics.
  // Provided callback function will be called on each new message
  // Returns an unsubscribe function that can be used to end the subscription
  subscribe(
    params: SubscribeParams,
    callback: SubscribeCallback
  ): UnsubscribeFn {
    if (!params.contentTopics.length) {
      throw new Error('Must provide list of contentTopics to subscribe to')
    }

    return this._subscribe(params, callback)
  }

  private getToken(): Promise<string> {
    if (!this.authCache) {
      throw new Error('AuthCache is not set on API Client')
    }
    return this.authCache.getToken()
  }

  setAuthenticator(
    authenticator: Authenticator,
    cacheExpirySeconds?: number
  ): void {
    this.authCache = new AuthCache(authenticator, cacheExpirySeconds)
  }
}

import { messageApi } from '@xmtp/proto'
import { NotifyStreamEntityArrival } from '@xmtp/proto/ts/dist/types/fetch.pb'
import { retry, sleep } from './utils'
import bigInt from 'big-integer'
export const { MessageApi, SortDirection } = messageApi

const RETRY_SLEEP_TIME = 100

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
  return d && bigInt(d.valueOf()).multiply(1_000_000).toString()
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

/**
 * ApiClient provides a wrapper for calling the GRPC Gateway generated code.
 * It adds some helpers for dealing with paginated data and automatically retries idempotent calls
 */
export default class ApiClient {
  pathPrefix: string
  maxRetries: number

  constructor(pathPrefix: string, opts?: ApiClientOptions) {
    this.pathPrefix = pathPrefix
    this.maxRetries = opts?.maxRetries || 5
  }

  // Raw method for querying the API
  private _query(
    req: messageApi.QueryRequest
  ): ReturnType<typeof MessageApi.Query> {
    return retry(
      MessageApi.Query,
      [req, { pathPrefix: this.pathPrefix, mode: 'cors' }],
      this.maxRetries,
      RETRY_SLEEP_TIME
    )
  }

  // Raw method for publishing to the API
  private _publish(
    req: messageApi.PublishRequest
  ): ReturnType<typeof MessageApi.Publish> {
    return retry(
      MessageApi.Publish,
      [req, { pathPrefix: this.pathPrefix, mode: 'cors' }],
      this.maxRetries,
      RETRY_SLEEP_TIME
    )
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
      }).catch(async (err: any) => {
        if (isAbortError(err)) {
          console.log('AbortError detected. Stream ending')
        } else {
          console.log('Error detected. Resubscribing', err)
          // If connection was initiated less than 1 second ago, sleep for a bit
          // TODO: exponential backoff + eventually giving up
          if (+new Date() - startTime < 1000) {
            await sleep(1000)
          }
          doSubscribe()
        }
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
          break
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

    return this._publish({
      envelopes: toSend,
    })
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
}

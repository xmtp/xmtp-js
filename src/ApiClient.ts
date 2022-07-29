import {
  Cursor,
  Envelope,
  MessageApi,
  PagingInfo,
  PublishRequest,
  QueryRequest,
  SortDirection,
  SubscribeRequest,
} from '@xmtp/proto'
import { retry } from './utils'
import { NotifyStreamEntityArrival } from '@xmtp/proto/ts/dist/types/fetch.pb'

const RETRY_SLEEP_TIME = 100

export type QueryParams = {
  startTime?: Date
  endTime?: Date
  contentTopics: string[]
}

export type QueryAllOptions = {
  direction?: SortDirection
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

export type SubscribeCallback = NotifyStreamEntityArrival<Envelope>

const toNanoString = (d: Date | undefined): undefined | string => {
  return d && (d.valueOf() * 1_000_000).toFixed(0)
}

export default class ApiClient {
  pathPrefix: string
  maxRetries: number

  constructor(pathPrefix: string, opts?: ApiClientOptions) {
    this.pathPrefix = pathPrefix
    this.maxRetries = opts?.maxRetries || 5
  }

  // Raw method for querying the API
  private _query(req: QueryRequest): ReturnType<typeof MessageApi.Query> {
    return retry(
      MessageApi.Query,
      [req, { pathPrefix: this.pathPrefix }],
      this.maxRetries,
      RETRY_SLEEP_TIME
    )
  }

  // Raw method for publishing to the API
  private _publish(req: PublishRequest): ReturnType<typeof MessageApi.Publish> {
    return retry(
      MessageApi.Publish,
      [req, { pathPrefix: this.pathPrefix }],
      this.maxRetries,
      RETRY_SLEEP_TIME
    )
  }

  // Raw method for subscribing
  private _subscribe(
    req: SubscribeRequest,
    cb: NotifyStreamEntityArrival<Envelope>
  ): ReturnType<typeof MessageApi.Subscribe> {
    return retry(
      MessageApi.Subscribe,
      [req, cb, { pathPrefix: this.pathPrefix }],
      this.maxRetries,
      RETRY_SLEEP_TIME
    )
  }

  async queryAll(
    params: QueryParams,
    {
      direction = SortDirection.SORT_DIRECTION_ASCENDING,
      limit,
    }: QueryAllOptions
  ): Promise<Envelope[]> {
    const out: Envelope[] = []
    // Use queryStreamPages for better performance. 1/100th the number of Promises to resolve compared to queryStream
    for await (const page of this.queryStreamPages(params, {
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
  async *queryStream(
    params: QueryParams,
    options: QueryStreamOptions
  ): AsyncGenerator<Envelope> {
    for await (const page of this.queryStreamPages(params, options)) {
      for (const envelope of page) {
        yield envelope
      }
    }
  }

  // Creates an async generator that will paginate through the Query API until it reaches the end
  // Will yield each page of results as needed
  private async *queryStreamPages(
    { contentTopics, startTime, endTime }: QueryParams,
    { direction, pageSize = 10 }: QueryStreamOptions
  ): AsyncGenerator<Envelope[]> {
    if (!contentTopics || !contentTopics.length) {
      throw new Error('Must specify content topics')
    }

    const startTimeNs = toNanoString(startTime)
    const endTimeNs = toNanoString(endTime)
    let cursor: Cursor | undefined

    while (true) {
      const pagingInfo: PagingInfo = {
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

  async publish({
    contentTopic,
    timestamp,
    message,
  }: PublishParams): ReturnType<typeof MessageApi.Publish> {
    if (!contentTopic.length) {
      throw new Error('Content topic cannot be empty string')
    }

    if (!message.length) {
      throw new Error('0 length messages not allowed')
    }

    const dt = timestamp || new Date()

    return this._publish({
      contentTopic,
      timestampNs: toNanoString(dt),
      message,
    })
  }

  async subscribe(
    params: SubscribeParams,
    callback: SubscribeCallback
  ): ReturnType<typeof MessageApi.Subscribe> {
    if (!params.contentTopics.length) {
      throw new Error('Must provide list of contentTopics to subscribe to')
    }

    return this._subscribe(params, callback)
  }
}

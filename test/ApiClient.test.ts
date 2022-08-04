import { NotifyStreamEntityArrival } from '@xmtp/proto/ts/dist/types/fetch.pb'
import ApiClient, { PublishParams } from '../src/ApiClient'
import {
  Cursor,
  Envelope,
  MessageApi,
  SortDirection,
  QueryRequest,
  QueryResponse,
  PublishResponse,
  PublishRequest,
  SubscribeRequest,
} from '@xmtp/proto'
import { sleep } from './helpers'

const PATH_PREFIX = 'http://fake:5050'
const CURSOR: Cursor = {
  index: {
    digest: Uint8Array.from([1, 2, 3]),
    senderTimeNs: '3',
  },
}
const CONTENT_TOPIC = 'foo'

const client = new ApiClient(PATH_PREFIX)

describe('Query', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('stops when receiving empty results', async () => {
    const apiMock = createQueryMock([], 1)
    const result = await client.query({ contentTopics: [CONTENT_TOPIC] }, {})
    expect(result).toHaveLength(0)
    expect(apiMock).toHaveBeenCalledTimes(1)
    const expectedReq: QueryRequest = {
      contentTopics: ['foo'],
      pagingInfo: {
        direction: SortDirection.SORT_DIRECTION_ASCENDING,
        limit: 100,
      },
    }
    expect(apiMock).toHaveBeenCalledWith(expectedReq, {
      pathPrefix: PATH_PREFIX,
      mode: 'cors',
    })
  })

  it('stops when receiving some results and a null cursor', async () => {
    const apiMock = createQueryMock([createEnvelope()], 1)
    const result = await client.query({ contentTopics: [CONTENT_TOPIC] }, {})
    expect(result).toHaveLength(1)
    expect(apiMock).toHaveBeenCalledTimes(1)
  })

  it('gets multiple pages of results', async () => {
    const apiMock = createQueryMock([createEnvelope(), createEnvelope()], 2)
    const result = await client.query({ contentTopics: [CONTENT_TOPIC] }, {})
    expect(result).toHaveLength(4)
    expect(apiMock).toHaveBeenCalledTimes(2)
  })

  it('streams a single page of results', async () => {
    const apiMock = createQueryMock([createEnvelope(), createEnvelope()], 1)
    let count = 0
    for await (const _envelope of client.queryIterator(
      { contentTopics: ['foo'] },
      { pageSize: 5 }
    )) {
      count++
    }
    expect(count).toBe(2)
    expect(apiMock).toHaveBeenCalledTimes(1)

    const expectedReq: QueryRequest = {
      contentTopics: ['foo'],
      pagingInfo: {
        limit: 5,
      },
    }
    expect(apiMock).toHaveBeenCalledWith(expectedReq, {
      pathPrefix: PATH_PREFIX,
      mode: 'cors',
    })
  })

  it('streams multiple pages of results', async () => {
    const apiMock = createQueryMock([createEnvelope(), createEnvelope()], 2)
    let count = 0
    for await (const _envelope of client.queryIterator(
      { contentTopics: [CONTENT_TOPIC] },
      { pageSize: 5 }
    )) {
      count++
    }
    expect(count).toBe(4)
    expect(apiMock).toHaveBeenCalledTimes(2)

    const expectedReq: QueryRequest = {
      contentTopics: [CONTENT_TOPIC],
      pagingInfo: {
        limit: 5,
        cursor: CURSOR,
      },
    }
    expect(apiMock).toHaveBeenLastCalledWith(expectedReq, {
      pathPrefix: PATH_PREFIX,
      mode: 'cors',
    })
  })
})

describe('Publish', () => {
  const publishMock = createPublishMock()
  beforeEach(() => {
    publishMock.mockClear()
  })

  it('publishes valid messages', async () => {
    const now = new Date()
    const msg: PublishParams = {
      timestamp: now,
      message: Uint8Array.from([1, 2, 3]),
      contentTopic: CONTENT_TOPIC,
    }

    await client.publish([msg])
    expect(publishMock).toHaveBeenCalledTimes(1)
    const expectedRequest: PublishRequest = {
      envelopes: [
        {
          message: msg.message,
          contentTopic: msg.contentTopic,
          timestampNs: (now.valueOf() * 1_000_000).toFixed(0),
        },
      ],
    }
    expect(publishMock).toHaveBeenCalledWith(expectedRequest, {
      pathPrefix: PATH_PREFIX,
      mode: 'cors',
    })
  })

  it('throws on invalid message', () => {
    const promise = client.publish([
      {
        contentTopic: '',
        message: Uint8Array.from([]),
      },
    ])
    expect(promise).rejects.toBeInstanceOf(Error)
  })
})

describe('Subscribe', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('can subscribe', async () => {
    const subscribeMock = createSubscribeMock(2)
    let numEnvelopes = 0
    const cb = (env: Envelope) => {
      numEnvelopes++
    }
    const req = { contentTopics: [CONTENT_TOPIC] }
    client.subscribe(req, cb)
    await sleep(10)
    expect(numEnvelopes).toBe(2)
    expect(subscribeMock).toBeCalledWith(req, cb, {
      pathPrefix: PATH_PREFIX,
      signal: expect.anything(),
      mode: 'cors',
    })
  })

  it('throws when no content topics returned', async () => {
    const subscribeMock = createSubscribeMock(2)
    let numEnvelopes = 0
    const cb = (env: Envelope) => {
      numEnvelopes++
    }
    const req = { contentTopics: [] }
    const t = () => client.subscribe(req, cb)
    expect(t).toThrow(
      new Error('Must provide list of contentTopics to subscribe to')
    )
  })
})

function createQueryMock(envelopes: Envelope[], numPages = 1) {
  let numCalls = 0
  return jest
    .spyOn(MessageApi, 'Query')
    .mockImplementation(async (): Promise<QueryResponse> => {
      numCalls++
      return {
        envelopes: envelopes,
        pagingInfo: {
          cursor: numCalls >= numPages ? undefined : CURSOR,
        },
      }
    })
}

function createPublishMock() {
  return jest
    .spyOn(MessageApi, 'Publish')
    .mockImplementation(async (): Promise<PublishResponse> => ({}))
}

function createSubscribeMock(numMessages: number) {
  return jest
    .spyOn(MessageApi, 'Subscribe')
    .mockImplementation(
      async (
        req: SubscribeRequest,
        cb: NotifyStreamEntityArrival<Envelope> | undefined
      ): Promise<void> => {
        for (let i = 0; i < numMessages; i++) {
          if (cb) {
            cb(createEnvelope())
          }
        }
      }
    )
}

function createEnvelope(): Envelope {
  return {
    contentTopic: CONTENT_TOPIC,
    timestampNs: '1',
    message: Uint8Array.from([1, 2, 3]),
  }
}

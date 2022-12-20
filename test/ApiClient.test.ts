import { NotifyStreamEntityArrival } from '@xmtp/proto/ts/dist/types/fetch.pb'
import ApiClient, { GrpcStatus, PublishParams } from '../src/ApiClient'
import { messageApi } from '@xmtp/proto'
import { sleep } from './helpers'
import { Authenticator } from '../src/authn'
import { PrivateKey } from '../src'
import { version } from '../package.json'
import { dateToNs } from '../src/utils'
const { MessageApi } = messageApi

const PATH_PREFIX = 'http://fake:5050'
const CURSOR: messageApi.Cursor = {
  index: {
    digest: Uint8Array.from([1, 2, 3]),
    senderTimeNs: '3',
  },
}
const CONTENT_TOPIC = 'foo'
const AUTH_TOKEN = 'foo'

const client = new ApiClient(PATH_PREFIX)

const mockGetToken = jest.fn().mockReturnValue(
  Promise.resolve({
    toBase64: () => AUTH_TOKEN,
    age: 10,
  })
)
jest.mock('../src/authn/Authenticator', () => {
  return jest.fn().mockImplementation(() => {
    return { createToken: mockGetToken }
  })
})

describe('Query', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('stops when receiving empty results', async () => {
    const apiMock = createQueryMock([], 1)
    const result = await client.query({ contentTopics: [CONTENT_TOPIC] }, {})
    expect(result).toHaveLength(0)
    expect(apiMock).toHaveBeenCalledTimes(1)
    const expectedReq: messageApi.QueryRequest = {
      contentTopics: ['foo'],
      pagingInfo: {
        direction: messageApi.SortDirection.SORT_DIRECTION_ASCENDING,
        limit: 100,
      },
    }
    expect(apiMock).toHaveBeenCalledWith(expectedReq, {
      pathPrefix: PATH_PREFIX,
      mode: 'cors',
      headers: new Headers({
        'X-Client-Version': 'xmtp-js/' + version,
      }),
    })
  })

  it('stops when limit is used', async () => {
    const apiMock = createQueryMock([createEnvelope()], 3)
    const result = await client.query(
      { contentTopics: [CONTENT_TOPIC] },
      { limit: 2 }
    )
    expect(result).toHaveLength(2)
    expect(apiMock).toHaveBeenCalledTimes(2)
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

    const expectedReq: messageApi.QueryRequest = {
      contentTopics: ['foo'],
      pagingInfo: {
        limit: 5,
      },
    }
    expect(apiMock).toHaveBeenCalledWith(expectedReq, {
      pathPrefix: PATH_PREFIX,
      mode: 'cors',
      headers: new Headers({
        'X-Client-Version': 'xmtp-js/' + version,
      }),
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

    const expectedReq: messageApi.QueryRequest = {
      contentTopics: [CONTENT_TOPIC],
      pagingInfo: {
        limit: 5,
        cursor: CURSOR,
      },
    }
    expect(apiMock).toHaveBeenLastCalledWith(expectedReq, {
      pathPrefix: PATH_PREFIX,
      mode: 'cors',
      headers: new Headers({
        'X-Client-Version': 'xmtp-js/' + version,
      }),
    })
  })
})

describe('Publish', () => {
  const publishMock = createPublishMock()
  let publishClient: ApiClient

  beforeEach(() => {
    publishMock.mockClear()
    publishClient = new ApiClient(PATH_PREFIX, { appVersion: 'test/0.0.0' })
  })

  it('publishes valid messages', async () => {
    // This Authenticator will not actually be used by the mock
    publishClient.setAuthenticator(new Authenticator(PrivateKey.generate()))

    const now = new Date()
    const msg: PublishParams = {
      timestamp: now,
      message: Uint8Array.from([1, 2, 3]),
      contentTopic: CONTENT_TOPIC,
    }

    await publishClient.publish([msg])
    expect(publishMock).toHaveBeenCalledTimes(1)
    const expectedRequest: messageApi.PublishRequest = {
      envelopes: [
        {
          message: msg.message,
          contentTopic: msg.contentTopic,
          timestampNs: dateToNs(now).toString(),
        },
      ],
    }
    expect(publishMock).toHaveBeenCalledWith(expectedRequest, {
      pathPrefix: PATH_PREFIX,
      mode: 'cors',
      headers: new Headers({
        Authorization: `Bearer ${AUTH_TOKEN}`,
        'X-Client-Version': 'xmtp-js/' + version,
        'X-App-Version': 'test/0.0.0',
      }),
    })
  })

  it('throws on invalid message', () => {
    const promise = client.publish([
      {
        contentTopic: '',
        message: Uint8Array.from([]),
      },
    ])
    expect(promise).rejects.toThrow('Content topic cannot be empty string')
  })
})

describe('Publish authn', () => {
  let publishClient: ApiClient

  beforeEach(() => {
    publishClient = new ApiClient(PATH_PREFIX)
  })

  it('retries on invalid message', async () => {
    const publishMock = createAuthErrorPublishMock(1)
    publishClient.setAuthenticator(new Authenticator(PrivateKey.generate()))

    const now = new Date()
    const msg: PublishParams = {
      timestamp: now,
      message: Uint8Array.from([1, 2, 3]),
      contentTopic: CONTENT_TOPIC,
    }

    await publishClient.publish([msg])
    expect(publishMock).toHaveBeenCalledTimes(2)
  })

  it('gives up after a second auth error', async () => {
    const publishMock = createAuthErrorPublishMock(5)
    publishClient.setAuthenticator(new Authenticator(PrivateKey.generate()))

    const now = new Date()
    const msg: PublishParams = {
      timestamp: now,
      message: Uint8Array.from([1, 2, 3]),
      contentTopic: CONTENT_TOPIC,
    }

    const prom = publishClient.publish([msg])
    expect(prom).rejects.toEqual({ code: GrpcStatus.UNAUTHENTICATED })
    expect(publishMock).toHaveBeenCalledTimes(2)
  })
})

describe('Subscribe', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('can subscribe', async () => {
    const subscribeMock = createSubscribeMock(2)
    let numEnvelopes = 0
    const cb = (env: messageApi.Envelope) => {
      numEnvelopes++
    }
    const req = { contentTopics: [CONTENT_TOPIC] }
    const unsubscribeFn = client.subscribe(req, cb)
    await sleep(10)
    expect(numEnvelopes).toBe(2)
    expect(subscribeMock).toBeCalledWith(req, cb, {
      pathPrefix: PATH_PREFIX,
      signal: expect.anything(),
      mode: 'cors',
      headers: new Headers({
        'X-Client-Version': 'xmtp-js/' + version,
      }),
    })
    await unsubscribeFn()
  })

  it('should resubscribe on error', async () => {
    let called = 0
    const subscribeMock = jest
      .spyOn(MessageApi, 'Subscribe')
      .mockImplementation(
        async (
          req: messageApi.SubscribeRequest,
          cb: NotifyStreamEntityArrival<messageApi.Envelope> | undefined
        ): Promise<void> => {
          called++
          if (called == 1) {
            throw new Error('error')
          }
          for (let i = 0; i < 2; i++) {
            if (cb) {
              cb(createEnvelope())
            }
          }
        }
      )
    let numEnvelopes = 0
    const cb = (env: messageApi.Envelope) => {
      numEnvelopes++
    }
    const req = { contentTopics: [CONTENT_TOPIC] }
    const unsubscribeFn = client.subscribe(req, cb)
    await sleep(1200)
    expect(numEnvelopes).toBe(2)
    expect(subscribeMock).toBeCalledWith(req, cb, {
      pathPrefix: PATH_PREFIX,
      signal: expect.anything(),
      mode: 'cors',
      headers: new Headers({
        'X-Client-Version': 'xmtp-js/' + version,
      }),
    })
    await unsubscribeFn()
  })

  it('should resubscribe on completion', async () => {
    let called = 0
    const subscribeMock = jest
      .spyOn(MessageApi, 'Subscribe')
      .mockImplementation(
        async (
          req: messageApi.SubscribeRequest,
          cb: NotifyStreamEntityArrival<messageApi.Envelope> | undefined
        ): Promise<void> => {
          called++
          if (called == 1) {
            return
          }
          for (let i = 0; i < 2; i++) {
            if (cb) {
              cb(createEnvelope())
            }
          }
        }
      )
    let numEnvelopes = 0
    const cb = (env: messageApi.Envelope) => {
      numEnvelopes++
    }
    const req = { contentTopics: [CONTENT_TOPIC] }
    const unsubscribeFn = client.subscribe(req, cb)
    await sleep(1200)
    expect(numEnvelopes).toBe(2)
    expect(subscribeMock).toBeCalledWith(req, cb, {
      pathPrefix: PATH_PREFIX,
      signal: expect.anything(),
      mode: 'cors',
      headers: new Headers({
        'X-Client-Version': 'xmtp-js/' + version,
      }),
    })
    await unsubscribeFn()
  })

  it('throws when no content topics returned', async () => {
    const subscribeMock = createSubscribeMock(2)
    let numEnvelopes = 0
    const cb = (env: messageApi.Envelope) => {
      numEnvelopes++
    }
    const req = { contentTopics: [] }
    const t = () => client.subscribe(req, cb)
    expect(t).toThrow(
      new Error('Must provide list of contentTopics to subscribe to')
    )
  })
})

function createQueryMock(envelopes: messageApi.Envelope[], numPages = 1) {
  let numCalls = 0
  return jest
    .spyOn(MessageApi, 'Query')
    .mockImplementation(async (): Promise<messageApi.QueryResponse> => {
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
    .mockImplementation(async (): Promise<messageApi.PublishResponse> => ({}))
}

function createAuthErrorPublishMock(rejectTimes = 1) {
  let numRejections = 0
  return jest
    .spyOn(MessageApi, 'Publish')
    .mockImplementation(async (): Promise<messageApi.PublishResponse> => {
      if (numRejections < rejectTimes) {
        numRejections++
        throw {
          code: 16,
        }
      }

      return {}
    })
}

function createSubscribeMock(numMessages: number) {
  return jest
    .spyOn(MessageApi, 'Subscribe')
    .mockImplementation(
      async (
        req: messageApi.SubscribeRequest,
        cb: NotifyStreamEntityArrival<messageApi.Envelope> | undefined
      ): Promise<void> => {
        for (let i = 0; i < numMessages; i++) {
          if (cb) {
            cb(createEnvelope())
          }
        }
      }
    )
}

function createEnvelope(): messageApi.Envelope {
  return {
    contentTopic: CONTENT_TOPIC,
    timestampNs: '1',
    message: Uint8Array.from([1, 2, 3]),
  }
}

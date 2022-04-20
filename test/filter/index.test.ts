import { sleep } from './../../src/utils'
import debug from 'debug'

import { newWallet } from '../helpers'
import { WakuMessage } from 'js-waku'
import { Client } from '../../src'

const log = debug('waku:test')

const TestContentTopic = '/test/1/waku-filter'

const newLocalDockerClient = (): Promise<Client> =>
  Client.create(newWallet(), {
    bootstrapAddrs: [
      '/ip4/127.0.0.1/tcp/9001/ws/p2p/16Uiu2HAmNCxLZCkXNbpVPBpSSnHj9iq4HZQj7fxRzw2kj1kKSHHA',
    ],
  })

describe('Waku Filter', () => {
  let client: Client

  afterEach(async function () {
    !!client &&
      client.close().catch((e) => console.log('Waku failed to stop', e))
  })

  beforeEach(async function () {
    client = await newLocalDockerClient()
  })

  it('creates a subscription', async () => {
    let messageCount = 0
    const messageText = 'Filtering works!'
    const callback = (msg: WakuMessage): void => {
      log('Got a message')
      messageCount++
      expect(msg.contentTopic).toBe(TestContentTopic)
      expect(msg.payloadAsUtf8).toBe(messageText)
    }
    await client.filter.subscribe(
      { contentTopics: [TestContentTopic] },
      callback
    )
    const message = await WakuMessage.fromUtf8String(
      messageText,
      TestContentTopic
    )
    client.waku.relay.send(message)
    while (messageCount === 0) {
      await sleep(250)
    }
    expect(messageCount).toBe(1)
  })

  it('handles multiple messages', async () => {
    let messageCount = 0
    const callback = (msg: WakuMessage): void => {
      messageCount++
      expect(msg.contentTopic).toBe(TestContentTopic)
    }
    await client.filter.subscribe(
      { contentTopics: [TestContentTopic] },
      callback
    )
    client.waku.relay.send(
      await WakuMessage.fromUtf8String('Filtering works!', TestContentTopic)
    )
    client.waku.relay.send(
      await WakuMessage.fromUtf8String(
        'Filtering still works!',
        TestContentTopic
      )
    )
    while (messageCount < 2) {
      await sleep(250)
    }
    expect(messageCount).toBe(2)
  })

  it('unsubscribes', async () => {
    let messageCount = 0
    const callback = (): void => {
      messageCount++
    }
    const unsubscribe = await client.filter.subscribe(
      { contentTopics: [TestContentTopic] },
      callback
    )
    client.waku.relay.send(
      await WakuMessage.fromUtf8String(
        'This should be received',
        TestContentTopic
      )
    )
    await sleep(100)
    await unsubscribe()
    client.waku.relay.send(
      await WakuMessage.fromUtf8String(
        'This should not be received',
        TestContentTopic
      )
    )
    await sleep(100)
    expect(messageCount).toBe(1)
  })
})

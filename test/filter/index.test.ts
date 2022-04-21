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
    const results = await client.filter.subscribe({
      contentTopics: [TestContentTopic],
    })
    const message = await WakuMessage.fromUtf8String(
      messageText,
      TestContentTopic
    )
    await sleep(100)
    client.waku.relay.send(message)
    log('Sent a message to the stream')
    for await (const msg of results) {
      messageCount++
      log('Received one message')
      expect(msg.payloadAsUtf8).toBe(messageText)
      break
    }
    expect(messageCount).toBe(1)
  })

  it('handles multiple messages', async () => {
    const results = await client.filter.subscribe({
      contentTopics: [TestContentTopic],
    })
    // Ensuring that iteration happens before the messages are sent
    ;(async () => {
      await sleep(50)
      await client.waku.relay.send(
        await WakuMessage.fromUtf8String('Filtering works!', TestContentTopic)
      )
      await sleep(50)
      await client.waku.relay.send(
        await WakuMessage.fromUtf8String(
          'Filtering still works!',
          TestContentTopic
        )
      )
      log('Sent two messages')
    })()

    const result1 = await results.next()
    const result2 = await results.next()
    expect(result2.value.payloadAsUtf8).toBe('Filtering still works!')
  })

  it('handles multiple messages successively', async () => {
    const results = await client.filter.subscribe({
      contentTopics: [TestContentTopic],
    })
    await sleep(50)
    const result1Promise = results.next()
    await client.waku.relay.send(
      await WakuMessage.fromUtf8String('Filtering works!', TestContentTopic)
    )
    const result1 = await result1Promise
    await client.waku.relay.send(
      await WakuMessage.fromUtf8String(
        'Filtering still works!',
        TestContentTopic
      )
    )
    const result2 = await results.next()
    expect(result2.value.payloadAsUtf8).toBe('Filtering still works!')
  })
})

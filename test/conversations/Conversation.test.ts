import { Message } from '@components/Messages/Message'
import { buildDirectMessageTopic } from './../../src/utils'
import { MessageV1, MessageV2 } from '../../src/Message'
import { Client } from '../../src'
import { SortDirection } from '../../src/ApiClient'
import { sleep } from '../../src/utils'
import { newLocalHostClient, waitForUserContact } from '../helpers'
import { SignedPublicKeyBundle } from '../../src/crypto'
import { ConversationV2 } from '../../src/conversations/Conversation'

describe('conversation', () => {
  let alice: Client
  let bob: Client

  beforeEach(async () => {
    alice = await newLocalHostClient()
    bob = await newLocalHostClient()
    await waitForUserContact(alice, alice)
    await waitForUserContact(bob, bob)
  })

  afterEach(async () => {
    if (alice) await alice.close()
    if (bob) await bob.close()
  })

  it('lists all messages', async () => {
    const aliceConversation = await alice.conversations.newConversation(
      bob.address
    )
    const bobConversation = await bob.conversations.newConversation(
      alice.address
    )

    const startingMessages = await aliceConversation.messages()
    expect(startingMessages).toHaveLength(0)
    await sleep(100)

    await bobConversation.send('Hi Alice')
    await aliceConversation.send('Hi Bob')
    await sleep(100)

    expect(await aliceConversation.messages()).toHaveLength(2)
    expect(await bobConversation.messages()).toHaveLength(2)
  })

  it('lists paginated messages', async () => {
    const aliceConversation = await alice.conversations.newConversation(
      bob.address
    )

    for (let i = 0; i < 10; i++) {
      await aliceConversation.send('gm')
    }
    await sleep(100)

    let numPages = 0
    const messageIds = new Set<string>()
    for await (const page of aliceConversation.messagesPaginated({
      pageSize: 5,
    })) {
      numPages++
      expect(page).toHaveLength(5)
      for (const msg of page) {
        expect(msg.content).toBe('gm')
        messageIds.add(msg.id)
      }
    }
    expect(numPages).toBe(2)
    expect(messageIds.size).toBe(10)

    // Test sorting
    let lastMessage: MessageV1 | MessageV2 | undefined = undefined
    for await (const page of aliceConversation.messagesPaginated({
      direction: SortDirection.SORT_DIRECTION_DESCENDING,
    })) {
      for (const msg of page) {
        if (lastMessage && lastMessage.sent) {
          expect(msg.sent?.valueOf()).toBeLessThanOrEqual(
            lastMessage.sent?.valueOf()
          )
        }
        expect(msg).toBeInstanceOf(MessageV1)
        lastMessage = msg
      }
    }
  })

  it('ignores failed decoding of messages', async () => {
    const aliceConversation = await alice.conversations.newConversation(
      bob.address
    )

    // This should be readable
    await aliceConversation.send('gm')
    // This should not be readable
    await alice.publishEnvelopes([
      {
        message: Uint8Array.from([1, 2, 3]),
        contentTopic: buildDirectMessageTopic(alice.address, bob.address),
      },
    ])
    await sleep(100)

    let numMessages = 0
    for await (const page of aliceConversation.messagesPaginated()) {
      numMessages += page.length
    }
    expect(numMessages).toBe(1)
  })

  it('allows for sorted listing', async () => {
    const aliceConversation = await alice.conversations.newConversation(
      bob.address
    )
    await aliceConversation.send('1')
    await aliceConversation.send('2')
    await sleep(100)

    const sortedAscending = await aliceConversation.messages()
    expect(sortedAscending.length).toBe(2)
    expect(sortedAscending[0].content).toBe('1')

    const sortedDescending = await aliceConversation.messages({
      direction: SortDirection.SORT_DIRECTION_DESCENDING,
    })
    expect(sortedDescending[0].content).toBe('2')
  })

  it('streams messages', async () => {
    const aliceConversation = await alice.conversations.newConversation(
      bob.address
    )
    const bobConversation = await bob.conversations.newConversation(
      alice.address
    )

    // Start the stream before sending the message to ensure delivery
    const stream = await aliceConversation.streamMessages()
    await sleep(100)
    await bobConversation.send('gm')

    let numMessages = 0
    for await (const message of stream) {
      numMessages++
      if (numMessages == 2) {
        break
      }
      await aliceConversation.send('gm to you too')
    }
    await sleep(1000)
    expect(numMessages).toBe(2)
    expect(await aliceConversation.messages()).toHaveLength(2)
  })

  it('v2 conversation', async () => {
    // publish new contact bundles
    alice.publishUserContact(false)
    await sleep(100)
    bob.forgetContact(alice.address)
    waitForUserContact(bob, alice)
    expect(await bob.getUserContact(alice.address)).toBeInstanceOf(
      SignedPublicKeyBundle
    )

    bob.publishUserContact(false)
    await sleep(100)
    alice.forgetContact(bob.address)
    waitForUserContact(alice, bob)
    expect(await alice.getUserContact(bob.address)).toBeInstanceOf(
      SignedPublicKeyBundle
    )

    const ac = await alice.conversations.newConversation(bob.address)
    if (!(ac instanceof ConversationV2)) {
      fail()
    }
    const as = await ac.streamMessages()
    await sleep(100)

    const bcs = await bob.conversations.list()
    expect(bcs).toHaveLength(1)
    const bc = bcs[0]
    if (!(bc instanceof ConversationV2)) {
      fail()
    }
    expect(bc.topic).toBe(ac.topic)
    expect(bc.keyMaterial).toEqual(ac.keyMaterial)
    const bs = await bc.streamMessages()
    await sleep(100)

    await ac.send('gm')
    expect((await bs.next()).value.content).toBe('gm')
    expect((await as.next()).value.content).toBe('gm')
    await bc.send('gm to you too')
    expect((await bs.next()).value.content).toBe('gm to you too')
    expect((await as.next()).value.content).toBe('gm to you too')
  })

  it('conversation filtering', async () => {
    const conversationId = 'xmtp.org/foo'
    const title = 'foo'
    const convo = await alice.conversations.newConversation(bob.address, {
      conversationId,
      metadata: {
        title,
      },
    })

    const stream = await convo.streamMessages()
    await sleep(100)
    const sentMessage = await convo.send('foo')
    if (!(sentMessage instanceof MessageV2)) {
      throw new Error('Not a V2 message')
    }
    expect(sentMessage.conversation.context?.conversationId).toBe(
      conversationId
    )

    const firstMessageFromStream: Message = (await stream.next()).value
    expect(firstMessageFromStream instanceof MessageV2).toBeTruthy()
    expect(firstMessageFromStream.content).toBe('foo')
    expect(firstMessageFromStream.conversation.context.id).toBe(conversationId)

    const messages = await convo.messages()
    expect(messages).toHaveLength(1)
    expect(messages[0].content).toBe('foo')
    expect(messages[0].conversation).toBe(convo)
  })
})

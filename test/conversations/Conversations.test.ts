import { newLocalHostClient } from './../helpers'
import { Client } from '../../src'
import {
  buildDirectMessageTopic,
  buildUserIntroTopic,
  sleep,
} from '../../src/utils'

describe('conversations', () => {
  let alice: Client
  let bob: Client
  let charlie: Client

  beforeEach(async () => {
    alice = await newLocalHostClient()
    bob = await newLocalHostClient()
    charlie = await newLocalHostClient()
  })

  afterEach(async () => {
    await alice.close()
    await bob.close()
    await charlie.close()
  })

  it('lists all conversations', async () => {
    const aliceConversations = await alice.conversations.list()
    expect(aliceConversations).toHaveLength(0)

    const aliceToBob = await alice.conversations.newConversation(bob.address)
    await aliceToBob.send('gm')
    await sleep(50)

    const aliceConversationsAfterMessage = await alice.conversations.list()
    expect(aliceConversationsAfterMessage).toHaveLength(1)
    expect(aliceConversationsAfterMessage[0].peerAddress).toBe(bob.address)

    const bobConversations = await bob.conversations.list()
    expect(bobConversations).toHaveLength(1)
    expect(bobConversations[0].peerAddress).toBe(alice.address)
  })

  it('streams conversations', async () => {
    const stream = await alice.conversations.stream()
    const conversation = await alice.conversations.newConversation(bob.address)
    await conversation.send('hi bob')

    let numConversations = 0
    for await (const conversation of stream) {
      numConversations++
      expect(conversation.peerAddress).toBe(bob.address)
      break
    }
    expect(numConversations).toBe(1)
  })

  it('streams all conversation messages from empty state', async () => {
    const aliceCharlie = await alice.conversations.newConversation(
      charlie.address
    )
    const bobAlice = await bob.conversations.newConversation(alice.address)
    const charlieAlice = await charlie.conversations.newConversation(
      alice.address
    )

    const stream = await alice.conversations.streamAllMessages()
    await charlieAlice.send('gm alice -charlie')

    let numMessages = 0
    for await (const message of stream) {
      numMessages++
      if (numMessages == 1) {
        expect(message.contentTopic).toBe(buildUserIntroTopic(alice.address))
        expect(message.content).toBe('gm alice -charlie')
        await bobAlice.send('gm alice -bob')
      }
      if (numMessages == 2) {
        expect(message.contentTopic).toBe(buildUserIntroTopic(alice.address))
        expect(message.content).toBe('gm alice -bob')
        await aliceCharlie.send('gm charlie -alice')
      }
      if (numMessages == 3) {
        expect(message.contentTopic).toBe(
          buildDirectMessageTopic(alice.address, charlie.address)
        )
        expect(message.content).toBe('gm charlie -alice')
        break
      }
    }
    expect(numMessages).toBe(3)
  })

  it('streams all conversation messages with existing conversations', async () => {
    const aliceBob = await alice.conversations.newConversation(bob.address)
    const bobAlice = await bob.conversations.newConversation(alice.address)

    await aliceBob.send('gm alice -bob')
    await sleep(50)
    const existingConversations = await alice.conversations.list()
    expect(existingConversations).toHaveLength(1)

    const stream = await alice.conversations.streamAllMessages()
    await bobAlice.send('gm bob -alice')

    let numMessages = 0
    for await (const message of stream) {
      numMessages++
      if (numMessages == 1) {
        expect(message.contentTopic).toBe(
          buildDirectMessageTopic(alice.address, bob.address)
        )
        expect(message.content).toBe('gm bob -alice')
      }
      if (numMessages == 2) {
        expect(message.contentTopic).toBe(
          buildDirectMessageTopic(alice.address, bob.address)
        )
        expect(message.content).toBe('gm. hope you have a good day')
        break
      }
      await aliceBob.send('gm. hope you have a good day')
    }
    expect(numMessages).toBe(2)
  })

  it('dedupes conversations when multiple messages are in the introduction topic', async () => {
    const aliceConversation = await alice.conversations.newConversation(
      bob.address
    )
    const bobConversation = await bob.conversations.newConversation(
      alice.address
    )
    await Promise.all([
      aliceConversation.send('gm'),
      bobConversation.send('gm'),
    ])
    await sleep(50)

    const [aliceConversationsList, bobConversationList] = await Promise.all([
      alice.conversations.list(),
      bob.conversations.list(),
    ])
    expect(aliceConversationsList).toHaveLength(1)
    expect(bobConversationList).toHaveLength(1)
  })
})

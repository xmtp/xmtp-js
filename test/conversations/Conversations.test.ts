import { newLocalDockerClient } from './../helpers'
import { Client } from '../../src'
import { sleep } from '../../src/utils'

describe('conversations', () => {
  let alice: Client
  let bob: Client
  let charlie: Client

  beforeEach(async () => {
    alice = await newLocalDockerClient()
    bob = await newLocalDockerClient()
    charlie = await newLocalDockerClient()
    await sleep(100)
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
    await sleep(1000)

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

  it('streams all conversation messages', async () => {
    const stream = await alice.conversations.streamAllMessages()
    const conversation1 = await alice.conversations.newConversation(bob.address)
    const conversation2 = await alice.conversations.newConversation(
      charlie.address
    )
    await conversation1.send('hi bob - alice')
    await conversation2.send('hi bob - charlie')
    await conversation1.send('hi bob again - alice')

    let numMessages = 0
    for await (const message of stream) {
      numMessages++
      expect(message.recipientAddress).toBe(bob.address)
      break
    }
    expect(numMessages).toBe(3)
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
    await sleep(1000)

    const [aliceConversationsList, bobConversationList] = await Promise.all([
      alice.conversations.list(),
      bob.conversations.list(),
    ])
    expect(aliceConversationsList).toHaveLength(1)
    expect(bobConversationList).toHaveLength(1)
  })
})

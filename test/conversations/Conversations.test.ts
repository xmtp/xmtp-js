import { newLocalHostClient } from './../helpers'
import { Client } from '../../src'
import { sleep } from '../../src/utils'

describe('conversations', () => {
  let alice: Client
  let bob: Client

  beforeEach(async () => {
    alice = await newLocalHostClient()
    bob = await newLocalHostClient()
    await sleep(100)
  })

  afterEach(async () => {
    await alice.close()
    await bob.close()
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

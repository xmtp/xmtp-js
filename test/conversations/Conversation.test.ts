import { buildDirectMessageTopic } from './../../src/utils'
import { Client, Message } from '../../src'
import { SortDirection } from '../../src/ApiClient'
import { sleep } from '../../src/utils'
import { newLocalHostClient, waitForUserContact } from '../helpers'

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
    await sleep(50)

    await bobConversation.send('Hi Alice')
    await aliceConversation.send('Hi Bob')
    await sleep(1000)

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
    let lastMessage: Message | undefined = undefined
    for await (const page of aliceConversation.messagesPaginated({
      direction: SortDirection.SORT_DIRECTION_DESCENDING,
    })) {
      for (const msg of page) {
        if (lastMessage && lastMessage.sent) {
          expect(msg.sent?.valueOf()).toBeLessThanOrEqual(
            lastMessage.sent?.valueOf()
          )
        }
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
    await alice.publishEnvelope({
      message: Uint8Array.from([1, 2, 3]),
      contentTopic: buildDirectMessageTopic(alice.address, bob.address),
    })

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
    await sleep(1)
    await aliceConversation.send('2')

    const sortedAscending = await aliceConversation.messages()
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
})

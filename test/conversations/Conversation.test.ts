import { Client } from '../../src'
import { sleep } from '../../src/utils'
import { newLocalDockerClient } from '../helpers'

describe('conversations', () => {
  let alice: Client
  let bob: Client

  beforeEach(async () => {
    alice = await newLocalDockerClient()
    bob = await newLocalDockerClient()
  })

  afterEach(async () => {
    await alice.close()
    await bob.close()
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

  it('streams messages', async () => {
    const aliceConversation = await alice.conversations.newConversation(
      bob.address
    )
    const bobConversation = await bob.conversations.newConversation(
      alice.address
    )

    // Start the stream before sending the message to ensure delivery
    const stream = await aliceConversation.streamMessages()
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

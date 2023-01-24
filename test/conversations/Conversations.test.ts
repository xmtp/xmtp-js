import {
  ConversationV1,
  ConversationV2,
} from './../../src/conversations/Conversation'
import { ConversationCache } from '../../src/conversations/Conversations'
import { newLocalHostClient, waitForUserContact } from './../helpers'
import { Client } from '../../src'
import {
  buildDirectMessageTopic,
  buildUserIntroTopic,
  sleep,
} from '../../src/utils'
import { Wallet } from 'ethers'

describe('conversations', () => {
  let alice: Client
  let bob: Client
  let charlie: Client

  beforeEach(async () => {
    alice = await newLocalHostClient({ publishLegacyContact: true })
    bob = await newLocalHostClient({ publishLegacyContact: true })
    charlie = await newLocalHostClient({ publishLegacyContact: true })
    await waitForUserContact(alice, alice)
    await waitForUserContact(bob, bob)
    await waitForUserContact(charlie, charlie)
  })

  afterEach(async () => {
    if (alice) await alice.close()
    if (bob) await bob.close()
    if (charlie) await charlie.close()
  })

  describe('listConversations', () => {
    it('lists all conversations', async () => {
      const aliceConversations = await alice.conversations.list()
      expect(aliceConversations).toHaveLength(0)

      const aliceToBob = await alice.conversations.newConversation(bob.address)
      await aliceToBob.send('gm')
      await sleep(100)

      const aliceConversationsAfterMessage = await alice.conversations.list()
      expect(aliceConversationsAfterMessage).toHaveLength(1)
      expect(aliceConversationsAfterMessage[0].peerAddress).toBe(bob.address)

      const bobConversations = await bob.conversations.list()
      expect(bobConversations).toHaveLength(1)
      expect(bobConversations[0].peerAddress).toBe(alice.address)
    })

    it('resumes list with cache after new conversation is created', async () => {
      const aliceConversations1 = await alice.conversations.list()
      expect(aliceConversations1).toHaveLength(0)

      await alice.conversations.newConversation(bob.address, {
        conversationId: 'foo',
        metadata: {},
      })
      await sleep(100)
      const aliceConversations2 = await alice.conversations.list()
      expect(aliceConversations2).toHaveLength(1)

      await alice.conversations.newConversation(bob.address, {
        conversationId: 'bar',
        metadata: {},
      })
      await sleep(100)
      const aliceConversations3 = await alice.conversations.list()
      expect(aliceConversations3).toHaveLength(2)
    })

    it('caches results and updates the latestSeen date', async () => {
      const cache = new ConversationCache()
      const convoDate = new Date()
      const firstConvo = new ConversationV1(alice, bob.address, convoDate)

      const results = await cache.load(async () => {
        return [firstConvo]
      })
      expect(results[0]).toBe(firstConvo)

      // Should dedupe repeated result
      const results2 = await cache.load(async ({ latestSeen }) => {
        expect(latestSeen).toBe(convoDate)
        return [firstConvo]
      })

      expect(results2).toHaveLength(1)
    })

    it('bubbles up errors in loader', async () => {
      const cache = new ConversationCache()
      await expect(
        cache.load(async () => {
          throw new Error('test')
        })
      ).rejects.toThrow('test')
    })

    it('waits for one request to finish before the second one starts', async () => {
      const cache = new ConversationCache()
      const convoDate = new Date()
      const firstConvo = new ConversationV1(alice, bob.address, convoDate)
      const promise1 = cache.load(async ({ latestSeen }) => {
        expect(latestSeen).toBeUndefined()
        return [firstConvo]
      })

      const promise2 = cache.load(async ({ latestSeen }) => {
        expect(latestSeen).toBe(convoDate)
        return []
      })

      const [result1, result2] = await Promise.all([promise1, promise2])
      expect(result1).toHaveLength(1)
      expect(result2).toHaveLength(1)
    })
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
    await stream.return()
  })

  it('streams all conversation messages from empty state', async () => {
    const aliceCharlie = await alice.conversations.newConversation(
      charlie.address
    )
    const bobAlice = await bob.conversations.newConversation(alice.address)

    const stream = await alice.conversations.streamAllMessages()
    await aliceCharlie.send('gm alice -charlie')

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
    await stream.return(undefined)
  })

  it('streams all conversation messages with a mix of v1 and v2 conversations', async () => {
    const aliceBobV1 = await alice.conversations.newConversation(bob.address)
    const aliceBobV2 = await alice.conversations.newConversation(bob.address, {
      conversationId: 'xmtp.org/foo',
      metadata: {},
    })
    await sleep(100)

    const stream = await alice.conversations.streamAllMessages()
    await sleep(100)

    await aliceBobV1.send('V1')
    const message1 = await stream.next()
    expect(message1.value.content).toBe('V1')
    expect(message1.value.contentTopic).toBe(buildUserIntroTopic(alice.address))

    await aliceBobV2.send('V2')
    const message2 = await stream.next()
    expect(message2.value.content).toBe('V2')
    expect(message2.value.contentTopic).toBe(aliceBobV2.topic)

    await aliceBobV1.send('Second message in V1 channel')
    const message3 = await stream.next()
    expect(message3.value.content).toBe('Second message in V1 channel')
    expect(message3.value.contentTopic).toBe(
      buildDirectMessageTopic(alice.address, bob.address)
    )

    const aliceBobV2Bar = await alice.conversations.newConversation(
      bob.address,
      {
        conversationId: 'xmtp.org/bar',
        metadata: {},
      }
    )
    await aliceBobV2Bar.send('bar')
    const message4 = await stream.next()
    expect(message4.value.content).toBe('bar')
    await stream.return(undefined)
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
    await sleep(100)

    const [aliceConversationsList, bobConversationList] = await Promise.all([
      alice.conversations.list(),
      bob.conversations.list(),
    ])
    expect(aliceConversationsList).toHaveLength(1)
    expect(bobConversationList).toHaveLength(1)
  })

  describe('newConversation', () => {
    it('uses an existing v1 conversation when one exists', async () => {
      const aliceConvo = await alice.conversations.newConversation(bob.address)
      expect(aliceConvo instanceof ConversationV1).toBeTruthy()
      await aliceConvo.send('gm')
      const bobConvo = await bob.conversations.newConversation(alice.address)
      expect(bobConvo instanceof ConversationV1).toBeTruthy()
    })

    it('continues to use v1 conversation even after upgrading bundle', async () => {
      const aliceConvo = await alice.conversations.newConversation(bob.address)
      await aliceConvo.send('gm')
      expect(aliceConvo instanceof ConversationV1).toBeTruthy()
      await bob.publishUserContact(false)
      alice.forgetContact(bob.address)
      await sleep(100)

      const aliceConvo2 = await alice.conversations.newConversation(bob.address)
      expect(aliceConvo2 instanceof ConversationV1).toBeTruthy()
      await aliceConvo2.send('hi')

      await sleep(100)
      const bobConvo = await bob.conversations.newConversation(alice.address)
      expect(bobConvo instanceof ConversationV1).toBeTruthy()
      const messages = await bobConvo.messages()
      expect(messages.length).toBe(2)
      expect(messages[0].content).toBe('gm')
      expect(messages[1].content).toBe('hi')
    })

    it('creates a new V2 conversation when no existing convo and V2 bundle', async () => {
      await bob.publishUserContact(false)
      alice.forgetContact(bob.address)
      await sleep(100)

      const aliceConvo = await alice.conversations.newConversation(bob.address)
      expect(aliceConvo instanceof ConversationV2).toBeTruthy()
    })

    it('creates a v2 conversation when conversation ID is present', async () => {
      const conversationId = 'xmtp.org/foo'
      const aliceConvo = await alice.conversations.newConversation(
        bob.address,
        { conversationId, metadata: { foo: 'bar' } }
      )
      await sleep(100)

      expect(aliceConvo instanceof ConversationV2).toBeTruthy()
      expect(aliceConvo.context?.conversationId).toBe(conversationId)
      expect(aliceConvo.context?.metadata.foo).toBe('bar')

      // Ensure alice received an invite
      const aliceInvites = await alice.listInvitations()
      expect(aliceInvites).toHaveLength(1)
      expect(
        aliceInvites[0].v1.header.sender.equals(alice.keys.getPublicKeyBundle())
      ).toBeTruthy()
      expect(
        aliceInvites[0].v1.header.recipient.equals(
          bob.keys.getPublicKeyBundle()
        )
      ).toBeTruthy()

      // Ensure bob received an invite
      const bobInvites = await bob.listInvitations()
      expect(bobInvites).toHaveLength(1)
      const invite = await bobInvites[0].v1.getInvitation(bob.keys)
      expect(invite.context?.conversationId).toBe(conversationId)
    })

    it('re-uses same invite when multiple conversations started with the same ID', async () => {
      const conversationId = 'xmtp.org/foo'
      const aliceConvo1 = await alice.conversations.newConversation(
        bob.address,
        { conversationId, metadata: {} }
      )
      await sleep(100)

      const aliceConvo2 = await alice.conversations.newConversation(
        bob.address,
        { conversationId, metadata: {} }
      )

      if (
        aliceConvo1 instanceof ConversationV2 &&
        aliceConvo2 instanceof ConversationV2
      ) {
        expect(aliceConvo2.topic).toBe(aliceConvo1.topic)
      } else {
        throw new Error('Not a v2 conversation')
      }

      const aliceInvites = await alice.listInvitations()
      expect(aliceInvites).toHaveLength(1)
      const invite = await aliceInvites[0].v1.getInvitation(alice.keys)
      expect(invite.topic).toBe(aliceConvo1.topic)
    })

    it('sends multiple invites when different IDs are used', async () => {
      const conversationId1 = 'xmtp.org/foo'
      const conversationId2 = 'xmtp.org/bar'
      const aliceConvo1 = await alice.conversations.newConversation(
        bob.address,
        { conversationId: conversationId1, metadata: {} }
      )
      await sleep(100)

      const aliceConvo2 = await alice.conversations.newConversation(
        bob.address,
        { conversationId: conversationId2, metadata: {} }
      )
      await sleep(100)

      if (
        !(aliceConvo1 instanceof ConversationV2) ||
        !(aliceConvo2 instanceof ConversationV2)
      ) {
        throw new Error('Not a V2 conversation')
      }

      expect(aliceConvo1.topic === aliceConvo2.topic).toBeFalsy()
      const aliceInvites = await alice.listInvitations()
      expect(aliceInvites).toHaveLength(2)

      const bobInvites = await bob.listInvitations()
      expect(bobInvites).toHaveLength(2)
    })

    it('handles races', async () => {
      const ctx = {
        conversationId: 'xmtp.org/foo',
        metadata: {},
      }
      // Create three conversations in parallel
      await Promise.all([
        alice.conversations.newConversation(bob.address, ctx),
        alice.conversations.newConversation(bob.address, ctx),
        alice.conversations.newConversation(bob.address, ctx),
      ])
      await sleep(50)

      const invites = await alice.listInvitations()
      expect(invites).toHaveLength(1)
    })
  })

  describe('export', () => {
    it('exports something JSON serializable', async () => {
      await Promise.all([
        alice.conversations
          .newConversation(bob.address)
          .then((convo) => convo.send('hello')),
        alice.conversations.newConversation(bob.address, {
          conversationId: 'xmtp.org/foo',
          metadata: {},
        }),
      ])
      await sleep(50)

      const exported = await alice.conversations.export()
      expect(exported).toHaveLength(2)

      const roundTripped = JSON.parse(JSON.stringify(exported))
      expect(roundTripped).toHaveLength(2)
      expect(roundTripped[0].createdAt).toEqual(exported[0].createdAt)
    })

    it('imports from export', async () => {
      const wallet = Wallet.createRandom()
      const clientA = await Client.create(wallet, { env: 'local' })
      await Promise.all([
        clientA.conversations
          .newConversation(bob.address)
          .then((convo) => convo.send('hello')),
        clientA.conversations.newConversation(bob.address, {
          conversationId: 'xmtp.org/foo',
          metadata: {},
        }),
      ])
      await sleep(50)

      const exported = await clientA.conversations.export()
      expect(exported).toHaveLength(2)

      const clientB = await Client.create(wallet, { env: 'local' })
      const failed = await clientB.conversations.import(exported)
      expect(failed).toBe(0)
    })
  })
})

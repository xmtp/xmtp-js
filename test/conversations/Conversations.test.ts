import {
  ConversationV1,
  ConversationV2,
} from './../../src/conversations/Conversation'
import { newLocalHostClient, waitForUserContact } from './../helpers'
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
    await waitForUserContact(alice, alice)
    await waitForUserContact(bob, bob)
    await waitForUserContact(charlie, charlie)
  })

  afterEach(async () => {
    if (alice) await alice.close()
    if (bob) await bob.close()
    if (charlie) await charlie.close()
  })

  it('lists all conversations', async () => {
    const aliceConversations = await alice.conversations.list()
    expect(aliceConversations).toHaveLength(0)

    const aliceToBob = await alice.conversations.newConversation(bob.address)
    await aliceToBob.send('gm')
    await sleep(100)

    const aliceConversationsAfterMessage = await alice.conversations.list()
    expect(aliceConversationsAfterMessage).toHaveLength(1)
    expect(await aliceConversationsAfterMessage[0].peerAddress).toBe(
      bob.address
    )

    const bobConversations = await bob.conversations.list()
    expect(bobConversations).toHaveLength(1)
    expect(await bobConversations[0].peerAddress).toBe(alice.address)
  })

  it('streams conversations', async () => {
    const stream = await alice.conversations.stream()
    const conversation = await alice.conversations.newConversation(bob.address)
    await conversation.send('hi bob')

    let numConversations = 0
    for await (const conversation of stream) {
      numConversations++
      expect(await conversation.peerAddress).toBe(bob.address)
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
    await sleep(100)
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
  })
})

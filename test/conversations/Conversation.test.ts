import { ConversationV1 } from './../../src/conversations/Conversation'
import { DecodedMessage } from './../../src/Message'
import { buildDirectMessageTopic } from './../../src/utils'
import {
  Client,
  Compression,
  ContentTypeFallback,
  ContentTypeId,
  ContentTypeText,
} from '../../src'
import { SortDirection } from '../../src/ApiClient'
import { sleep } from '../../src/utils'
import { newLocalHostClient, newWallet, waitForUserContact } from '../helpers'
import {
  PrivateKey,
  PrivateKeyBundleV1,
  SignedPublicKeyBundle,
} from '../../src/crypto'
import { ConversationV2 } from '../../src/conversations/Conversation'
import { ContentTypeTestKey, TestKeyCodec } from '../ContentTypeTestKey'

describe('conversation', () => {
  let alice: Client
  let bob: Client

  describe('v1', () => {
    beforeEach(async () => {
      alice = await newLocalHostClient({ publishLegacyContact: true })
      bob = await newLocalHostClient({ publishLegacyContact: true })
      await waitForUserContact(alice, alice)
      await waitForUserContact(bob, bob)
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

      const [aliceMessages, bobMessages] = await Promise.all([
        aliceConversation.messages(),
        bobConversation.messages(),
      ])

      expect(aliceMessages).toHaveLength(2)
      expect(aliceMessages[0].messageVersion).toBe('v1')
      expect(aliceMessages[0].error).toBeUndefined()
      expect(aliceMessages[0].senderAddress).toBe(bob.address)
      expect(aliceMessages[0].conversation.topic).toBe(aliceConversation.topic)

      expect(bobMessages).toHaveLength(2)
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
      let lastMessage: DecodedMessage | undefined = undefined
      for await (const page of aliceConversation.messagesPaginated({
        direction: SortDirection.SORT_DIRECTION_DESCENDING,
      })) {
        for (const msg of page) {
          if (lastMessage && lastMessage.sent) {
            expect(msg.sent?.valueOf()).toBeLessThanOrEqual(
              lastMessage.sent?.valueOf()
            )
          }
          expect(msg).toBeInstanceOf(DecodedMessage)
          lastMessage = msg
        }
      }
    })

    it('ignores failed decoding of messages', async () => {
      const consoleWarn = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {})
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
      expect(consoleWarn).toBeCalledTimes(1)
      consoleWarn.mockRestore()
    })

    it('works for messaging yourself', async () => {
      const convo = await alice.conversations.newConversation(alice.address)
      await convo.send('hey me')

      const messages = await convo.messages()
      expect(messages).toHaveLength(1)
      expect(messages[0].content).toBe('hey me')
      expect(messages[0].senderAddress).toBe(alice.address)
      expect(messages[0].recipientAddress).toBe(alice.address)
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
        expect(message.contentTopic).toBe(
          buildDirectMessageTopic(alice.address, bob.address)
        )
        expect(message.conversation.topic).toBe(aliceConversation.topic)
        expect(message.error).toBeUndefined()
        expect(message.messageVersion).toBe('v1')
        if (numMessages === 1) {
          expect(message.content).toBe('gm')
          expect(message.senderAddress).toBe(bob.address)
          expect(message.recipientAddress).toBe(alice.address)
        } else {
          expect(message.content).toBe('gm to you too')
          expect(message.senderAddress).toBe(alice.address)
        }
        if (numMessages === 5) {
          break
        }
        await aliceConversation.send('gm to you too')
      }

      let result = await stream.next()
      expect(result.done).toBeTruthy()

      await sleep(100)
      expect(numMessages).toBe(5)
      expect(await aliceConversation.messages()).toHaveLength(5)
      await stream.return()
    })

    it('handles limiting page size', async () => {
      const bobConvo = await alice.conversations.newConversation(bob.address)
      for (let i = 0; i < 5; i++) {
        await bobConvo.send('hi')
      }
      const messages = await bobConvo.messages({ limit: 2 })
      expect(messages).toHaveLength(2)
    })

    it('queries with date filters', async () => {
      const now = new Date().valueOf()
      const dates = [1, 2, 3, 4, 5].map(
        (daysAgo) => new Date(now - daysAgo * 1000 * 60 * 60 * 24)
      )
      const convo = await alice.conversations.newConversation(bob.address)
      for (const date of dates) {
        await convo.send('gm: ' + date.valueOf(), { timestamp: date })
      }
      await sleep(100)

      const fourDaysAgoOrMore = await convo.messages({ endTime: dates[3] })
      expect(fourDaysAgoOrMore).toHaveLength(2)

      const twoDaysAgoOrLess = await convo.messages({ startTime: dates[1] })
      expect(twoDaysAgoOrLess).toHaveLength(2)

      const twoToFourDaysAgo = await convo.messages({
        endTime: dates[1],
        startTime: dates[3],
      })
      expect(twoToFourDaysAgo).toHaveLength(3)
    })

    it('can send compressed messages', async () => {
      const convo = await alice.conversations.newConversation(bob.address)
      const content = 'A'.repeat(111)
      await convo.send(content, {
        contentType: ContentTypeText,
        compression: Compression.COMPRESSION_DEFLATE,
      })
      await sleep(100)
      const results = await convo.messages()
      expect(results).toHaveLength(1)
      const msg = results[0]
      expect(msg.content).toBe(content)
    })

    it('throws when opening a conversation with an unknown address', () => {
      expect(alice.conversations.newConversation('0xfoo')).rejects.toThrow(
        'invalid address'
      )
      const validButUnknown = '0x1111111111222222222233333333334444444444'
      expect(
        alice.conversations.newConversation(validButUnknown)
      ).rejects.toThrow(
        `Recipient ${validButUnknown} is not on the XMTP network`
      )
    })

    it('normalizes upper and lowercase addresses', async () => {
      const bobLower = bob.address.toLowerCase()
      const bobUpper = '0x' + bob.address.substring(2).toUpperCase()
      await expect(
        alice.conversations.newConversation(bobLower)
      ).resolves.toMatchObject({
        peerAddress: bob.address,
      })
      await expect(
        alice.conversations.newConversation(bobUpper)
      ).resolves.toMatchObject({
        peerAddress: bob.address,
      })
    })

    it('filters out spoofed messages', async () => {
      const consoleWarn = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {})
      const aliceConvo = await alice.conversations.newConversation(bob.address)
      const bobConvo = await bob.conversations.newConversation(alice.address)
      const stream = await bobConvo.streamMessages()
      await sleep(100)
      // mallory takes over alice's client
      const malloryWallet = newWallet()
      const mallory = await PrivateKeyBundleV1.generate(malloryWallet)
      const aliceKeys = alice.legacyKeys
      alice.legacyKeys = mallory
      await aliceConvo.send('Hello from Mallory')
      // alice restores control
      alice.legacyKeys = aliceKeys
      await aliceConvo.send('Hello from Alice')
      const result = await stream.next()
      const msg = result.value as DecodedMessage
      expect(msg.senderAddress).toBe(alice.address)
      expect(msg.content).toBe('Hello from Alice')
      await stream.return()
      expect(consoleWarn).toBeCalledTimes(1)
      consoleWarn.mockRestore()
    })

    it('can send custom content type', async () => {
      const aliceConvo = await alice.conversations.newConversation(bob.address)
      const bobConvo = await bob.conversations.newConversation(alice.address)
      const aliceStream = await aliceConvo.streamMessages()
      const bobStream = await bobConvo.streamMessages()
      const key = PrivateKey.generate().publicKey

      // alice doesn't recognize the type
      await expect(
        aliceConvo.send(key, {
          contentType: ContentTypeTestKey,
        })
      ).rejects.toThrow('unknown content type xmtp.test/public-key:1.0')

      // bob doesn't recognize the type
      alice.registerCodec(new TestKeyCodec())
      await aliceConvo.send(key, {
        contentType: ContentTypeTestKey,
        contentFallback: 'this is a public key',
      })

      const aliceResult1 = await aliceStream.next()
      const aliceMessage1 = aliceResult1.value as DecodedMessage
      expect(aliceMessage1.content).toEqual(key)

      const bobResult1 = await bobStream.next()
      const bobMessage1 = bobResult1.value as DecodedMessage
      expect(bobMessage1).toBeTruthy()
      expect(bobMessage1.error?.message).toBe(
        'unknown content type xmtp.test/public-key:1.0'
      )
      expect(bobMessage1.contentType).toBeTruthy()
      expect(bobMessage1.contentType.sameAs(ContentTypeFallback))
      expect(bobMessage1.content).toBe('this is a public key')

      // both recognize the type
      bob.registerCodec(new TestKeyCodec())
      await aliceConvo.send(key, {
        contentType: ContentTypeTestKey,
      })
      const bobResult2 = await bobStream.next()
      const bobMessage2 = bobResult2.value as DecodedMessage
      expect(bobMessage2.contentType).toBeTruthy()
      expect(bobMessage2.contentType.sameAs(ContentTypeTestKey)).toBeTruthy()
      expect(key.equals(bobMessage2.content)).toBeTruthy()

      // alice tries to send version that is not supported
      const type2 = new ContentTypeId({
        ...ContentTypeTestKey,
        versionMajor: 2,
      })
      expect(aliceConvo.send(key, { contentType: type2 })).rejects.toThrow(
        'unknown content type xmtp.test/public-key:2.0'
      )

      await bobStream.return()
      await aliceStream.return()
    })

    it('exports', async () => {
      const convo = await alice.conversations.newConversation(bob.address)
      const exported = convo.export()

      expect(exported.peerAddress).toBe(bob.address)
      expect(exported.createdAt).toBe(convo.createdAt.toISOString())
      expect(exported.version).toBe('v1')
    })

    it('imports', async () => {
      const convo = await alice.conversations.newConversation(bob.address)
      const exported = convo.export()

      if (exported.version !== 'v1') {
        fail()
      }
      const imported = ConversationV1.fromExport(alice, exported)
      expect(imported.createdAt).toEqual(convo.createdAt)
      await imported.send('hello')
      await sleep(50)

      const results = await convo.messages()
      expect(results).toHaveLength(1)
      expect(results[0].content).toBe('hello')
    })
  })

  describe('v2', () => {
    beforeEach(async () => {
      alice = await newLocalHostClient()
      bob = await newLocalHostClient()
      await waitForUserContact(alice, alice)
      await waitForUserContact(bob, bob)
    })

    it('v2 conversation', async () => {
      expect(await bob.getUserContact(alice.address)).toBeInstanceOf(
        SignedPublicKeyBundle
      )
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
      expect(bc.export().keyMaterial).toEqual(ac.export().keyMaterial)
      const bs = await bc.streamMessages()
      await sleep(100)

      await ac.send('gm')
      expect((await bs.next()).value.content).toBe('gm')
      expect((await as.next()).value.content).toBe('gm')
      await bc.send('gm to you too')
      expect((await bs.next()).value.content).toBe('gm to you too')
      expect((await as.next()).value.content).toBe('gm to you too')

      await bs.return()
      await as.return()
    })

    it('handles limiting page size', async () => {
      const bobConvo = await alice.conversations.newConversation(bob.address, {
        conversationId: 'xmtp.org/foo',
        metadata: {},
      })

      for (let i = 0; i < 5; i++) {
        await bobConvo.send('hi')
      }
      await sleep(100)
      const messages = await bobConvo.messages({ limit: 2 })
      expect(messages).toHaveLength(2)
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
      if (!(sentMessage instanceof DecodedMessage)) {
        throw new Error('Not a DecodedMessage')
      }
      expect(sentMessage.conversation.context?.conversationId).toBe(
        conversationId
      )
      await sleep(100)

      const firstMessageFromStream: DecodedMessage = (await stream.next()).value
      expect(firstMessageFromStream.messageVersion).toBe('v2')
      expect(firstMessageFromStream.content).toBe('foo')
      expect(firstMessageFromStream.conversation.context?.conversationId).toBe(
        conversationId
      )

      const messages = await convo.messages()
      expect(messages).toHaveLength(1)
      expect(messages[0].content).toBe('foo')
      expect(messages[0].conversation).toBe(convo)
      await stream.return()
    })

    it('queries with date filters', async () => {
      const now = new Date().valueOf()
      const dates = [1, 2, 3, 4, 5].map(
        (daysAgo) => new Date(now - daysAgo * 1000 * 60 * 60 * 24)
      )
      const convo = await alice.conversations.newConversation(bob.address, {
        conversationId: 'xmtp.org/foo',
        metadata: {},
      })
      for (const date of dates) {
        await convo.send('gm: ' + date.valueOf(), { timestamp: date })
      }
      await sleep(100)

      const fourDaysAgoOrMore = await convo.messages({ endTime: dates[3] })
      expect(fourDaysAgoOrMore).toHaveLength(2)

      const twoDaysAgoOrLess = await convo.messages({ startTime: dates[1] })
      expect(twoDaysAgoOrLess).toHaveLength(2)

      const twoToFourDaysAgo = await convo.messages({
        endTime: dates[1],
        startTime: dates[3],
      })
      expect(twoToFourDaysAgo).toHaveLength(3)
    })

    it('can send custom content type', async () => {
      const aliceConvo = await alice.conversations.newConversation(
        bob.address,
        {
          conversationId: 'xmtp.org/key',
          metadata: {},
        }
      )
      await sleep(100)
      const bobConvo = await bob.conversations.newConversation(alice.address, {
        conversationId: 'xmtp.org/key',
        metadata: {},
      })
      const aliceStream = await aliceConvo.streamMessages()
      const bobStream = await bobConvo.streamMessages()
      const key = PrivateKey.generate().publicKey

      // alice doesn't recognize the type
      expect(
        aliceConvo.send(key, {
          contentType: ContentTypeTestKey,
        })
      ).rejects.toThrow('unknown content type xmtp.test/public-key:1.0')

      // bob doesn't recognize the type
      alice.registerCodec(new TestKeyCodec())
      await aliceConvo.send(key, {
        contentType: ContentTypeTestKey,
        contentFallback: 'this is a public key',
      })

      const aliceResult1 = await aliceStream.next()
      const aliceMessage1 = aliceResult1.value as DecodedMessage
      expect(aliceMessage1.content).toEqual(key)

      const bobResult1 = await bobStream.next()
      const bobMessage1 = bobResult1.value as DecodedMessage
      expect(bobMessage1).toBeTruthy()
      expect(bobMessage1.error?.message).toBe(
        'unknown content type xmtp.test/public-key:1.0'
      )
      expect(bobMessage1.contentType).toBeTruthy()
      expect(bobMessage1.contentType.sameAs(ContentTypeFallback))
      expect(bobMessage1.content).toBe('this is a public key')

      // both recognize the type
      bob.registerCodec(new TestKeyCodec())
      await aliceConvo.send(key, {
        contentType: ContentTypeTestKey,
      })
      const bobResult2 = await bobStream.next()
      const bobMessage2 = bobResult2.value as DecodedMessage
      expect(bobMessage2.contentType).toBeTruthy()
      expect(bobMessage2.contentType.sameAs(ContentTypeTestKey)).toBeTruthy()
      expect(key.equals(bobMessage2.content)).toBeTruthy()

      // alice tries to send version that is not supported
      const type2 = new ContentTypeId({
        ...ContentTypeTestKey,
        versionMajor: 2,
      })
      expect(aliceConvo.send(key, { contentType: type2 })).rejects.toThrow(
        'unknown content type xmtp.test/public-key:2.0'
      )

      await bobStream.return()
      await aliceStream.return()
    })

    it('exports', async () => {
      const conversationId = 'xmtp.org/foo'
      const convo = await alice.conversations.newConversation(bob.address, {
        conversationId,
        metadata: {},
      })
      const exported = convo.export()

      if (exported.version !== 'v2') {
        fail()
      }
      expect(exported.peerAddress).toBe(bob.address)
      expect(exported.createdAt).toBe(convo.createdAt.toISOString())
      expect(exported.context?.conversationId).toBe(conversationId)
      expect(exported.keyMaterial).toBeTruthy()
      expect(exported.topic).toBe(convo.topic)
    })

    it('imports', async () => {
      const conversationId = 'xmtp.org/foo'
      const convo = await alice.conversations.newConversation(bob.address, {
        conversationId,
        metadata: {},
      })
      const exported = convo.export()

      if (exported.version !== 'v2') {
        fail()
      }

      const imported = ConversationV2.fromExport(alice, exported)
      expect(imported.createdAt).toEqual(convo.createdAt)
      await imported.send('hello')
      await sleep(50)

      // Get messages from original conversation
      const results = await convo.messages()
      expect(results).toHaveLength(1)
      expect(results[0].content).toBe('hello')
    })
  })
})

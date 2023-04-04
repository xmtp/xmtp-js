import { buildDirectMessageTopic } from '../../../src/utils'
import {
  Client,
  Compression,
  ContentTypeFallback,
  ContentTypeId,
  ContentTypeText,
} from '../../../src'
import {
  VoodooContact,
  default as VoodooClient,
} from '../../../src/voodoo/VoodooClient'
import { SortDirection } from '../../../src/ApiClient'
import { sleep } from '../../../src/utils'
import { newLocalHostVoodooClient, waitForUserContact } from '../helpers'

describe('conversation', () => {
  let alice: VoodooClient
  let bob: VoodooClient

  describe('voodoo', () => {
    beforeEach(async () => {
      alice = await newLocalHostVoodooClient()
      bob = await newLocalHostVoodooClient()
      await waitForUserContact(alice, alice)
      await waitForUserContact(bob, bob)
    })

    it('v2 conversation', async () => {
      expect(await bob.getUserContactFromNetwork(alice.address)).toBeInstanceOf(
        VoodooContact
      )
      expect(await alice.getUserContactFromNetwork(bob.address)).toBeInstanceOf(
        VoodooContact
      )
    })

    /*
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

    it('can send compressed v2 messages', async () => {
      const convo = await alice.conversations.newConversation(bob.address, {
        conversationId: 'example.com/compressedv2',
        metadata: {},
      })
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
    */
  })
})

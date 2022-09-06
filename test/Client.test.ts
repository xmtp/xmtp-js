import assert from 'assert'
import {
  pollFor,
  newWallet,
  dumpStream,
  newLocalHostClient,
  newDevClient,
  waitForUserContact,
} from './helpers'
import { buildUserContactTopic, sleep } from '../src/utils'
import Client, { KeyStoreType } from '../src/Client'

import { TestKeyCodec, ContentTypeTestKey } from './ContentTypeTestKey'
import {
  ContentTypeFallback,
  PrivateKey,
  Message,
  ContentTypeText,
  Compression,
  ContentTypeId,
  PrivateKeyBundle,
} from '../src'

type TestCase = {
  name: string
  newClient: () => Promise<Client>
}

describe('Client', () => {
  const tests: TestCase[] = [
    {
      name: 'local host node',
      newClient: newLocalHostClient,
    },
  ]

  if (process.env.CI || process.env.TESTNET) {
    tests.push({
      name: 'dev',
      newClient: newDevClient,
    })
  }
  tests.forEach((testCase) => {
    describe(testCase.name, () => {
      let alice: Client, bob: Client
      beforeAll(async () => {
        alice = await testCase.newClient()
        bob = await testCase.newClient()
      })
      afterAll(async () => {
        if (alice) await alice.close()
        if (bob) await bob.close()
      })

      it('user contacts published', async () => {
        const alicePublic = await waitForUserContact(alice, alice)
        assert.deepEqual(alice.keys.getPublicKeyBundle(), alicePublic)
        const bobPublic = await waitForUserContact(bob, bob)
        assert.deepEqual(bob.keys.getPublicKeyBundle(), bobPublic)
      })

      it('user contacts are filtered to valid contacts', async () => {
        // publish bob's keys to alice's contact topic
        const bobPublic = bob.keys.getPublicKeyBundle()
        await alice.publishEnvelope({
          message: bobPublic.toBytes(),
          contentTopic: buildUserContactTopic(alice.address),
        })
        const alicePublic = await alice.getUserContactFromNetwork(alice.address)
        assert.deepEqual(alice.keys.getPublicKeyBundle(), alicePublic)
      })

      it.only('send, stream and list messages', async () => {
        const bobIntros = await bob.streamIntroductionMessages()
        const bobAlice = await bob.streamConversationMessages(alice.address)
        const aliceIntros = await alice.streamIntroductionMessages()
        const aliceBob = await alice.streamConversationMessages(bob.address)
        await sleep(100)
        // alice sends intro
        const sentMessage = await alice.sendMessage(bob.address, 'hi bob!')
        assert.equal(sentMessage.content, 'hi bob!')
        assert.ok(sentMessage.id)
        assert.ok(sentMessage.sent)
        let msg = await aliceIntros.next()
        assert.equal(msg.value.content, 'hi bob!')

        // bob sends intro in response
        msg = await bobIntros.next()
        assert.equal(msg.value.content, 'hi bob!')
        await bob.sendMessage(alice.address, 'hi alice!')
        msg = await bobIntros.next()
        assert.equal(msg.value.content, 'hi alice!')

        // alice sends follow up
        msg = await aliceIntros.next()
        assert.equal(msg.value.content, 'hi alice!')
        await alice.sendMessage(bob.address, 'how are you?')
        msg = await aliceBob.next()
        assert.equal(msg.value.content, 'hi bob!')
        msg = await aliceBob.next()
        assert.equal(msg.value.content, 'hi alice!')
        msg = await aliceBob.next()
        assert.equal(msg.value.content, 'how are you?')

        // bob responds to follow up
        msg = await bobAlice.next()
        assert.equal(msg.value.content, 'hi bob!')
        msg = await bobAlice.next()
        assert.equal(msg.value.content, 'hi alice!')
        msg = await bobAlice.next()
        assert.equal(msg.value.content, 'how are you?')
        await bob.sendMessage(alice.address, 'fantastic!')
        msg = await bobAlice.next()
        assert.equal(msg.value.content, 'fantastic!')

        // alice receives follow up
        msg = await aliceBob.next()
        assert.equal(msg.value.content, 'fantastic!')

        // list messages sent previously
        const fixtures: [string, Client, string | null, string[]][] = [
          ['alice-intro', alice, null, ['hi bob!', 'hi alice!']],
          ['bob-intro', bob, null, ['hi bob!', 'hi alice!']],
          [
            'alice-convo',
            alice,
            bob.address,
            ['hi bob!', 'hi alice!', 'how are you?', 'fantastic!'],
          ],
          [
            'bob-convo',
            bob,
            alice.address,
            ['hi bob!', 'hi alice!', 'how are you?', 'fantastic!'],
          ],
        ]
        await Promise.all(
          fixtures.map(async ([name, client, address, expected]) => {
            const messages = await pollFor(
              async () => {
                const messages = address
                  ? await client.listConversationMessages(address)
                  : await client.listIntroductionMessages()
                assert.equal(messages.length, expected.length, name)
                return messages
              },
              5000,
              500
            )
            for (let i = 0; i < expected.length; i++) {
              assert.equal(
                messages[i].content,
                expected[i],
                `${name} message[${i}]`
              )
            }
          })
        )
      })
      it('messaging yourself', async () => {
        const convo = await alice.streamConversationMessages(alice.address)
        const intro = await alice.streamIntroductionMessages()
        const messages = ['Hey me!', 'Yo!', 'Over and out']
        for (let message of messages) {
          await alice.sendMessage(alice.address, message)
        }

        const intros = await dumpStream(intro)
        assert.equal(intros.length, 1)
        assert.equal(intros[0].content, messages[0])

        const convos = await dumpStream(convo)
        assert.equal(convos.length, messages.length)
        assert.deepEqual(
          convos.map((convo) => convo.content).sort(),
          messages.sort()
        )
      })

      it('query historic messages', async () => {
        const c1 = await testCase.newClient()
        const c2 = await testCase.newClient()
        assert(await waitForUserContact(c1, c2))

        const msgCount = 5
        const now = new Date().getTime()
        const tenWeeksAgo = now - 1000 * 60 * 60 * 24 * 10
        for (let i = 0; i < msgCount; i++) {
          await c1.sendMessage(c2.address, 'msg' + (i + 1), {
            timestamp: new Date(tenWeeksAgo + i * 1000),
          })
        }

        const msgs = await pollFor(
          async () => {
            const msgs = await c2.listConversationMessages(c1.address)
            assert.equal(msgs.length, msgCount)
            return msgs
          },
          5000,
          200
        )

        assert.equal(msgs.length, msgCount)
        assert.deepEqual(
          msgs.map((msg) => msg.error || msg.content),
          [...Array(msgCount).keys()].map((i) => 'msg' + (i + 1))
        )
      })

      it('query pagination', async () => {
        const c1 = await testCase.newClient()
        const c2 = await testCase.newClient()
        assert(await waitForUserContact(c1, c2))

        const msgCount = 10
        const now = new Date().getTime()
        const tenWeeksAgo = now - 1000 * 60 * 60 * 24 * 10
        for (let i = 0; i < msgCount; i++) {
          await c1.sendMessage(c2.address, 'msg' + (i + 1), {
            timestamp: new Date(tenWeeksAgo + i * 1000),
          })
        }

        const msgs = await pollFor(
          async () => {
            const msgs = await c2.listConversationMessages(c1.address, {})
            assert.equal(msgs.length, msgCount)
            return msgs
          },
          5000,
          200
        )

        assert.equal(msgs.length, msgCount)
        assert.deepEqual(
          msgs.map((msg) => msg.error || msg.content),
          [...Array(msgCount).keys()].map((i) => 'msg' + (i + 1))
        )
      })

      it('for-await-of with stream', async () => {
        const convo = await alice.streamConversationMessages(bob.address)
        let count = 5
        await alice.sendMessage(bob.address, 'msg ' + count)
        for await (const msg of convo) {
          assert.equal(msg.content, 'msg ' + count)
          count--
          if (!count) {
            break
          }
          await alice.sendMessage(bob.address, 'msg ' + count)
        }
        // check that the stream was closed
        let result = await convo.next()
        assert.ok(result.done)
      })

      it('send to unregistered address throws', async () => {
        return expect(
          alice.sendMessage('unregistered address', 'hello as well')
        ).rejects.toThrow('recipient unregistered address is not registered')
      })

      it('Check address can be sent to', async () => {
        const can_mesg_a = await alice.canMessage('NOT AN ADDRESS')
        assert.equal(can_mesg_a, false)

        const can_mesg_b = await alice.canMessage(bob.address)
        assert.equal(can_mesg_b, true)
      })

      it('can send compressed messages', async () => {
        const convo = await bob.streamConversationMessages(alice.address)
        const content = 'A'.repeat(111)
        await alice.sendMessage(bob.address, content, {
          contentType: ContentTypeText,
          compression: Compression.COMPRESSION_DEFLATE,
        })
        const result = await convo.next()
        const msg = result.value as Message
        assert.equal(msg.content, content)
        await convo.return()
      })

      it('can send custom content type', async () => {
        const stream = await bob.streamConversationMessages(alice.address)
        const key = PrivateKey.generate().publicKey

        // alice doesn't recognize the type
        await expect(
          alice.sendMessage(bob.address, key, {
            contentType: ContentTypeTestKey,
          })
        ).rejects.toThrow('unknown content type xmtp.test/public-key:1.0')

        // bob doesn't recognize the type
        alice.registerCodec(new TestKeyCodec())
        await alice.sendMessage(bob.address, key, {
          contentType: ContentTypeTestKey,
          contentFallback: 'this is a public key',
        })
        let result = await stream.next()
        let msg = result.value as Message
        assert.ok(msg.error)
        assert.equal(
          msg.error.message,
          'unknown content type xmtp.test/public-key:1.0'
        )
        assert.ok(msg.contentType)
        assert(msg.contentType.sameAs(ContentTypeFallback))
        assert.equal(msg.content, 'this is a public key')

        // both recognize the type
        bob.registerCodec(new TestKeyCodec())
        await alice.sendMessage(bob.address, key, {
          contentType: ContentTypeTestKey,
        })
        result = await stream.next()
        msg = result.value as Message
        assert(msg.contentType)
        assert(msg.contentType.sameAs(ContentTypeTestKey))
        assert(key.equals(msg.content))

        // alice tries to send version that is not supported
        const type2 = new ContentTypeId({
          ...ContentTypeTestKey,
          versionMajor: 2,
        })
        await expect(
          alice.sendMessage(bob.address, key, { contentType: type2 })
        ).rejects.toThrow('unknown content type xmtp.test/public-key:2.0')

        await stream.return()
      })

      it('filters out spoofed messages', async () => {
        const stream = await bob.streamConversationMessages(alice.address)
        // mallory takes over alice's client
        const malloryWallet = newWallet()
        const mallory = await PrivateKeyBundle.generate(malloryWallet)
        const aliceKeys = alice.keys
        alice.keys = mallory
        await alice.sendMessage(bob.address, 'Hello from Mallory')
        // alice restores control
        alice.keys = aliceKeys
        await alice.sendMessage(bob.address, 'Hello from Alice')
        const result = await stream.next()
        const msg = result.value as Message
        assert.equal(msg.senderAddress, alice.address)
        assert.equal(msg.content, 'Hello from Alice')
      })

      it('handles limiting page size', async () => {
        const bobConvo = await alice.conversations.newConversation(bob.address)
        for (let i = 0; i < 5; i++) {
          await bobConvo.send('hi')
        }
        const messages = await bobConvo.messages({ limit: 2 })
        expect(messages).toHaveLength(2)
      })
    })
  })
})

describe('ClientOptions', () => {
  const tests = [
    {
      name: 'local docker node',
      newClient: newLocalHostClient,
    },
  ]
  if (process.env.CI || process.env.TESTNET) {
    tests.push({
      name: 'dev',
      newClient: newDevClient,
    })
  }
  tests.forEach((testCase) => {
    it('Default/empty options', async () => {
      const c = await testCase.newClient()
    })

    it('Partial specification', async () => {
      const c = await testCase.newClient({
        keyStoreType: KeyStoreType.localStorage,
      })
    })
  })
})

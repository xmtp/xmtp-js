import assert from 'assert'
import { pollFor, newWallet, dumpStream } from './helpers'
import { promiseWithTimeout, sleep } from '../src/utils'
import Client, { KeyStoreType } from '../src/Client'

const newLocalDockerClient = (): Promise<Client> =>
  Client.create(newWallet(), {
    bootstrapAddrs: [
      '/ip4/127.0.0.1/tcp/9001/ws/p2p/16Uiu2HAmNCxLZCkXNbpVPBpSSnHj9iq4HZQj7fxRzw2kj1kKSHHA',
    ],
  })

const newTestnetClient = (): Promise<Client> =>
  Client.create(newWallet(), { env: 'testnet' })

describe('Client', () => {
  jest.setTimeout(40000)
  const tests = [
    {
      name: 'local docker node',
      newClient: newLocalDockerClient,
    },
  ]
  if (process.env.CI || process.env.TESTNET) {
    tests.push({
      name: 'testnet',
      newClient: newTestnetClient,
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

      it('waku setup', async () => {
        assert.ok(alice.waku)
        assert(Array.from(alice.waku.relay.getPeers()).length === 1)
        assert.ok(bob.waku)
        assert(Array.from(bob.waku.relay.getPeers()).length === 1)
      })

      it('user contacts published', async () => {
        await sleep(10)
        const alicePublic = await alice.getUserContactFromNetwork(alice.address)
        console.log(alicePublic)
        assert.deepEqual(alice.keys.getPublicKeyBundle(), alicePublic)
        const bobPublic = await bob.getUserContactFromNetwork(bob.address)
        assert.deepEqual(bob.keys.getPublicKeyBundle(), bobPublic)
      })

      it('send, stream and list messages', async () => {
        const bobIntros = bob.streamIntroductionMessages()
        const bobAlice = bob.streamConversationMessages(alice.address)
        const aliceIntros = alice.streamIntroductionMessages()
        const aliceBob = alice.streamConversationMessages(bob.address)

        // alice sends intro
        await alice.sendMessage(bob.address, 'hi bob!')
        let msg = await aliceIntros.next()
        assert.equal(msg.value.decrypted, 'hi bob!')

        // bob sends intro in response
        msg = await bobIntros.next()
        assert.equal(msg.value.decrypted, 'hi bob!')
        await bob.sendMessage(alice.address, 'hi alice!')
        msg = await bobIntros.next()
        assert.equal(msg.value.decrypted, 'hi alice!')

        // alice sends follow up
        msg = await aliceIntros.next()
        assert.equal(msg.value.decrypted, 'hi alice!')
        await alice.sendMessage(bob.address, 'how are you?')
        msg = await aliceBob.next()
        assert.equal(msg.value.decrypted, 'hi bob!')
        msg = await aliceBob.next()
        assert.equal(msg.value.decrypted, 'hi alice!')
        msg = await aliceBob.next()
        assert.equal(msg.value.decrypted, 'how are you?')

        // bob responds to follow up
        msg = await bobAlice.next()
        assert.equal(msg.value.decrypted, 'hi bob!')
        msg = await bobAlice.next()
        assert.equal(msg.value.decrypted, 'hi alice!')
        msg = await bobAlice.next()
        assert.equal(msg.value.decrypted, 'how are you?')
        await bob.sendMessage(alice.address, 'fantastic!')
        msg = await bobAlice.next()
        assert.equal(msg.value.decrypted, 'fantastic!')

        // alice receives follow up
        msg = await aliceBob.next()
        assert.equal(msg.value.decrypted, 'fantastic!')

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
                messages[i].decrypted,
                expected[i],
                `${name} message[${i}]`
              )
            }
          })
        )
      })
      it('messaging yourself', async () => {
        const convo = alice.streamConversationMessages(alice.address)
        const intro = alice.streamIntroductionMessages()
        const messages = ['Hey me!', 'Yo!', 'Over and out']
        for (let message of messages) {
          await alice.sendMessage(alice.address, message)
        }

        const intros = await dumpStream(intro)
        assert.equal(intros.length, 1)
        assert.equal(intros[0].decrypted, messages[0])

        const convos = await dumpStream(convo)
        assert.equal(convos.length, messages.length)
        convos.forEach((m, i) => assert.equal(m.decrypted, messages[i]))
      })

      it('for-await-of with stream', async () => {
        const convo = alice.streamConversationMessages(bob.address)
        let count = 5
        await alice.sendMessage(bob.address, 'msg ' + count)
        for await (const msg of convo) {
          assert.equal(msg.decrypted, 'msg ' + count)
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
    })
  })
})

describe('ClientOptions', () => {
  it('Default/empty options', async () => {
    await Client.create(newWallet(), {})
  })

  it('Partial specification', async () => {
    await Client.create(newWallet(), {
      keyStoreType: KeyStoreType.localStorage,
      waitForPeersTimeoutMs: 1234,
    })
  })
})

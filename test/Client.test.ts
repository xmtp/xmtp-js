import { PrivateKeyBundle } from '../src/crypto'
import assert from 'assert'
import { waitFor, newWallet } from './helpers'
import { promiseWithTimeout, sleep } from '../src/utils'
import Client from '../src/Client'

const newLocalDockerClient = (): Promise<Client> =>
  Client.create(newWallet(), {
    bootstrapAddrs: [
      '/ip4/127.0.0.1/tcp/9001/ws/p2p/16Uiu2HAmNCxLZCkXNbpVPBpSSnHj9iq4HZQj7fxRzw2kj1kKSHHA',
    ],
  })

const newTestnetClient = (): Promise<Client> =>
  Client.create(newWallet(), {
    bootstrapAddrs: [
      '/dns4/bootstrap-node-0.testnet.xmtp.network/tcp/8443/wss/p2p/16Uiu2HAm888gVYpr4cZQ4qhEendQW6oYEhG8n6fnqw1jVW3Prdc6',
    ],
  })

describe('Client', () => {
  const tests = [
    {
      name: 'testnet',
      newClient: newTestnetClient,
    },
    {
      name: 'local docker node',
      newClient: newLocalDockerClient,
    },
  ]
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
        const alicePublic = await alice.getUserContact(alice.address)
        assert.deepEqual(alice.keys.getPublicKeyBundle(), alicePublic)
        const bobPublic = await bob.getUserContact(bob.address)
        assert.deepEqual(bob.keys.getPublicKeyBundle(), bobPublic)
      })

      it('send, stream and list messages', async () => {
        const bobIntros = bob.streamMessages(bob.address)
        const bobAlice = bob.streamMessages(alice.address)
        const aliceIntros = alice.streamMessages(alice.address)
        const aliceBob = alice.streamMessages(bob.address)

        // alice sends intro
        await alice.sendMessage(bob.address, 'hi bob!')
        let msg = await aliceIntros.next()
        assert.equal(msg.decrypted, 'hi bob!')

        // bob sends intro in response
        msg = await bobIntros.next()
        assert.equal(msg.decrypted, 'hi bob!')
        await bob.sendMessage(alice.address, 'hi alice!')
        msg = await bobIntros.next()
        assert.equal(msg.decrypted, 'hi alice!')

        // alice sends follow up
        msg = await aliceIntros.next()
        assert.equal(msg.decrypted, 'hi alice!')
        await alice.sendMessage(bob.address, 'how are you?')
        msg = await aliceBob.next()
        assert.equal(msg.decrypted, 'how are you?')

        // bob send follow up
        msg = await bobAlice.next()
        assert.equal(msg.decrypted, 'how are you?')
        await bob.sendMessage(alice.address, 'fantastic!')
        msg = await bobAlice.next()
        assert.equal(msg.decrypted, 'fantastic!')

        // alice receives follow up
        msg = await aliceBob.next()
        assert.equal(msg.decrypted, 'fantastic!')

        // check next() times out at the end of a topic
        let timeout = false
        try {
          await promiseWithTimeout<void>(
            5,
            async () => {
              await bobIntros.next()
            },
            'timeout'
          )
        } catch (err) {
          timeout = err instanceof Error && (err as Error).message === 'timeout'
        }
        assert.ok(timeout)

        // list messages sent previously
        const messages = await waitFor(
          async () => {
            const messages = await bob.listMessages(alice.address)
            if (!messages.length) throw new Error('no messages')
            return messages
          },
          5000,
          100
        )
        assert.equal(messages.length, 2)
        assert.equal(messages[0].decrypted, 'how are you?')
        assert.equal(messages[1].decrypted, 'fantastic!')
      })

      it('send to unregistered address throws', async () => {
        return expect(
          alice.sendMessage('unregistered address', 'hello as well')
        ).rejects.toThrow('recipient unregistered address is not registered')
      })
    })
  })
})

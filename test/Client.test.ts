import { PrivateKeyBundle } from '../src/crypto'
import assert from 'assert'
import { waitFor, newWallet, assertTimeout } from './helpers'
import { sleep } from '../src/utils'
import Client from '../src/Client'

const newLocalDockerClient = (): Promise<Client> =>
  Client.create({
    bootstrapAddrs: [
      '/ip4/127.0.0.1/tcp/9001/ws/p2p/16Uiu2HAmNCxLZCkXNbpVPBpSSnHj9iq4HZQj7fxRzw2kj1kKSHHA',
    ],
  })

const newTestnetClient = (): Promise<Client> =>
  Client.create({
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
      let client: Client
      beforeAll(async () => {
        client = await testCase.newClient()
      })
      afterAll(async () => {
        if (client) await client.close()
      })

      it('create', async () => {
        assert.ok(client.waku)
        assert(Array.from(client.waku.relay.getPeers()).length === 1)
      })

      it('publish and get user contact', async () => {
        const registered = await PrivateKeyBundle.generate(newWallet())
        await client.publishUserContact(registered.getPublicKeyBundle())
        await sleep(10)
        const received = await client.getUserContact(
          registered.identityKey.publicKey.walletSignatureAddress()
        )
        assert.deepEqual(registered.getPublicKeyBundle(), received)
      })

      it('stream and send messages', async () => {
        const sender = await PrivateKeyBundle.generate(newWallet())
        const recipient = await PrivateKeyBundle.generate(newWallet())
        await client.publishUserContact(recipient.getPublicKeyBundle())

        const recipientStream = client.streamMessages(
          sender.identityKey.publicKey.walletSignatureAddress(),
          recipient.identityKey.publicKey.walletSignatureAddress(),
          recipient
        )

        const senderStream = client.streamMessages(
          sender.identityKey.publicKey.walletSignatureAddress(),
          recipient.identityKey.publicKey.walletSignatureAddress(),
          sender
        )

        await client.sendMessage(
          sender,
          recipient.getPublicKeyBundle(),
          'first'
        )
        await client.sendMessage(
          sender,
          recipient.getPublicKeyBundle(),
          'second'
        )

        // Expect recipients receives exactly 2 messages on their DM topic.
        let msg = await recipientStream.next()
        assert.equal(msg.decrypted, 'first')
        msg = await recipientStream.next()
        assert.equal(msg.decrypted, 'second')
        assertTimeout(async () => {
          await recipientStream.next()
        }, 5)

        // Expect sender receives exactly 2 messages on their DM topic.
        msg = await senderStream.next()
        assert.equal(msg.decrypted, 'first')
        msg = await senderStream.next()
        assert.equal(msg.decrypted, 'second')
        assertTimeout(async () => {
          await senderStream.next()
        }, 5)
      })
      it('listMessages', async () => {
        const recipient = await PrivateKeyBundle.generate(newWallet())

        const sender = await PrivateKeyBundle.generate(newWallet())
        await client.sendMessage(sender, recipient.getPublicKeyBundle(), 'hi')

        // Expect message on the recipient DM topic.
        const recipientMsgs = await waitFor(
          async () => {
            const messages = await client.listMessages(
              sender.identityKey.publicKey.walletSignatureAddress(),
              recipient.identityKey.publicKey.walletSignatureAddress(),
              recipient
            )
            if (!messages.length) throw new Error('no messages')
            return messages
          },
          5000,
          100
        )
        assert.ok(recipientMsgs.length === 1)
        assert.equal(recipientMsgs[0].decrypted, 'hi')

        // Expect message on the sender DM topic.
        const senderMsgs = await waitFor(
          async () => {
            const messages = await client.listMessages(
              sender.identityKey.publicKey.walletSignatureAddress(),
              recipient.identityKey.publicKey.walletSignatureAddress(),
              recipient
            )
            if (!messages.length) throw new Error('no messages')
            return messages
          },
          5000,
          100
        )
        assert.ok(senderMsgs.length === 1)
        assert.equal(senderMsgs[0].decrypted, 'hi')
      })
    })
  })
})

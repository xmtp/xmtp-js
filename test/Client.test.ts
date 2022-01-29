import { PrivateKeyBundle } from '../src/crypto'
import assert from 'assert'
import { waitFor, newWallet } from './helpers'
import { localDockerWakuNodeBootstrapAddr } from './config'
import { promiseWithTimeout } from '../src/utils'
import Client from '../src/Client'

const newLocalDockerClient = (): Promise<Client> =>
  Client.create({
    bootstrapAddrs: [localDockerWakuNodeBootstrapAddr],
  })

const newStatusClient = (): Promise<Client> => Client.create()

describe('Client', () => {
  const tests = [
    {
      name: 'status network',
      newClient: newStatusClient,
    },
    {
      name: 'local docker node',
      newClient: newLocalDockerClient,
    },
  ]
  tests.forEach((testCase) => {
    describe(testCase.name, () => {
      let client: Client
      before(async () => {
        client = await testCase.newClient()
      })
      after(async () => {
        if (client) await client.close()
      })

      it('create', async () => {
        assert.ok(client.waku)
        assert(Array.from(client.waku.relay.getPeers()).length === 1)
      })

      it('sendMessage', async () => {
        const recipient = await PrivateKeyBundle.generate(newWallet())
        const sender = await PrivateKeyBundle.generate(newWallet())
        await client.sendMessage(sender, recipient.getPublicKeyBundle(), 'hi')
      })

      it('streamMessages', async () => {
        const recipient = await PrivateKeyBundle.generate(newWallet())
        const stream = client.streamMessages(recipient)

        const sender = await PrivateKeyBundle.generate(newWallet())
        await client.sendMessage(sender, recipient.getPublicKeyBundle(), 'hi')
        await client.sendMessage(
          sender,
          recipient.getPublicKeyBundle(),
          'hello'
        )

        let msg = await stream.next()
        assert.equal(msg.decrypted, 'hi')

        msg = await stream.next()
        assert.equal(msg.decrypted, 'hello')

        let timeout = false
        try {
          await promiseWithTimeout<void>(
            5,
            async () => {
              await stream.next()
            },
            'timeout'
          )
        } catch (err) {
          timeout = err instanceof Error && (err as Error).message === 'timeout'
        }
        assert.ok(timeout)
      })
      it('listMessages', async () => {
        const recipient = await PrivateKeyBundle.generate(newWallet())

        const sender = await PrivateKeyBundle.generate(newWallet())
        await client.sendMessage(sender, recipient.getPublicKeyBundle(), 'hi')

        const messages = await waitFor(
          async () => {
            const messages = await client.listMessages(recipient)
            if (!messages.length) throw new Error('no messages')
            return messages
          },
          1000,
          100
        )
        assert.ok(messages.length === 1)
        assert.equal(messages[0].decrypted, 'hi')
      })
    })
  })
})

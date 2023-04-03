import assert from 'assert'
import {
  newWallet,
  newLocalHostClient,
  newDevClient,
  waitForUserContact,
  newLocalHostClientWithCustomWallet,
  sleep,
} from './helpers'
import { buildUserContactTopic } from '../src/utils'
import Client, { ClientOptions } from '../src/Client'
import { Compression, getRandomValues, Signer } from '../src'
import { content as proto } from '@xmtp/proto'
import { InMemoryKeystore } from '../src/keystore'
import NetworkKeyManager from '../src/keystore/providers/NetworkKeyManager'
import TopicPersistence from '../src/keystore/persistence/TopicPersistence'
import { PrivateKeyBundleV1 } from '../src/crypto'
import { Wallet } from 'ethers'
import { NetworkKeystoreProvider } from '../src/keystore/providers'

type TestCase = {
  name: string
  newClient: (opts?: Partial<ClientOptions>) => Promise<Client>
}

describe('Client', () => {
  const tests: TestCase[] = [
    {
      name: 'local host node',
      newClient: newLocalHostClient,
    },
    {
      name: 'local host node with non-ethers wallet',
      newClient: newLocalHostClientWithCustomWallet,
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

      beforeEach(async () => {
        alice = await testCase.newClient({ publishLegacyContact: true })
        bob = await testCase.newClient({ publishLegacyContact: true })
        await waitForUserContact(alice, alice)
        await waitForUserContact(bob, bob)
      })

      it('user contacts published', async () => {
        const alicePublic = await alice.getUserContact(alice.address)
        assert.deepEqual(alice.publicKeyBundle, alicePublic)
        const bobPublic = await bob.getUserContact(bob.address)
        assert.deepEqual(bob.publicKeyBundle, bobPublic)
      })

      it('user contacts are filtered to valid contacts', async () => {
        // publish bob's keys to alice's contact topic
        const bobPublic = bob.publicKeyBundle
        await alice.publishEnvelopes([
          {
            message: bobPublic.toBytes(),
            contentTopic: buildUserContactTopic(alice.address),
          },
        ])
        const alicePublic = await alice.getUserContact(alice.address)
        assert.deepEqual(alice.publicKeyBundle, alicePublic)
      })

      it('Check address can be sent to', async () => {
        const can_mesg_a = await alice.canMessage('NOT AN ADDRESS')
        assert.equal(can_mesg_a, false)

        const can_mesg_b = await alice.canMessage(bob.address)
        assert.equal(can_mesg_b, true)

        const lower = await alice.canMessage(bob.address.toLowerCase())
        assert.equal(lower, true)
      })
    })
  })
})

describe('bootstrapping', () => {
  let alice: Wallet

  beforeEach(async () => {
    alice = newWallet()
  })

  it('can bootstrap with a new wallet and persist the private key bundle', async () => {
    const client = await Client.create(alice, { env: 'local' })
    const manager = new NetworkKeyManager(
      alice,
      new TopicPersistence(client.apiClient)
    )
    const loadedBundle = await manager.loadPrivateKeyBundle()
    expect(loadedBundle).toBeInstanceOf(PrivateKeyBundleV1)
    expect(
      loadedBundle?.identityKey.publicKey.walletSignatureAddress()
    ).toEqual(alice.address)
  })

  it('fails to load if no valid keystore provider is available', async () => {
    expect(
      Client.create(alice, { env: 'local', keystoreProviders: [] })
    ).rejects.toThrow('No keystore providers available')
  })

  it('is able to bootstrap from the network', async () => {
    const opts: Partial<ClientOptions> = { env: 'local' }
    // Create with the default keystore providers to ensure bootstrapping
    const firstClient = await Client.create(alice, opts)

    const secondClient = await Client.create(alice, {
      ...opts,
      keystoreProviders: [new NetworkKeystoreProvider()],
    })
    expect(secondClient).toBeInstanceOf(Client)
    expect(secondClient.address).toEqual(firstClient.address)
  })

  it('is able to bootstrap from a predefined private key', async () => {
    const opts: Partial<ClientOptions> = { env: 'local' }
    const keys = await Client.getKeys(alice, opts)

    const client = await Client.create(null, {
      ...opts,
      privateKeyOverride: keys,
    })
    expect(client.address).toEqual(alice.address)
  })
})

describe('skipContactPublishing', () => {
  it('skips publishing when flag is set to true', async () => {
    const alice = newWallet()
    await Client.create(alice, { skipContactPublishing: true, env: 'local' })
    expect(await Client.canMessage(alice.address, { env: 'local' })).toBeFalsy()
  })

  it('publishes contact when flag is false', async () => {
    const alice = newWallet()
    await Client.create(alice, { skipContactPublishing: false, env: 'local' })
    expect(
      await Client.canMessage(alice.address, { env: 'local' })
    ).toBeTruthy()
  })
})

describe('encodeContent', () => {
  it('passes deflate compression option through properly', async function () {
    const c = await newLocalHostClient()
    const utf8Encode = new TextEncoder()
    const uncompressed = utf8Encode.encode('hello world '.repeat(20))

    const compressed = Uint8Array.from([
      10, 18, 10, 8, 120, 109, 116, 112, 46, 111, 114, 103, 18, 4, 116, 101,
      120, 116, 24, 1, 18, 17, 10, 8, 101, 110, 99, 111, 100, 105, 110, 103, 18,
      5, 85, 84, 70, 45, 56, 40, 0, 34, 45, 120, 1, 51, 52, 48, 209, 49, 52, 48,
      4, 98, 11, 8, 54, 52, 212, 49, 54, 2, 82, 150, 96, 166, 161, 161, 9, 84,
      202, 0, 44, 60, 170, 122, 84, 245, 168, 106, 218, 171, 6, 0, 139, 43, 173,
      229,
    ])

    const payload = await c.encodeContent(uncompressed, {
      compression: Compression.COMPRESSION_DEFLATE,
    })
    assert.deepEqual(Uint8Array.from(payload), compressed)
  })
})

describe('canMessage', () => {
  it('can confirm a user is on the network statically', async () => {
    const registeredClient = await newLocalHostClient()
    await waitForUserContact(registeredClient, registeredClient)
    const canMessageRegisteredClient = await Client.canMessage(
      registeredClient.address,
      {
        env: 'local',
      }
    )
    expect(canMessageRegisteredClient).toBeTruthy()

    const canMessageUnregisteredClient = await Client.canMessage(
      newWallet().address,
      { env: 'local' }
    )
    expect(canMessageUnregisteredClient).toBeFalsy()
  })
})

describe('canMessageBatch', () => {
  it('can confirm multiple users are on the network statically', async () => {
    // Create 10 registered clients
    const registeredClients = await Promise.all(
      Array.from({ length: 10 }, () => newLocalHostClient())
    )
    // Wait for all clients to be registered
    await Promise.all(
      registeredClients.map((client) => waitForUserContact(client, client))
    )
    // Now call canMessage with all of the peerAddresses
    const canMessageRegisteredClients = await Client.canMessage(
      registeredClients.map((client) => client.address),
      {
        env: 'local',
      }
    )
    // Expect all of the clients to be registered, so response should be all True
    expect(canMessageRegisteredClients).toEqual(
      registeredClients.map(() => true)
    )

    const canMessageUnregisteredClient = await Client.canMessage(
      [newWallet().address],
      { env: 'local' }
    )
    expect(canMessageUnregisteredClient).toEqual([false])
  })
})

describe('canMessageMultipleBatches', () => {
  it('can confirm many multiple users are on the network statically', async () => {
    const registeredClients = await Promise.all(
      Array.from({ length: 10 }, () => newLocalHostClient())
    )
    // Wait for all clients to be registered
    await Promise.all(
      registeredClients.map((client) => waitForUserContact(client, client))
    )
    // Repeat registeredClients 8 times to arrive at 80 addresses
    const initialPeerAddresses = registeredClients.map(
      (client) => client.address
    )
    const repeatedPeerAddresses: string[] = []
    for (let i = 0; i < 8; i++) {
      repeatedPeerAddresses.push(...initialPeerAddresses)
    }
    // Add 5 fake addresses
    repeatedPeerAddresses.push(
      ...Array.from(
        { length: 5 },
        () => '0x0000000000000000000000000000000000000000'
      )
    )

    // Now call canMessage with all of the peerAddresses
    const canMessageRegisteredClients = await Client.canMessage(
      repeatedPeerAddresses,
      {
        env: 'local',
      }
    )
    // Expect 80 True and 5 False
    expect(canMessageRegisteredClients).toEqual(
      Array.from({ length: 80 }, () => true).concat(
        Array.from({ length: 5 }, () => false)
      )
    )
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
        persistConversations: true,
      })
    })
  })
})

import assert from 'assert'
import {
  newWallet,
  newLocalHostClient,
  newDevClient,
  waitForUserContact,
  newLocalHostClientWithCustomWallet,
} from './helpers'
import { buildUserContactTopic } from '../src/utils'
import Client, { KeyStoreType, ClientOptions } from '../src/Client'

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
      beforeAll(async () => {
        alice = await testCase.newClient({ publishLegacyContact: true })
        bob = await testCase.newClient({ publishLegacyContact: true })
        await waitForUserContact(alice, alice)
        await waitForUserContact(bob, bob)
      })
      afterAll(async () => {
        if (alice) await alice.close()
        if (bob) await bob.close()
      })

      it('user contacts published', async () => {
        const alicePublic = await alice.getUserContact(alice.address)
        assert.deepEqual(alice.legacyKeys.getPublicKeyBundle(), alicePublic)
        const bobPublic = await bob.getUserContact(bob.address)
        assert.deepEqual(bob.legacyKeys.getPublicKeyBundle(), bobPublic)
      })

      it('user contacts are filtered to valid contacts', async () => {
        // publish bob's keys to alice's contact topic
        const bobPublic = bob.legacyKeys.getPublicKeyBundle()
        await alice.publishEnvelopes([
          {
            message: bobPublic.toBytes(),
            contentTopic: buildUserContactTopic(alice.address),
          },
        ])
        const alicePublic = await alice.getUserContact(alice.address)
        assert.deepEqual(alice.legacyKeys.getPublicKeyBundle(), alicePublic)
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
        keyStoreType: KeyStoreType.networkTopicStoreV1,
      })
    })
  })
})

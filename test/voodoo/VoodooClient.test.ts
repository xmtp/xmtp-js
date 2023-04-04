import assert from 'assert'
import { newWallet } from '../helpers'
import Client from '../../src/Client'

describe('VoodooClient', () => {
  it('can create a client', async () => {
    const alice = newWallet()
    const client = await Client.createVoodoo(alice, { env: 'local' })
    expect(client).toBeTruthy()
    // Check that client voodooInstance is truthy
    expect(client.voodooInstance).toBeTruthy()
  })
  it('can publish contact bundle and get it back', async () => {
    const alice = newWallet()
    // Client creation should publish the contact bundle
    const aliceClient = await Client.createVoodoo(alice, { env: 'local' })

    // Should get the contact bundle
    const aliceContactBundle = await aliceClient.getUserContactFromNetwork(
      alice.address
    )
    expect(aliceContactBundle).toBeTruthy()
  })
  it('can do a roundtrip with published contact bundles', async () => {
    const alice = newWallet()
    const bob = newWallet()
    const aliceClient = await Client.createVoodoo(alice, { env: 'local' })
    const bobClient = await Client.createVoodoo(bob, { env: 'local' })

    const aliceMessage = 'Hello Bob'
    // Have alice send a message to bob, starting the session and also encrypting it
    const outboundJson = await aliceClient.getOutboundSessionJson(
      // The VoodooContact is looked up from a topic
      bob.address,
      aliceMessage
    )

    // Have bob receive the initial message, starting the session and also decrypting it
    const bobInboundPlaintext = await bobClient.processInboundSessionJson(
      alice.address,
      outboundJson
    )

    expect(bobInboundPlaintext).toEqual(aliceMessage)
  })
})

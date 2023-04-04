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
  it('can do a roundtrip', async () => {
    const alice = newWallet()
    const bob = newWallet()
    const aliceClient = await Client.createVoodoo(alice, { env: 'local' })
    const bobClient = await Client.createVoodoo(bob, { env: 'local' })

    aliceClient.setContact(bobClient.contact)
    bobClient.setContact(aliceClient.contact)

    const aliceMessage = 'Hello Bob'
    // Have alice send a message to bob, starting the session and also encrypting it
    const outboundJson = await aliceClient.getOutboundSessionJson(
      bobClient.contact.address,
      aliceMessage
    )

    // Have bob receive the initial message, starting the session and also decrypting it
    const bobInboundPlaintext = await bobClient.processInboundSessionJson(
      aliceClient.contact.address,
      outboundJson
    )

    expect(bobInboundPlaintext).toEqual(aliceMessage)
  })
})

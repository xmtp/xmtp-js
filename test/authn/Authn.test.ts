import assert from 'assert'
import { pollFor, newLocalDockerClient, newWallet } from '../helpers'
import { Authenticator, AuthnResult } from '../../src/authn'
import { MockAuthnSender } from './helpers'
import { TestClient } from '../TestClient'
import { AuthenticationError } from '../../src/Client'

describe('Authenticator', () => {
  jest.setTimeout(10000)
  it('Integration Roundtrip', async () => {
    const clientA = await newLocalDockerClient()
    const clientB = await newLocalDockerClient()

    const contentMessage = 'ThisIsATest'
    clientA.sendMessage(clientB.address, contentMessage)

    const messages = await pollFor(
      async () => {
        const messages = await clientB.listIntroductionMessages()
        assert.equal(messages[0].content, contentMessage)
        return messages
      },
      5000,
      500
    )
  })

  it('Authn Cache', async () => {
    const clientA = await newLocalDockerClient()
    const sendMock = new MockAuthnSender(false)
    const authn = await Authenticator.create(
      clientA.waku.libp2p,
      clientA.keys.identityKey,
      { sender: sendMock }
    )
    let result: AuthnResult

    const remotePeerId = await clientA.waku.store.randomPeer
    assert.ok(remotePeerId)
    assert.equal(await authn.hasAuthenticated(remotePeerId.id), false)

    sendMock.setResponse(false)
    result = await authn.authenticate(remotePeerId.id)
    assert.equal(result.isAuthenticated, false)
    assert.equal(await authn.hasAuthenticated(remotePeerId.id), false)

    sendMock.setResponse(true)
    result = await authn.authenticate(remotePeerId.id)
    assert.equal(result.isAuthenticated, true)
    assert.equal(await authn.hasAuthenticated(remotePeerId.id), true)
  })
})

describe('Client Authentication Integration', () => {
  jest.setTimeout(49000)
  it('nominal ', async () => {
    const senderMock = new MockAuthnSender(true)
    const client = await TestClient.create(newWallet(), {
      authOpts: { sender: senderMock },
    })

    senderMock.setResponse(true)
    await client.sendMessage(client.address, 'msg')
  })

  it('startup failure', async () => {
    let client
    let wasErrorThrown = false

    try {
      const senderMock = new MockAuthnSender(false)
      client = await TestClient.create(newWallet(), {
        authOpts: { sender: senderMock },
      })
    } catch (e) {
      if (e instanceof AuthenticationError) {
        wasErrorThrown = true
      } else {
        throw e
      }
    }

    assert.equal(wasErrorThrown, true)
  })
})

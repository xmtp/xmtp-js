import assert from 'assert'
import { newWallet } from './helpers'
import { Message, PrivateKeyBundle } from '../src'

describe('Messaging', function () {
  it('fully encodes/decodes messages', async function () {
    const aliceWallet = newWallet()
    // Alice's key bundle
    const alice = await PrivateKeyBundle.generate(aliceWallet)
    const alicePub = alice.getPublicKeyBundle()
    assert.ok(alice.identityKey)
    assert.deepEqual(alice.identityKey.publicKey, alicePub.identityKey)
    // Bob's key bundle
    const bob = await PrivateKeyBundle.generate()

    // Alice encodes message for Bob
    const msg1 = await Message.encode(
      alice,
      bob.getPublicKeyBundle(),
      {
        sender: alice.getPublicKeyBundle(),
        recipient: bob.getPublicKeyBundle(),
        timestamp: new Date().getTime(),
      },
      'Yo!'
    )
    assert.equal(msg1.senderAddress(), aliceWallet.address)
    assert.equal(msg1.decrypted, 'Yo!')

    // Bob decodes message from Alice
    const msg2 = await Message.decode(bob, msg1.toBytes())
    assert.equal(msg1.decrypted, msg2.decrypted)
    assert.equal(msg2.senderAddress(), aliceWallet.address)
  })
})

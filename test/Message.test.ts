import assert from 'assert'
import { newWallet } from './helpers'
import { Message, PrivateKeyBundle } from '../src'
import { NoMatchingPreKeyError } from '../src/crypto/errors'
import { bytesToHex } from '../src/crypto/utils'
import { sha256 } from '../src/crypto/encryption'

describe('Message', function () {
  it('fully encodes/decodes messages', async function () {
    const aliceWallet = newWallet()
    // Alice's key bundle
    const alice = await PrivateKeyBundle.generate(aliceWallet)
    const alicePub = alice.getPublicKeyBundle()
    assert.ok(alice.identityKey)
    assert.deepEqual(alice.identityKey.publicKey, alicePub.identityKey)
    // Bob's key bundle
    const bob = await PrivateKeyBundle.generate(newWallet())
    const bobWalletAddress = bob
      .getPublicKeyBundle()
      .identityKey.walletSignatureAddress()

    // Alice encodes message for Bob
    const content = new TextEncoder().encode('Yo!')
    const msg1 = await Message.encode(
      alice,
      bob.getPublicKeyBundle(),
      content,
      new Date()
    )
    assert.equal(msg1.senderAddress, aliceWallet.address)
    assert.equal(msg1.recipientAddress, bobWalletAddress)
    assert.deepEqual(msg1.decrypted, content)

    // Bob decodes message from Alice
    const msg2 = await Message.decode(bob, msg1.toBytes())
    assert.deepEqual(msg1.decrypted, msg2.decrypted)
    assert.equal(msg2.senderAddress, aliceWallet.address)
    assert.equal(msg2.recipientAddress, bobWalletAddress)
  })

  it('undecodable returns with undefined decrypted value', async () => {
    const alice = await PrivateKeyBundle.generate(newWallet())
    const bob = await PrivateKeyBundle.generate(newWallet())
    const eve = await PrivateKeyBundle.generate(newWallet())
    const msg = await Message.encode(
      alice,
      bob.getPublicKeyBundle(),
      new TextEncoder().encode('hi'),
      new Date()
    )
    assert.ok(!msg.error)
    const eveDecoded = await Message.decode(eve, msg.toBytes())
    assert.equal(eveDecoded.decrypted, undefined)
    assert.deepEqual(eveDecoded.error, new NoMatchingPreKeyError())
  })

  it('senderAddress and recipientAddress throw errors without wallet', async () => {
    const alice = await PrivateKeyBundle.generate()
    const msg = await Message.encode(
      alice,
      alice.getPublicKeyBundle(),
      new TextEncoder().encode('hi'),
      new Date()
    )
    expect(() => {
      msg.senderAddress
    }).toThrow('key is not signed')
    expect(() => {
      msg.recipientAddress
    }).toThrow('key is not signed')
  })

  it('id returns bytes as hex string of sha256 hash', async () => {
    const alice = await PrivateKeyBundle.generate()
    const msg = await Message.encode(
      alice,
      alice.getPublicKeyBundle(),
      new TextEncoder().encode('hi'),
      new Date()
    )
    assert.equal(msg.id.length, 64)
    assert.equal(msg.id, bytesToHex(await sha256(msg.toBytes())))
  })
})

import assert from 'assert'
import { newWallet } from './helpers'
import { MessageV1 } from '../src/Message'
import { PrivateKeyBundleV1 } from '../src/crypto/PrivateKeyBundle'
import { NoMatchingPreKeyError } from '../src/crypto/errors'
import { bytesToHex } from '../src/crypto/utils'
import { sha256 } from '../src/crypto/encryption'

describe('Message', function () {
  it('fully encodes/decodes messages', async function () {
    const aliceWallet = newWallet()
    // Alice's key bundle
    const alice = await PrivateKeyBundleV1.generate(aliceWallet)
    const alicePub = alice.getPublicKeyBundle()
    assert.ok(alice.identityKey)
    assert.deepEqual(alice.identityKey.publicKey, alicePub.identityKey)
    // Bob's key bundle
    const bob = await PrivateKeyBundleV1.generate(newWallet())
    const bobWalletAddress = bob
      .getPublicKeyBundle()
      .identityKey.walletSignatureAddress()

    // Alice encodes message for Bob
    const content = new TextEncoder().encode('Yo!')
    const msg1 = await MessageV1.encode(
      alice,
      bob.getPublicKeyBundle(),
      content,
      new Date()
    )
    assert.equal(msg1.senderAddress, aliceWallet.address)
    assert.equal(msg1.recipientAddress, bobWalletAddress)
    const decrypted = await msg1.decrypt(alice)
    assert.deepEqual(decrypted, content)

    // Bob decodes message from Alice
    const msg2 = await MessageV1.fromBytes(msg1.toBytes())
    const msg2Decrypted = await msg2.decrypt(alice)
    assert.deepEqual(msg2Decrypted, decrypted)
    assert.equal(msg2.senderAddress, aliceWallet.address)
    assert.equal(msg2.recipientAddress, bobWalletAddress)
  })

  it('undecodable returns with undefined decrypted value', async () => {
    const alice = await PrivateKeyBundleV1.generate(newWallet())
    const bob = await PrivateKeyBundleV1.generate(newWallet())
    const eve = await PrivateKeyBundleV1.generate(newWallet())
    const msg = await MessageV1.encode(
      alice,
      bob.getPublicKeyBundle(),
      new TextEncoder().encode('hi'),
      new Date()
    )
    assert.ok(!msg.error)
    expect(msg.decrypt(eve)).rejects.toThrow(NoMatchingPreKeyError)
  })

  it('Message create throws error for sender without wallet', async () => {
    const alice = await PrivateKeyBundleV1.generate()
    const bob = await PrivateKeyBundleV1.generate(newWallet())
    expect(
      MessageV1.encode(
        alice,
        bob.getPublicKeyBundle(),
        new TextEncoder().encode('hi'),
        new Date()
      )
    ).rejects.toThrow('key is not signed')
  })

  it('recipientAddress throws error without wallet', async () => {
    const alice = await PrivateKeyBundleV1.generate(newWallet())
    const bob = await PrivateKeyBundleV1.generate()
    const msg = await MessageV1.encode(
      alice,
      bob.getPublicKeyBundle(),
      new TextEncoder().encode('hi'),
      new Date()
    )
    expect(() => {
      msg.recipientAddress
    }).toThrow('key is not signed')
  })

  it('id returns bytes as hex string of sha256 hash', async () => {
    const alice = await PrivateKeyBundleV1.generate(newWallet())
    const msg = await MessageV1.encode(
      alice,
      alice.getPublicKeyBundle(),
      new TextEncoder().encode('hi'),
      new Date()
    )
    assert.equal(msg.id.length, 64)
    assert.equal(msg.id, bytesToHex(await sha256(msg.toBytes())))
  })
})

import * as assert from 'assert'
import { TextEncoder, TextDecoder } from 'util'
import {
  PublicKeyBundle,
  PrivateKeyBundle,
  PrivateKey,
  utils,
  encrypt,
  decrypt,
} from '../../src/crypto'

describe('Crypto', function () {
  it('signs keys and verifies signatures', async function () {
    const identityKey = PrivateKey.generate()
    const preKey = PrivateKey.generate()
    await identityKey.signKey(preKey.publicKey)
    assert.ok(await identityKey.publicKey.verifyKey(preKey.publicKey))
  })
  it('encrypts and decrypts payload', async function () {
    const alice = PrivateKey.generate()
    const bob = PrivateKey.generate()
    const msg1 = 'Yo!'
    const decrypted = new TextEncoder().encode(msg1)
    // Alice encrypts msg for Bob.
    const encrypted = await alice.encrypt(decrypted, bob.publicKey)
    // Bob decrypts msg from Alice.
    const decrypted2 = await bob.decrypt(encrypted, alice.publicKey)
    const msg2 = new TextDecoder().decode(decrypted2)
    assert.equal(msg2, msg1)
  })
  it('detects tampering with encrypted message', async function () {
    const alice = PrivateKey.generate()
    const bob = PrivateKey.generate()
    const msg1 = 'Yo!'
    const decrypted = new TextEncoder().encode(msg1)
    // Alice encrypts msg for Bob.
    const encrypted = await alice.encrypt(decrypted, bob.publicKey)
    // Malory tampers with the message
    assert.ok(encrypted.aes256GcmHkdfSha256)
    encrypted.aes256GcmHkdfSha256.payload[2] ^= 4 // flip one bit
    // Bob attempts to decrypt msg from Alice.
    try {
      await bob.decrypt(encrypted, alice.publicKey)
      assert.fail('should have thrown')
    } catch (e) {
      // Note: This is Node behavior, not sure what browsers will do.
      assert.equal(e, 'Error: Cipher job failed')
    }
  })
  it('derives public key from signature', async function () {
    const pri = PrivateKey.generate()
    const digest = utils.getRandomValues(new Uint8Array(16))
    const sig = await pri.sign(digest)
    const sigPub = sig.getPublicKey(digest)
    assert.ok(sigPub)
    assert.ok(sigPub.secp256k1Uncompressed)
    assert.ok(pri.publicKey.secp256k1Uncompressed)
    assert.deepEqual(
      sigPub.secp256k1Uncompressed.bytes,
      pri.publicKey.secp256k1Uncompressed.bytes
    )
  })
  it('encrypts and decrypts payload with key bundles', async function () {
    const alice = await PrivateKeyBundle.generate()
    const bob = await PrivateKeyBundle.generate()
    const msg1 = 'Yo!'
    const decrypted = new TextEncoder().encode(msg1)
    // Alice encrypts msg for Bob.
    const alicePublic = alice.getPublicKeyBundle()
    const bobPublic = bob.getPublicKeyBundle()
    let secret = await alice.sharedSecret(bobPublic, alicePublic.preKey, false)
    const encrypted = await encrypt(decrypted, secret)
    // Bob decrypts msg from Alice.
    secret = await bob.sharedSecret(alicePublic, bobPublic.preKey, true)
    const decrypted2 = await decrypt(encrypted, secret)
    const msg2 = new TextDecoder().decode(decrypted2)
    assert.equal(msg2, msg1)
  })
  it('serializes and deserializes keys and signatures', async function () {
    const alice = await PrivateKeyBundle.generate()
    const bytes = alice.getPublicKeyBundle().toBytes()
    assert.ok(bytes.length >= 213)
    const pub2 = PublicKeyBundle.fromBytes(bytes)
    assert.ok(pub2.identityKey)
    assert.ok(pub2.preKey)
    assert.ok(pub2.identityKey.verifyKey(pub2.preKey))
  })
})

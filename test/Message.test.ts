import assert from 'assert'
import { keystore } from '@xmtp/proto'
import { newWallet } from './helpers'
import { decryptV1Message, encodeV1Message, MessageV1 } from '../src/Message'
import { PrivateKeyBundleV1 } from '../src/crypto/PrivateKeyBundle'
import { bytesToHex } from '../src/crypto/utils'
import { sha256 } from '../src/crypto/encryption'
import { InMemoryKeystore, InviteStore, KeystoreError } from '../src/keystore'

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
    const bobKeystore = new InMemoryKeystore(bob, new InviteStore())
    // Alice encodes message for Bob
    const content = new TextEncoder().encode('Yo!')
    const aliceKeystore = new InMemoryKeystore(alice, new InviteStore())

    const msg1 = await encodeV1Message(
      aliceKeystore,
      content,
      alicePub,
      bob.getPublicKeyBundle(),
      new Date()
    )

    assert.equal(msg1.senderAddress, aliceWallet.address)
    assert.equal(msg1.recipientAddress, bobWalletAddress)
    const decrypted = await decryptV1Message(
      aliceKeystore,
      msg1,
      alice.getPublicKeyBundle()
    )
    assert.deepEqual(decrypted, content)

    // // Bob decodes message from Alice
    const msg2 = await MessageV1.fromBytes(msg1.toBytes())
    const msg2Decrypted = await decryptV1Message(
      bobKeystore,
      msg2,
      bob.getPublicKeyBundle()
    )
    assert.deepEqual(msg2Decrypted, decrypted)
    assert.equal(msg2.senderAddress, aliceWallet.address)
    assert.equal(msg2.recipientAddress, bobWalletAddress)
  })

  it('undecodable returns with undefined decrypted value', async () => {
    const alice = await PrivateKeyBundleV1.generate(newWallet())
    const bob = await PrivateKeyBundleV1.generate(newWallet())
    const eve = await PrivateKeyBundleV1.generate(newWallet())
    const aliceKeystore = new InMemoryKeystore(alice, new InviteStore())
    const eveKeystore = new InMemoryKeystore(eve, new InviteStore())
    const msg = await encodeV1Message(
      aliceKeystore,
      new TextEncoder().encode('Hi'),
      alice.getPublicKeyBundle(),
      bob.getPublicKeyBundle(),
      new Date()
    )
    assert.ok(!msg.error)
    const eveResult = decryptV1Message(
      eveKeystore,
      msg,
      eve.getPublicKeyBundle()
    )
    expect(eveResult).rejects.toThrow(KeystoreError)
    // expect(eveResult).rejects.toThrow(
    //   new KeystoreError(
    //     keystore.ErrorCode.ERROR_CODE_NO_MATCHING_PREKEY,
    //     'No matching prekey'
    //   )
    // )
  })

  it('Message create throws error for sender without wallet', async () => {
    const alice = await PrivateKeyBundleV1.generate()
    const bob = await PrivateKeyBundleV1.generate(newWallet())
    const keystore = new InMemoryKeystore(bob, new InviteStore())

    expect(
      encodeV1Message(
        keystore,
        new TextEncoder().encode('hi'),
        alice.getPublicKeyBundle(),
        bob.getPublicKeyBundle(),
        new Date()
      )
    ).rejects.toThrow('key is not signed')
  })

  it('recipientAddress throws error without wallet', async () => {
    const alice = await PrivateKeyBundleV1.generate(newWallet())
    const bob = await PrivateKeyBundleV1.generate()
    const keystore = new InMemoryKeystore(alice, new InviteStore())
    const msg = await encodeV1Message(
      keystore,
      new TextEncoder().encode('hi'),
      alice.getPublicKeyBundle(),
      bob.getPublicKeyBundle(),
      new Date()
    )

    expect(() => {
      msg.recipientAddress
    }).toThrow('key is not signed')
  })

  it('id returns bytes as hex string of sha256 hash', async () => {
    const alice = await PrivateKeyBundleV1.generate(newWallet())
    const keystore = new InMemoryKeystore(alice, new InviteStore())
    const msg = await encodeV1Message(
      keystore,
      new TextEncoder().encode('hi'),
      alice.getPublicKeyBundle(),
      alice.getPublicKeyBundle(),
      new Date()
    )
    assert.equal(msg.id.length, 64)
    assert.equal(msg.id, bytesToHex(await sha256(msg.toBytes())))
  })
})

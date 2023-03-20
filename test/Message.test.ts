import assert from 'assert'
import { keystore } from '@xmtp/proto'
import { newWallet } from './helpers'
import { MessageV1 } from '../src/Message'
import { PrivateKeyBundleV1 } from '../src/crypto/PrivateKeyBundle'
import { bytesToHex } from '../src/crypto/utils'
import { sha256 } from '../src/crypto/encryption'
import { InMemoryKeystore, InviteStore, KeystoreError } from '../src/keystore'
import { Client, Signer } from '../src'
import { Wallet } from 'ethers'

describe('Message', function () {
  let aliceWallet: Wallet
  let bobWallet: Wallet
  let alice: PrivateKeyBundleV1
  let bob: PrivateKeyBundleV1

  beforeEach(async () => {
    aliceWallet = newWallet()
    bobWallet = newWallet()
    alice = await PrivateKeyBundleV1.generate(aliceWallet)
    bob = await PrivateKeyBundleV1.generate(bobWallet)
  })
  it('fully encodes/decodes messages', async function () {
    // Alice's key bundle
    const alicePub = alice.getPublicKeyBundle()
    assert.ok(alice.identityKey)
    assert.deepEqual(alice.identityKey.publicKey, alicePub.identityKey)

    const bobWalletAddress = bob
      .getPublicKeyBundle()
      .identityKey.walletSignatureAddress()
    const bobKeystore = new InMemoryKeystore(bob, new InviteStore())
    // Alice encodes message for Bob
    const content = new TextEncoder().encode('Yo!')
    const aliceKeystore = new InMemoryKeystore(alice, new InviteStore())

    const msg1 = await MessageV1.encode(
      aliceKeystore,
      content,
      alicePub,
      bob.getPublicKeyBundle(),
      new Date()
    )

    assert.equal(msg1.senderAddress, aliceWallet.address)
    assert.equal(msg1.recipientAddress, bobWalletAddress)
    const decrypted = await msg1.decrypt(
      aliceKeystore,
      alice.getPublicKeyBundle()
    )
    assert.deepEqual(decrypted, content)

    // Bob decodes message from Alice
    const msg2 = await MessageV1.fromBytes(msg1.toBytes())
    const msg2Decrypted = await msg2.decrypt(
      bobKeystore,
      bob.getPublicKeyBundle()
    )
    assert.deepEqual(msg2Decrypted, decrypted)
    assert.equal(msg2.senderAddress, aliceWallet.address)
    assert.equal(msg2.recipientAddress, bobWalletAddress)
  })

  it('undecodable returns with undefined decrypted value', async () => {
    const eve = await PrivateKeyBundleV1.generate(newWallet())
    const aliceKeystore = new InMemoryKeystore(alice, new InviteStore())
    const eveKeystore = new InMemoryKeystore(eve, new InviteStore())
    const msg = await MessageV1.encode(
      aliceKeystore,
      new TextEncoder().encode('Hi'),
      alice.getPublicKeyBundle(),
      bob.getPublicKeyBundle(),
      new Date()
    )
    assert.ok(!msg.error)
    const eveResult = msg.decrypt(eveKeystore, eve.getPublicKeyBundle())
    expect(eveResult).rejects.toThrow(KeystoreError)
  })

  it('Message create throws error for sender without wallet', async () => {
    const amal = await PrivateKeyBundleV1.generate()
    const keystore = new InMemoryKeystore(bob, new InviteStore())

    expect(
      MessageV1.encode(
        keystore,
        new TextEncoder().encode('hi'),
        amal.getPublicKeyBundle(),
        bob.getPublicKeyBundle(),
        new Date()
      )
    ).rejects.toThrow('key is not signed')
  })

  it('recipientAddress throws error without wallet', async () => {
    const charlie = await PrivateKeyBundleV1.generate()
    const keystore = new InMemoryKeystore(alice, new InviteStore())
    const msg = await MessageV1.encode(
      keystore,
      new TextEncoder().encode('hi'),
      alice.getPublicKeyBundle(),
      charlie.getPublicKeyBundle(),
      new Date()
    )

    expect(() => {
      msg.recipientAddress
    }).toThrow('key is not signed')
  })

  it('id returns bytes as hex string of sha256 hash', async () => {
    const keystore = new InMemoryKeystore(alice, new InviteStore())
    const msg = await MessageV1.encode(
      keystore,
      new TextEncoder().encode('hi'),
      alice.getPublicKeyBundle(),
      alice.getPublicKeyBundle(),
      new Date()
    )
    assert.equal(msg.id.length, 64)
    assert.equal(msg.id, bytesToHex(await sha256(msg.toBytes())))
  })

  it('serializes and deserializes text messages', async () => {
    const data = new TextEncoder().encode('hi')
    const aliceClient = await Client.create(aliceWallet, {
      privateKeyOverride: alice.encode(),
    })
    const payload = await aliceClient.encodeContent(data)
    const timestamp = new Date()

    const message = await MessageV1.encode(
      aliceClient.keystore,
      payload,
      alice.getPublicKeyBundle(),
      bob.getPublicKeyBundle(),
      timestamp
    )
  })
})

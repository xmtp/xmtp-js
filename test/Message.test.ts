import { ConversationV1 } from './../src/conversations/Conversation'
import assert from 'assert'
import { keystore } from '@xmtp/proto'
import { newWallet } from './helpers'
import { MessageV1, DecodedMessage } from '../src/Message'
import { PrivateKeyBundleV1 } from '../src/crypto/PrivateKeyBundle'
import { bytesToHex, equalBytes } from '../src/crypto/utils'
import { sha256 } from '../src/crypto/encryption'
import { InMemoryKeystore, InviteStore, KeystoreError } from '../src/keystore'
import { Client, ContentTypeText, Signer } from '../src'
import { Wallet } from 'ethers'
import { ContentTypeTestKey, TestKeyCodec } from './ContentTypeTestKey'

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

  describe('DecodedMessage', () => {
    it('round trips V1 text messages', async () => {
      const text = 'hi bob'
      const aliceClient = await Client.create(aliceWallet, {
        env: 'local',
        privateKeyOverride: alice.encode(),
      })
      const payload = await aliceClient.encodeContent(text)
      const timestamp = new Date()
      const sender = alice.getPublicKeyBundle()
      const recipient = bob.getPublicKeyBundle()

      const message = await MessageV1.encode(
        aliceClient.keystore,
        payload,
        sender,
        recipient,
        timestamp
      )

      const decodedMessage = DecodedMessage.fromV1Message(
        message,
        text,
        ContentTypeText,
        payload,
        'foo',
        new ConversationV1(
          aliceClient,
          bob.identityKey.publicKey.walletSignatureAddress(),
          new Date()
        )
      )

      const messageBytes = decodedMessage.toBytes()
      expect(messageBytes).toBeDefined()

      const restoredDecodedMessage = await DecodedMessage.fromBytes(
        messageBytes,
        aliceClient
      )
      expect(restoredDecodedMessage.toBytes()).toEqual(messageBytes)
      expect(restoredDecodedMessage.content).toEqual(text)
      expect(restoredDecodedMessage).toEqual(decodedMessage)
    })

    it('round trips V2 text messages', async () => {
      const aliceClient = await Client.create(aliceWallet, {
        env: 'local',
        privateKeyOverride: alice.encode(),
      })

      const bobClient = await Client.create(bobWallet, {
        env: 'local',
        privateKeyOverride: bob.encode(),
      })

      const convo = await aliceClient.conversations.newConversation(
        bobClient.address
      )
      const text = 'hi bob'
      const sentMessage = await convo.send(text)

      const sentMessageBytes = sentMessage.toBytes()
      expect(sentMessageBytes).toBeDefined()

      const restoredDecodedMessage = await DecodedMessage.fromBytes(
        sentMessageBytes,
        aliceClient
      )
      expect(restoredDecodedMessage.toBytes()).toEqual(sentMessageBytes)
      expect(restoredDecodedMessage.content).toEqual(text)
      expect(restoredDecodedMessage).toEqual(sentMessage)
    })

    it('round trips messages with custom content types', async () => {
      // Alice has the custom codec and bob does not
      const aliceClient = await Client.create(aliceWallet, {
        codecs: [new TestKeyCodec()],
        env: 'local',
        privateKeyOverride: alice.encode(),
      })

      const bobClient = await Client.create(bobWallet, {
        env: 'local',
        privateKeyOverride: bob.encode(),
      })

      const convo = await aliceClient.conversations.newConversation(
        bobClient.address
      )

      const msg = alice.identityKey.publicKey
      const fallback = 'publickey bundle'
      const sentMessage = await convo.send(msg, {
        contentType: ContentTypeTestKey,
        contentFallback: fallback,
      })
      expect(sentMessage.contentType).toEqual(ContentTypeTestKey)

      const sentMessageBytes = sentMessage.toBytes()

      const aliceRestoredMessage = await DecodedMessage.fromBytes(
        sentMessageBytes,
        aliceClient
      )
      expect(
        equalBytes(
          aliceRestoredMessage.content?.secp256k1Uncompressed.bytes,
          msg.secp256k1Uncompressed.bytes
        )
      ).toBeTruthy()
      expect(aliceRestoredMessage.contentType).toEqual(ContentTypeTestKey)

      const bobRestoredMessage = await DecodedMessage.fromBytes(
        sentMessageBytes,
        bobClient
      )
      expect(bobRestoredMessage.error).toBeTruthy()
      expect(bobRestoredMessage.content).toEqual(fallback)
    })
  })
})

import { shuffleArray } from './../helpers'
import { InvitationContext } from './../../src/Invitation'
import { toNanoString } from './../../src/utils'
import { DecryptV1Request } from './../../src/keystore/interfaces'
import { MessageV1 } from './../../src/Message'
import { Wallet } from 'ethers'
import {
  PrivateKeyBundleV1,
  PublicKeyBundle,
  SignedPublicKeyBundle,
  PrivateKeyBundleV2,
} from '../../src/crypto'
import { decryptV1 } from '../../src/keystore/encryption'
import { KeystoreError } from '../../src/keystore/errors'
import InMemoryKeystore from '../../src/keystore/InMemoryKeystore'
import { equalBytes } from '../../src/crypto/utils'
import { InvitationV1, SealedInvitation } from '../../src/Invitation'
import { fetcher } from '@xmtp/proto'
import { buildEnvelope, newWallet } from '../helpers'

const { b64Encode } = fetcher

describe('InMemoryKeystore', () => {
  let aliceKeys: PrivateKeyBundleV1
  let aliceKeystore: InMemoryKeystore
  let bobKeys: PrivateKeyBundleV1
  let bobKeystore: InMemoryKeystore

  beforeEach(async () => {
    aliceKeys = await PrivateKeyBundleV1.generate(newWallet())
    aliceKeystore = new InMemoryKeystore(aliceKeys)
    bobKeys = await PrivateKeyBundleV1.generate(newWallet())
    bobKeystore = new InMemoryKeystore(bobKeys)
  })

  const buildInvite = async (context?: InvitationContext) => {
    const invite = InvitationV1.createRandom(context)
    const created = new Date()
    const sealed = await SealedInvitation.createV1({
      sender: PrivateKeyBundleV2.fromLegacyBundle(aliceKeys),
      recipient: SignedPublicKeyBundle.fromLegacyBundle(
        bobKeys.getPublicKeyBundle()
      ),
      invitation: invite,
      created,
    })

    return { invite, created, sealed }
  }

  describe('encryptV1', () => {
    it('can encrypt a batch of valid messages', async () => {
      const messages = Array.from({ length: 10 }, (v: unknown, i: number) =>
        new TextEncoder().encode(`message ${i}`)
      )

      const headerBytes = new Uint8Array(10)

      const req = messages.map((msg) => ({
        recipient: bobKeys.getPublicKeyBundle(),
        payload: msg,
        headerBytes,
      }))

      const res = await aliceKeystore.encryptV1(req)
      expect(res).toHaveLength(req.length)
      for (const item of res) {
        if ('error' in item) {
          throw new Error(item.error)
        }
        expect(item).toHaveProperty('ciphertext')
        expect(item.ciphertext.aes256GcmHkdfSha256?.gcmNonce).toBeTruthy()
        expect(item.ciphertext.aes256GcmHkdfSha256?.hkdfSalt).toBeTruthy()
        expect(item.ciphertext.aes256GcmHkdfSha256?.payload).toBeTruthy()

        // Ensure decryption doesn't throw
        await decryptV1(
          aliceKeys,
          bobKeys.getPublicKeyBundle(),
          item.ciphertext,
          headerBytes,
          true
        )
      }
    })

    it('fails to encrypt with invalid params', async () => {
      const req = [
        {
          recipient: {},
          payload: new Uint8Array(10),
          headerBytes: new Uint8Array(10),
        },
      ]

      // @ts-expect-error
      const res = await aliceKeystore.encryptV1(req)

      expect(res).toHaveLength(req.length)
      expect(res[0]).toHaveProperty('error')
      expect(res[0]).toHaveProperty('code')
      expect(res[0]).toBeInstanceOf(KeystoreError)
    })
  })

  describe('decryptV1', () => {
    it('can decrypt a valid message', async () => {
      const msg = new TextEncoder().encode('Hello, world!')
      const peerKeys = bobKeys.getPublicKeyBundle()
      const message = await MessageV1.encode(
        aliceKeys,
        peerKeys,
        msg,
        new Date()
      )

      const req: DecryptV1Request[] = [
        {
          payload: message.ciphertext,
          peerKeys,
          headerBytes: message.headerBytes,
          isSender: true,
        },
      ]

      const res = await aliceKeystore.decryptV1(req)

      expect(res).toHaveLength(req.length)
      if ('error' in res[0]) {
        throw res[0]
      }
      expect(equalBytes(res[0].decrypted, msg)).toBe(true)
    })

    it('fails to decrypt an invalid message', async () => {
      const msg = new TextEncoder().encode('Hello, world!')
      const charlieKeys = await PrivateKeyBundleV1.generate(newWallet())
      const message = await MessageV1.encode(
        aliceKeys,
        charlieKeys.getPublicKeyBundle(),
        msg,
        new Date()
      )

      const req: DecryptV1Request[] = [
        {
          payload: message.ciphertext,
          peerKeys: bobKeys.getPublicKeyBundle(),
          headerBytes: message.headerBytes,
          isSender: true,
        },
      ]

      const res = await aliceKeystore.decryptV1(req)

      expect(res).toHaveLength(req.length)

      if (!('error' in res[0])) {
        throw new Error('should have errored')
      }
      expect(res[0]).toHaveProperty('error')
    })
  })

  describe('createInvite', () => {
    it('creates a valid invite with no context', async () => {
      const recipient = SignedPublicKeyBundle.fromLegacyBundle(
        bobKeys.getPublicKeyBundle()
      )
      const createdAt = new Date()
      const response = await aliceKeystore.createInvite({
        recipient,
        createdAt,
      })

      expect(response.conversation.topic).toBeTruthy()
      expect(response.conversation.context).toBeUndefined()
      expect(response.conversation.createdAt.getTime()).toEqual(
        createdAt.getTime()
      )
      expect(response.payload).toBeInstanceOf(Uint8Array)
    })

    it('creates a valid invite with context', async () => {
      const recipient = SignedPublicKeyBundle.fromLegacyBundle(
        bobKeys.getPublicKeyBundle()
      )
      const createdAt = new Date()
      const context = { conversationId: 'xmtp.org/foo', metadata: {} }
      const response = await aliceKeystore.createInvite({
        recipient,
        createdAt,
        context,
      })

      expect(response.conversation.topic).toBeTruthy()
      expect(response.conversation.context).toEqual(context)
    })

    it('throws if an invalid recipient is included', async () => {
      const createdAt = new Date()
      expect(async () => {
        await aliceKeystore.createInvite({
          recipient: {} as any,
          createdAt,
        })
      }).rejects.toThrow(KeystoreError)
    })
  })

  describe('saveInvites', () => {
    it('can save a batch of valid envelopes', async () => {
      const { invite, created, sealed } = await buildInvite()

      const sealedBytes = sealed.toBytes()
      const envelope = buildEnvelope(sealedBytes, 'foo', created)
      const response = await bobKeystore.saveInvites([envelope])

      expect(response).toHaveLength(1)
      const firstResult = response[0]
      if ('error' in firstResult) {
        throw firstResult
      }
      expect(firstResult.createdAt.getTime()).toEqual(created.getTime())
      expect(firstResult.topic).toEqual(invite.topic)
      expect(firstResult.context).toBeUndefined()

      const conversations = await bobKeystore.getV2Conversations()
      expect(conversations).toHaveLength(1)
      expect(conversations[0].topic).toBe(invite.topic)
    })

    it('can save received invites', async () => {
      const { invite, created, sealed } = await buildInvite()

      const sealedBytes = sealed.toBytes()
      const envelope = buildEnvelope(sealedBytes, 'foo', created)

      const [aliceResponse] = await aliceKeystore.saveInvites([envelope])
      if ('error' in aliceResponse) {
        throw aliceResponse
      }

      const aliceConversations = await aliceKeystore.getV2Conversations()
      expect(aliceConversations).toHaveLength(1)

      const [bobResponse] = await bobKeystore.saveInvites([envelope])
      if ('error' in bobResponse) {
        throw bobResponse
      }

      const bobConversations = await bobKeystore.getV2Conversations()
      expect(bobConversations).toHaveLength(1)
    })

    it('ignores bad envelopes', async () => {
      const conversationId = 'xmtp.org/foo'
      const { invite, created, sealed } = await buildInvite({
        conversationId,
        metadata: {},
      })
      const envelopes = [
        buildEnvelope(new Uint8Array(10), 'bar', new Date()),
        buildEnvelope(sealed.toBytes(), 'foo', created),
      ]

      const response = await bobKeystore.saveInvites(envelopes)
      expect(response).toHaveLength(2)

      const [firstResult, secondResult] = response
      if (!('error' in firstResult)) {
        fail('should have errored')
      }
      expect(firstResult).toBeInstanceOf(KeystoreError)

      if ('error' in secondResult) {
        fail('should not have errored')
      }
      expect(secondResult.createdAt.getTime()).toEqual(created.getTime())
      expect(secondResult.topic).toEqual(invite.topic)
      expect(secondResult.context?.conversationId).toEqual(conversationId)
    })
  })

  describe('encryptV2/decryptV2', () => {
    it('encrypts using a saved envelope', async () => {
      const { invite, created, sealed } = await buildInvite()

      const sealedBytes = sealed.toBytes()
      const envelope = buildEnvelope(sealedBytes, 'foo', created)
      await aliceKeystore.saveInvites([envelope])

      const message = new TextEncoder().encode('Hello, world!')
      const headerBytes = new Uint8Array(10)

      const [encrypted] = await aliceKeystore.encryptV2([
        {
          contentTopic: invite.topic,
          message,
          headerBytes,
        },
      ])

      if ('error' in encrypted) {
        throw encrypted
      }

      expect(encrypted.ciphertext).toBeTruthy()
    })

    it('round trips using a created invite', async () => {
      const recipient = SignedPublicKeyBundle.fromLegacyBundle(
        bobKeys.getPublicKeyBundle()
      )
      const createdAt = new Date()
      const response = await aliceKeystore.createInvite({
        recipient,
        createdAt,
      })

      const message = new TextEncoder().encode('Hello, world!')
      const headerBytes = new Uint8Array(10)

      const [encrypted] = await aliceKeystore.encryptV2([
        {
          contentTopic: response.conversation.topic,
          message,
          headerBytes,
        },
      ])

      if ('error' in encrypted) {
        throw encrypted
      }

      expect(encrypted.ciphertext).toBeTruthy()

      const [decrypted] = await aliceKeystore.decryptV2([
        {
          payload: encrypted.ciphertext,
          headerBytes,
          contentTopic: response.conversation.topic,
        },
      ])

      if ('error' in decrypted) {
        throw decrypted
      }

      expect(equalBytes(message, decrypted.decrypted)).toBeTruthy()
    })
  })

  describe('getV2Conversations', () => {
    it('correctly sorts conversations', async () => {
      const recipient = SignedPublicKeyBundle.fromLegacyBundle(
        bobKeys.getPublicKeyBundle()
      )
      const baseTime = new Date()
      const timestamps = Array.from(
        { length: 25 },
        (_, i) => new Date(baseTime.getTime() + i)
      )

      // Shuffle the order they go into the store
      const shuffled = [...timestamps].sort(() => Math.random() - 0.5)

      const invites = Promise.all(
        shuffled.map((createdAt) => {
          return aliceKeystore.createInvite({
            recipient,
            createdAt,
          })
        })
      )

      const convos = await aliceKeystore.getV2Conversations()
      for (let i = 0; i < convos.length; i++) {
        expect(convos[i].createdAt.getTime()).toEqual(timestamps[i].getTime())
      }
    })
  })

  describe('getPublicKeyBundle', () => {
    it('can retrieve a valid bundle', async () => {
      const bundle = await aliceKeystore.getPublicKeyBundle()
      const wrappedBundle = new SignedPublicKeyBundle(bundle)
      expect(
        wrappedBundle.equals(
          SignedPublicKeyBundle.fromLegacyBundle(aliceKeys.getPublicKeyBundle())
        )
      )
    })
  })

  describe('getWalletAddress', () => {
    it('returns the wallet address', async () => {
      const aliceAddress = aliceKeys
        .getPublicKeyBundle()
        .walletSignatureAddress()
      const returnedAddress = await aliceKeystore.getWalletAddress()

      expect(aliceAddress).toEqual(returnedAddress)
    })
  })
})

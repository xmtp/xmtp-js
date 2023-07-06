import { keystore } from '@xmtp/proto'
import { randomBytes } from './../../bench/helpers'
import { InvitationContext } from './../../src/Invitation'
import { MessageV1 } from './../../src/Message'
import {
  PrivateKeyBundleV1,
  SignedPublicKeyBundle,
  PrivateKeyBundleV2,
} from '../../src/crypto'
import { decryptV1 } from '../../src/keystore/encryption'
import { KeystoreError } from '../../src/keystore/errors'
import InMemoryKeystore from '../../src/keystore/InMemoryKeystore'
import { equalBytes } from '../../src/crypto/utils'
import { InvitationV1, SealedInvitation } from '../../src/Invitation'
import { buildProtoEnvelope, newWallet } from '../helpers'
import { dateToNs, nsToDate } from '../../src/utils/date'
import { LocalStoragePersistence } from '../../src/keystore/persistence'
import Token from '../../src/authn/Token'
import Long from 'long'
import { CreateInviteResponse } from '@xmtp/proto/ts/dist/types/keystore_api/v1/keystore.pb'

describe('InMemoryKeystore', () => {
  let aliceKeys: PrivateKeyBundleV1
  let aliceKeystore: InMemoryKeystore
  let aliceKeystoreWithPersistence: InMemoryKeystore
  let bobKeys: PrivateKeyBundleV1
  let bobKeystore: InMemoryKeystore

  beforeEach(async () => {
    aliceKeys = await PrivateKeyBundleV1.generate(newWallet())
    aliceKeystore = await InMemoryKeystore.create(aliceKeys)
    aliceKeystoreWithPersistence = await InMemoryKeystore.create(
      aliceKeys,
      new LocalStoragePersistence()
    )
    bobKeys = await PrivateKeyBundleV1.generate(newWallet())
    bobKeystore = await InMemoryKeystore.create(bobKeys)
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

      const res = await aliceKeystore.encryptV1({ requests: req })
      expect(res.responses).toHaveLength(req.length)
      for (const { error, result } of res.responses) {
        if (error || !result) {
          throw error
        }
        const encrypted = result!.encrypted
        if (!encrypted) {
          throw new Error('No encrypted result')
        }

        expect(result.encrypted?.aes256GcmHkdfSha256?.gcmNonce).toBeTruthy()
        expect(result.encrypted?.aes256GcmHkdfSha256?.hkdfSalt).toBeTruthy()
        expect(result.encrypted?.aes256GcmHkdfSha256?.payload).toBeTruthy()
        // Ensure decryption doesn't throw
        await decryptV1(
          aliceKeys,
          bobKeys.getPublicKeyBundle(),
          encrypted,
          headerBytes,
          true
        )
      }
    })

    it('fails to encrypt with invalid params', async () => {
      const requests = [
        {
          recipient: {},
          payload: new Uint8Array(10),
          headerBytes: new Uint8Array(10),
        },
      ]

      // @ts-expect-error
      const res = await aliceKeystore.encryptV1({ requests })

      expect(res.responses).toHaveLength(requests.length)
      expect(res.responses[0]).toHaveProperty('error')
      expect(res.responses[0].error).toHaveProperty('code')
    })
  })

  describe('decryptV1', () => {
    it('can decrypt a valid message', async () => {
      const msg = new TextEncoder().encode('Hello, world!')
      const peerKeys = bobKeys.getPublicKeyBundle()
      const message = await MessageV1.encode(
        aliceKeystore,
        msg,
        aliceKeys.getPublicKeyBundle(),
        peerKeys,
        new Date()
      )

      const requests = [
        {
          payload: message.ciphertext,
          peerKeys,
          headerBytes: message.headerBytes,
          isSender: true,
        },
      ]

      const { responses } = await aliceKeystore.decryptV1({ requests })

      expect(responses).toHaveLength(requests.length)
      if (responses[0].error) {
        throw responses[0].error
      }

      expect(equalBytes(responses[0]!.result!.decrypted, msg)).toBe(true)
    })

    it('fails to decrypt an invalid message', async () => {
      const msg = new TextEncoder().encode('Hello, world!')
      const charlieKeys = await PrivateKeyBundleV1.generate(newWallet())
      const message = await MessageV1.encode(
        bobKeystore,
        msg,
        bobKeys.getPublicKeyBundle(),
        charlieKeys.getPublicKeyBundle(),
        new Date()
      )

      const requests = [
        {
          payload: message.ciphertext,
          peerKeys: bobKeys.getPublicKeyBundle(),
          headerBytes: message.headerBytes,
          isSender: true,
        },
      ]

      const { responses } = await aliceKeystore.decryptV1({ requests })

      expect(responses).toHaveLength(requests.length)

      if (!responses[0].error) {
        throw new Error('should have errored')
      }
    })
  })

  describe('createInvite', () => {
    it('creates a valid invite with no context', async () => {
      const recipient = SignedPublicKeyBundle.fromLegacyBundle(
        bobKeys.getPublicKeyBundle()
      )
      const createdNs = dateToNs(new Date())
      const response = await aliceKeystore.createInvite({
        recipient,
        createdNs,
        context: undefined,
      })

      expect(response.conversation?.topic).toBeTruthy()
      expect(response.conversation?.context).toBeUndefined()
      expect(response.conversation?.createdNs.equals(createdNs)).toBeTruthy()
      expect(response.payload).toBeInstanceOf(Uint8Array)
    })

    it('creates a valid invite with context', async () => {
      const recipient = SignedPublicKeyBundle.fromLegacyBundle(
        bobKeys.getPublicKeyBundle()
      )
      const createdNs = dateToNs(new Date())
      const context = { conversationId: 'xmtp.org/foo', metadata: {} }
      const response = await aliceKeystore.createInvite({
        recipient,
        createdNs,
        context,
      })

      expect(response.conversation?.topic).toBeTruthy()
      expect(response.conversation?.context).toEqual(context)
    })

    it('throws if an invalid recipient is included', async () => {
      const createdNs = dateToNs(new Date())
      expect(async () => {
        await aliceKeystore.createInvite({
          recipient: {} as any,
          createdNs,
          context: undefined,
        })
      }).rejects.toThrow(KeystoreError)
    })
  })

  describe('saveInvites', () => {
    it('can save a batch of valid envelopes', async () => {
      for (const keystore of [aliceKeystore, aliceKeystoreWithPersistence]) {
        const { invite, created, sealed } = await buildInvite()

        const sealedBytes = sealed.toBytes()
        const envelope = buildProtoEnvelope(sealedBytes, 'foo', created)
        const { responses } = await keystore.saveInvites({
          requests: [envelope],
        })

        expect(responses).toHaveLength(1)
        const firstResult = responses[0]
        if (firstResult.error) {
          throw firstResult.error
        }
        expect(
          nsToDate(firstResult.result!.conversation!.createdNs).getTime()
        ).toEqual(created.getTime())
        expect(firstResult.result!.conversation!.topic).toEqual(invite.topic)
        expect(firstResult.result!.conversation?.context).toBeUndefined()

        const conversations = (await keystore.getV2Conversations())
          .conversations
        expect(conversations).toHaveLength(1)
        expect(conversations[0].topic).toBe(invite.topic)
      }
    })

    it('can save received invites', async () => {
      const { created, sealed } = await buildInvite()

      const sealedBytes = sealed.toBytes()
      const envelope = buildProtoEnvelope(sealedBytes, 'foo', created)

      const {
        responses: [aliceResponse],
      } = await aliceKeystore.saveInvites({
        requests: [envelope],
      })
      if (aliceResponse.error) {
        throw aliceResponse
      }

      const aliceConversations = (await aliceKeystore.getV2Conversations())
        .conversations
      expect(aliceConversations).toHaveLength(1)

      const {
        responses: [bobResponse],
      } = await bobKeystore.saveInvites({ requests: [envelope] })
      if (bobResponse.error) {
        throw bobResponse
      }

      const bobConversations = (await bobKeystore.getV2Conversations())
        .conversations
      expect(bobConversations).toHaveLength(1)
    })

    it('ignores bad envelopes', async () => {
      const conversationId = 'xmtp.org/foo'
      const { invite, created, sealed } = await buildInvite({
        conversationId,
        metadata: {},
      })
      const envelopes = [
        buildProtoEnvelope(new Uint8Array(10), 'bar', new Date()),
        buildProtoEnvelope(sealed.toBytes(), 'foo', created),
      ]

      const response = await bobKeystore.saveInvites({ requests: envelopes })
      expect(response.responses).toHaveLength(2)

      const {
        responses: [firstResult, secondResult],
      } = response

      if (!firstResult.error) {
        fail('should have errored')
      }
      expect(firstResult.error.code).toBeTruthy()

      if (secondResult.error) {
        fail('should not have errored')
      }

      expect(
        secondResult.result?.conversation?.createdNs.equals(dateToNs(created))
      ).toBeTruthy()
      expect(secondResult.result?.conversation?.topic).toEqual(invite.topic)
      expect(
        secondResult.result?.conversation?.context?.conversationId
      ).toEqual(conversationId)
    })
  })

  describe('encryptV2/decryptV2', () => {
    it('encrypts using a saved envelope', async () => {
      for (const keystore of [aliceKeystore, aliceKeystoreWithPersistence]) {
        const { invite, created, sealed } = await buildInvite()

        const sealedBytes = sealed.toBytes()
        const envelope = buildProtoEnvelope(sealedBytes, 'foo', created)
        await keystore.saveInvites({ requests: [envelope] })

        const payload = new TextEncoder().encode('Hello, world!')
        const headerBytes = new Uint8Array(10)

        const {
          responses: [encrypted],
        } = await keystore.encryptV2({
          requests: [
            {
              contentTopic: invite.topic,
              payload,
              headerBytes,
            },
          ],
        })

        if (encrypted.error) {
          throw encrypted
        }

        expect(encrypted.result?.encrypted).toBeTruthy()
      }
    })

    it('round trips using a created invite', async () => {
      const recipient = SignedPublicKeyBundle.fromLegacyBundle(
        bobKeys.getPublicKeyBundle()
      )
      const createdNs = dateToNs(new Date())
      const response = await aliceKeystore.createInvite({
        recipient,
        createdNs,
        context: undefined,
      })

      const payload = new TextEncoder().encode('Hello, world!')
      const headerBytes = new Uint8Array(10)

      const {
        responses: [encrypted],
      } = await aliceKeystore.encryptV2({
        requests: [
          {
            contentTopic: response.conversation!.topic,
            payload,
            headerBytes,
          },
        ],
      })

      if (encrypted.error) {
        throw encrypted.error
      }

      expect(encrypted.result?.encrypted).toBeTruthy()

      const {
        responses: [decrypted],
      } = await aliceKeystore.decryptV2({
        requests: [
          {
            payload: encrypted.result?.encrypted,
            headerBytes,
            contentTopic: response.conversation!.topic,
          },
        ],
      })

      if (decrypted.error) {
        throw decrypted.error
      }

      expect(equalBytes(payload, decrypted.result!.decrypted)).toBeTruthy()
    })
  })

  describe('SignDigest', () => {
    it('signs a valid digest with the identity key', async () => {
      const digest = randomBytes(32)
      const signature = await aliceKeystore.signDigest({
        digest,
        identityKey: true,
        prekeyIndex: undefined,
      })
      expect(signature).toEqual(await aliceKeys.identityKey.sign(digest))
    })

    it('rejects an invalid digest', async () => {
      const digest = new Uint8Array(0)
      await expect(
        aliceKeystore.signDigest({
          digest,
          identityKey: true,
          prekeyIndex: undefined,
        })
      ).rejects.toThrow()
    })

    it('signs a valid digest with a specified prekey', async () => {
      const digest = randomBytes(32)
      const signature = await aliceKeystore.signDigest({
        digest,
        identityKey: false,
        prekeyIndex: 0,
      })
      expect(signature).toEqual(await aliceKeys.preKeys[0].sign(digest))
    })

    it('rejects signing with an invalid prekey index', async () => {
      const digest = randomBytes(32)
      expect(
        aliceKeystore.signDigest({
          digest,
          identityKey: false,
          prekeyIndex: 100,
        })
      ).rejects.toThrow(
        new KeystoreError(
          keystore.ErrorCode.ERROR_CODE_NO_MATCHING_PREKEY,
          'no prekey found'
        )
      )
    })
  })

  describe('getV2Conversations', () => {
    it('correctly sorts conversations', async () => {
      const baseTime = new Date()
      const timestamps = Array.from(
        { length: 25 },
        (_, i) => new Date(baseTime.getTime() + i)
      )

      // Shuffle the order they go into the store
      const shuffled = [...timestamps].sort(() => Math.random() - 0.5)

      await Promise.all(
        shuffled.map(async (createdAt) => {
          let keys = await PrivateKeyBundleV1.generate(newWallet())

          const recipient = SignedPublicKeyBundle.fromLegacyBundle(
            keys.getPublicKeyBundle()
          )

          return aliceKeystore.createInvite({
            recipient,
            createdNs: dateToNs(createdAt),
            context: undefined,
          })
        })
      )

      const convos = (await aliceKeystore.getV2Conversations()).conversations
      let lastCreated = Long.fromNumber(0)
      for (let i = 0; i < convos.length; i++) {
        expect(convos[i].createdNs.equals(dateToNs(timestamps[i]))).toBeTruthy()
        expect(convos[i].createdNs.greaterThanOrEqual(lastCreated)).toBeTruthy()
        lastCreated = convos[i].createdNs
      }
    })

    it('uses deterministic topic', async () => {
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

      const responses: CreateInviteResponse[] = []
      await Promise.all(
        shuffled.map(async (createdAt) => {
          const response = await aliceKeystore.createInvite({
            recipient,
            createdNs: dateToNs(createdAt),
            context: undefined,
          })

          responses.push(response)

          return response
        })
      )

      const firstResponse: CreateInviteResponse = responses[0]
      const topicName = firstResponse.conversation!.topic

      expect(topicName).toMatch(/^[\x00-\x7F]+$/)

      expect(
        responses.filter((response, index, array) => {
          return response.conversation!.topic === topicName
        })
      ).toHaveLength(25)
    })

    it('uses deterministic topic w/ conversation ID', async () => {
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

      const responses: CreateInviteResponse[] = []
      await Promise.all(
        shuffled.map(async (createdAt) => {
          const response = await aliceKeystore.createInvite({
            recipient,
            createdNs: dateToNs(createdAt),
            context: {
              conversationId: 'test',
              metadata: {},
            },
          })

          responses.push(response)

          return response
        })
      )

      const firstResponse: CreateInviteResponse = responses[0]
      const topicName = firstResponse.conversation!.topic

      expect(
        responses.filter((response, index, array) => {
          return response.conversation!.topic === topicName
        })
      ).toHaveLength(25)
    })

    it('works with persistence', async () => {})
  })

  describe('createAuthToken', () => {
    it('creates an auth token', async () => {
      const authToken = new Token(await aliceKeystore.createAuthToken({}))
      expect(authToken.authDataBytes).toBeDefined()
      expect(Long.isLong(authToken.authData.createdNs)).toBe(true)
      expect(authToken.authDataSignature).toBeDefined()
      expect(authToken.identityKey?.secp256k1Uncompressed).toBeDefined()
      expect(authToken.identityKey?.signature).toBeDefined()
    })

    it('creates an auth token with a defined time', async () => {
      const definedTime = new Date(+new Date() - 5000)
      const token = new Token(
        await aliceKeystore.createAuthToken({
          timestampNs: dateToNs(definedTime),
        })
      )
      expect(token.ageMs).toBeGreaterThan(5000)
    })
  })

  describe('getPublicKeyBundle', () => {
    it('can retrieve a valid bundle', async () => {
      const bundle = await aliceKeystore.getPublicKeyBundle()
      const wrappedBundle = SignedPublicKeyBundle.fromLegacyBundle(bundle)
      expect(
        wrappedBundle.equals(
          SignedPublicKeyBundle.fromLegacyBundle(aliceKeys.getPublicKeyBundle())
        )
      )
    })
  })

  describe('getAccountAddress', () => {
    it('returns the wallet address', async () => {
      const aliceAddress = aliceKeys
        .getPublicKeyBundle()
        .walletSignatureAddress()
      const returnedAddress = await aliceKeystore.getAccountAddress()

      expect(aliceAddress).toEqual(returnedAddress)
    })
  })

  describe('lookupTopic', () => {
    it('looks up a topic that exists', async () => {
      const { created, sealed, invite } = await buildInvite()

      const sealedBytes = sealed.toBytes()
      const envelope = buildProtoEnvelope(sealedBytes, 'foo', created)

      const {
        responses: [aliceResponse],
      } = await aliceKeystore.saveInvites({
        requests: [envelope],
      })
      if (aliceResponse.error) {
        throw aliceResponse
      }

      const lookupResult = aliceKeystore.lookupTopic(invite.topic)
      expect(lookupResult?.invitation.aes256GcmHkdfSha256?.keyMaterial).toEqual(
        invite.aes256GcmHkdfSha256.keyMaterial
      )
    })

    it('returns undefined for non-existent topic', async () => {
      const lookupResult = aliceKeystore.lookupTopic('foo')
      expect(lookupResult).toBeUndefined()
    })
  })
})

import { authn, keystore, privateKey, signature } from '@xmtp/proto'
import {
  PrivateKeyBundleV1,
  PrivateKeyBundleV2,
} from './../crypto/PrivateKeyBundle'
import { InvitationV1, SealedInvitation } from './../Invitation'
import { PrivateKey, PublicKeyBundle } from '../crypto'
import { Keystore, TopicData } from './interfaces'
import { decryptV1, encryptV1, encryptV2, decryptV2 } from './encryption'
import { KeystoreError } from './errors'
import {
  convertError,
  mapAndConvertErrors,
  toPublicKeyBundle,
  toSignedPublicKeyBundle,
  validateObject,
  getKeyMaterial,
  topicDataToV2ConversationReference,
} from './utils'
import {
  nsToDate,
  buildDirectMessageTopicV2,
  buildDirectMessageTopic,
} from '../utils'
import { AddRequest, V1Store, V2Store } from './conversationStores'
import { Persistence } from './persistence'
import LocalAuthenticator from '../authn/LocalAuthenticator'
import { hmacSha256Sign } from '../crypto/ecies'
import crypto from '../crypto/crypto'
import { bytesToHex } from '../crypto/utils'
import Long from 'long'
import { selfDecrypt, selfEncrypt } from '../keystore/encryption'
// eslint-disable-next-line camelcase
import { generate_private_preferences_topic } from '@xmtp/ecies-bindings-wasm'

const { ErrorCode } = keystore

// Constant, 32 byte salt
// DO NOT CHANGE
const INVITE_SALT = new TextEncoder().encode('__XMTP__INVITATION__SALT__XMTP__')

async function deriveKey(
  secret: Uint8Array,
  info: Uint8Array
): Promise<CryptoKey> {
  const key = await crypto.subtle.importKey('raw', secret, 'HKDF', false, [
    'deriveKey',
  ])
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: INVITE_SALT, info },
    key,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}

export default class InMemoryKeystore implements Keystore {
  private v1Keys: PrivateKeyBundleV1
  private v2Keys: PrivateKeyBundleV2 // Do I need this?
  private v1Store: V1Store
  private v2Store: V2Store
  private authenticator: LocalAuthenticator
  private accountAddress: string | undefined
  private jobStatePersistence: Persistence

  constructor(
    keys: PrivateKeyBundleV1,
    v1Store: V1Store,
    v2Store: V2Store,
    persistence: Persistence
  ) {
    this.v1Keys = keys
    this.v2Keys = PrivateKeyBundleV2.fromLegacyBundle(keys)
    this.v1Store = v1Store
    this.v2Store = v2Store
    this.authenticator = new LocalAuthenticator(keys.identityKey)
    this.jobStatePersistence = persistence
  }

  static async create(keys: PrivateKeyBundleV1, persistence: Persistence) {
    return new InMemoryKeystore(
      keys,
      await V1Store.create(persistence),
      await V2Store.create(persistence),
      persistence
    )
  }

  get walletAddress(): string {
    return this.v1Keys.identityKey.publicKey.walletSignatureAddress()
  }

  async decryptV1(
    req: keystore.DecryptV1Request
  ): Promise<keystore.DecryptResponse> {
    const responses = await mapAndConvertErrors(
      req.requests,
      async (req) => {
        if (!validateObject(req, ['payload', 'peerKeys'], ['headerBytes'])) {
          throw new KeystoreError(ErrorCode.ERROR_CODE_INVALID_INPUT, 'invalid')
        }
        const { payload, peerKeys, headerBytes, isSender } = req

        const decrypted = await decryptV1(
          this.v1Keys,
          toPublicKeyBundle(peerKeys),
          payload,
          headerBytes,
          isSender
        )

        return {
          decrypted,
        }
      },
      keystore.ErrorCode.ERROR_CODE_UNSPECIFIED
    )

    return keystore.DecryptResponse.fromPartial({
      responses,
    })
  }

  async decryptV2(
    req: keystore.DecryptV2Request
  ): Promise<keystore.DecryptResponse> {
    const responses = await mapAndConvertErrors(
      req.requests,
      async (req) => {
        if (!validateObject(req, ['payload'], ['headerBytes'])) {
          throw new KeystoreError(
            keystore.ErrorCode.ERROR_CODE_INVALID_INPUT,
            'missing required field'
          )
        }

        const { payload, headerBytes, contentTopic } = req
        const topicData = this.v2Store.lookup(contentTopic)
        if (!topicData) {
          // This is the wrong error type. Will add to the proto repo later
          throw new KeystoreError(
            keystore.ErrorCode.ERROR_CODE_NO_MATCHING_PREKEY,
            'no topic key'
          )
        }
        const decrypted = await decryptV2(
          payload,
          getKeyMaterial(topicData.invitation),
          headerBytes
        )

        return { decrypted }
      },
      ErrorCode.ERROR_CODE_UNSPECIFIED
    )

    return keystore.DecryptResponse.fromPartial({
      responses,
    })
  }

  async encryptV1(
    req: keystore.EncryptV1Request
  ): Promise<keystore.EncryptResponse> {
    const responses = await mapAndConvertErrors(
      req.requests,
      async (req) => {
        if (!validateObject(req, ['payload', 'recipient'], ['headerBytes'])) {
          throw new KeystoreError(
            ErrorCode.ERROR_CODE_INVALID_INPUT,
            'missing required field'
          )
        }

        const { recipient, payload, headerBytes } = req

        return {
          encrypted: await encryptV1(
            this.v1Keys,
            toPublicKeyBundle(recipient),
            payload,
            headerBytes
          ),
        }
      },
      ErrorCode.ERROR_CODE_UNSPECIFIED
    )

    return keystore.EncryptResponse.fromPartial({
      responses,
    })
  }

  async createAuthToken({
    timestampNs,
  }: keystore.CreateAuthTokenRequest): Promise<authn.Token> {
    return this.authenticator.createToken(
      timestampNs ? nsToDate(timestampNs) : undefined
    )
  }

  async selfEncrypt(
    req: keystore.SelfEncryptRequest
  ): Promise<keystore.SelfEncryptResponse> {
    const responses = await mapAndConvertErrors(
      req.requests,
      async (req) => {
        const { payload } = req

        if (!payload) {
          throw new KeystoreError(
            ErrorCode.ERROR_CODE_INVALID_INPUT,
            'Missing field payload'
          )
        }

        const publicKey =
          this.v1Keys.getPublicKeyBundle().preKey.secp256k1Uncompressed.bytes
        const privateKey = this.v1Keys.identityKey.secp256k1.bytes

        return {
          encrypted: await selfEncrypt(publicKey, privateKey, payload),
        }
      },
      ErrorCode.ERROR_CODE_INVALID_INPUT
    )

    return keystore.SelfEncryptResponse.fromPartial({
      responses,
    })
  }

  async selfDecrypt(
    req: keystore.SelfDecryptRequest
  ): Promise<keystore.DecryptResponse> {
    const responses = await mapAndConvertErrors(
      req.requests,
      async (req) => {
        const { payload } = req

        if (!payload) {
          throw new KeystoreError(
            ErrorCode.ERROR_CODE_INVALID_INPUT,
            'Missing field payload'
          )
        }

        const publicKey =
          this.v1Keys.getPublicKeyBundle().preKey.secp256k1Uncompressed.bytes
        const privateKey = this.v1Keys.identityKey.secp256k1.bytes

        return {
          decrypted: await selfDecrypt(publicKey, privateKey, payload),
        }
      },
      ErrorCode.ERROR_CODE_INVALID_INPUT
    )

    return keystore.DecryptResponse.fromPartial({
      responses,
    })
  }

  async getPrivatePreferencesTopicIdentifier(): Promise<keystore.GetPrivatePreferencesTopicIdentifierResponse> {
    const privateKey = this.v1Keys.identityKey.secp256k1.bytes
    const identifier = generate_private_preferences_topic(privateKey).toString()
    return keystore.GetPrivatePreferencesTopicIdentifierResponse.fromPartial({
      identifier,
    })
  }

  async encryptV2(
    req: keystore.EncryptV2Request
  ): Promise<keystore.EncryptResponse> {
    const responses = await mapAndConvertErrors(
      req.requests,
      async (req) => {
        if (!validateObject(req, ['payload'], ['headerBytes'])) {
          throw new KeystoreError(
            ErrorCode.ERROR_CODE_INVALID_INPUT,
            'missing required field'
          )
        }

        const { payload, headerBytes, contentTopic } = req

        const topicData = this.v2Store.lookup(contentTopic)
        if (!topicData) {
          throw new KeystoreError(
            ErrorCode.ERROR_CODE_NO_MATCHING_PREKEY,
            'no topic key'
          )
        }

        return {
          encrypted: await encryptV2(
            payload,
            getKeyMaterial(topicData.invitation),
            headerBytes
          ),
        }
      },
      ErrorCode.ERROR_CODE_INVALID_INPUT
    )

    return keystore.EncryptResponse.fromPartial({
      responses,
    })
  }

  async saveInvites(
    req: keystore.SaveInvitesRequest
  ): Promise<keystore.SaveInvitesResponse> {
    const toAdd: AddRequest[] = []

    const responses = await mapAndConvertErrors(
      req.requests,
      async ({ payload, timestampNs }) => {
        const sealed = SealedInvitation.fromBytes(payload)
        if (sealed.v1) {
          const headerTime = sealed.v1.header.createdNs
          if (!headerTime.equals(timestampNs)) {
            throw new Error('envelope and header timestamp mismatch')
          }

          const isSender = sealed.v1.header.sender.equals(
            this.v2Keys.getPublicKeyBundle()
          )

          const invitation = await sealed.v1.getInvitation(this.v2Keys)
          const topicData = {
            invitation,
            createdNs: sealed.v1.header.createdNs,
            peerAddress: isSender
              ? await sealed.v1.header.recipient.walletSignatureAddress()
              : await sealed.v1.header.sender.walletSignatureAddress(),
          }
          toAdd.push({ ...topicData, topic: invitation.topic })
          return {
            conversation: topicDataToV2ConversationReference(topicData),
          }
        }
      },
      ErrorCode.ERROR_CODE_INVALID_INPUT
    )

    await this.v2Store.add(toAdd)

    return keystore.SaveInvitesResponse.fromPartial({
      responses,
    })
  }

  async createInvite(
    req: keystore.CreateInviteRequest
  ): Promise<keystore.CreateInviteResponse> {
    try {
      if (!validateObject(req, ['recipient'], [])) {
        throw new KeystoreError(
          ErrorCode.ERROR_CODE_INVALID_INPUT,
          'missing recipient'
        )
      }
      const created = nsToDate(req.createdNs)
      const recipient = toSignedPublicKeyBundle(req.recipient)
      const myAddress = await this.getAccountAddress()
      const theirAddress = await recipient.walletSignatureAddress()

      const secret = await this.v2Keys.sharedSecret(
        recipient,
        this.v2Keys.getCurrentPreKey().publicKey,
        myAddress < theirAddress
      )

      const sortedAddresses = [myAddress, theirAddress].sort()

      const msgString =
        (req.context?.conversationId || '') + sortedAddresses.join()

      const msgBytes = new TextEncoder().encode(msgString)

      const topic = bytesToHex(
        await hmacSha256Sign(Buffer.from(secret), Buffer.from(msgBytes))
      )

      const infoString = [
        '0', // sequence number
        ...sortedAddresses,
      ].join('|')
      const info = new TextEncoder().encode(infoString)
      const derivedKey = await deriveKey(secret, info)

      const keyMaterial = new Uint8Array(
        await crypto.subtle.exportKey('raw', derivedKey)
      )

      const invitation = new InvitationV1({
        topic: buildDirectMessageTopicV2(topic),
        aes256GcmHkdfSha256: { keyMaterial },
        context: req.context,
      })

      const sealed = await SealedInvitation.createV1({
        sender: this.v2Keys,
        recipient,
        created,
        invitation,
      })

      const topicData = {
        invitation,
        topic: invitation.topic,
        createdNs: req.createdNs,
        peerAddress: await recipient.walletSignatureAddress(),
      }

      await this.v2Store.add([topicData])

      return keystore.CreateInviteResponse.fromPartial({
        conversation: topicDataToV2ConversationReference(topicData),
        payload: sealed.toBytes(),
      })
    } catch (e) {
      throw convertError(e as Error, ErrorCode.ERROR_CODE_INVALID_INPUT)
    }
  }

  async signDigest(
    req: keystore.SignDigestRequest
  ): Promise<signature.Signature> {
    if (!validateObject(req, ['digest'], [])) {
      throw new KeystoreError(
        ErrorCode.ERROR_CODE_INVALID_INPUT,
        'missing required field'
      )
    }

    const { digest, identityKey, prekeyIndex } = req
    let key: PrivateKey
    if (identityKey) {
      key = this.v1Keys.identityKey
    } else if (
      typeof prekeyIndex !== 'undefined' &&
      Number.isInteger(prekeyIndex)
    ) {
      key = this.v1Keys.preKeys[prekeyIndex]
      if (!key) {
        throw new KeystoreError(
          ErrorCode.ERROR_CODE_NO_MATCHING_PREKEY,
          'no prekey found'
        )
      }
    } else {
      throw new KeystoreError(
        ErrorCode.ERROR_CODE_INVALID_INPUT,
        'must specifify identityKey or prekeyIndex'
      )
    }

    return key.sign(digest)
  }

  async saveV1Conversations({
    conversations,
  }: keystore.SaveV1ConversationsRequest): Promise<keystore.SaveV1ConversationsResponse> {
    await this.v1Store.add(
      conversations.map((convo) => ({
        topic: buildDirectMessageTopic(convo.peerAddress, this.walletAddress),
        peerAddress: convo.peerAddress,
        createdNs: convo.createdNs,
        invitation: undefined,
      }))
    )

    return {}
  }

  async getV1Conversations(): Promise<keystore.GetConversationsResponse> {
    const convos = this.v1Store.topics.map(
      this.topicDataToV1ConversationReference.bind(this)
    )

    return { conversations: convos }
  }

  async getV2Conversations(): Promise<keystore.GetConversationsResponse> {
    const convos = this.v2Store.topics.map((invite) =>
      topicDataToV2ConversationReference(invite as TopicData)
    )

    convos.sort((a, b) =>
      a.createdNs.div(1_000_000).sub(b.createdNs.div(1_000_000)).toNumber()
    )

    return keystore.GetConversationsResponse.fromPartial({
      conversations: convos,
    })
  }

  async getPublicKeyBundle(): Promise<PublicKeyBundle> {
    return this.v1Keys.getPublicKeyBundle()
  }

  async getPrivateKeyBundle(): Promise<privateKey.PrivateKeyBundleV1> {
    return this.v1Keys
  }

  async getAccountAddress(): Promise<string> {
    if (!this.accountAddress) {
      this.accountAddress = await this.v2Keys
        .getPublicKeyBundle()
        .walletSignatureAddress()
    }
    return this.accountAddress
  }

  async getRefreshJob({
    jobType,
  }: keystore.GetRefreshJobRequest): Promise<keystore.GetRefreshJobResponse> {
    if (jobType === keystore.JobType.JOB_TYPE_UNSPECIFIED) {
      throw new KeystoreError(
        ErrorCode.ERROR_CODE_INVALID_INPUT,
        'invalid job type'
      )
    }

    const lastRunTime = await this.getLastRunTime(jobType)

    return keystore.GetRefreshJobResponse.fromPartial({
      lastRunNs: lastRunTime || Long.fromNumber(0),
    })
  }

  async setRefreshJob({
    jobType,
    lastRunNs,
  }: keystore.SetRefeshJobRequest): Promise<keystore.SetRefreshJobResponse> {
    const key = await this.buildJobStorageKey(jobType)
    await this.jobStatePersistence.setItem(
      key,
      Uint8Array.from(lastRunNs.toBytes())
    )

    return {}
  }

  private topicDataToV1ConversationReference(
    data: keystore.TopicMap_TopicData
  ) {
    return {
      peerAddress: data.peerAddress,
      createdNs: data.createdNs,
      topic: buildDirectMessageTopic(data.peerAddress, this.walletAddress),
      context: undefined,
    }
  }

  private buildJobStorageKey(jobType: keystore.JobType): string {
    return `refreshJob/${jobType.toString()}`
  }

  private async getLastRunTime(
    jobType: keystore.JobType
  ): Promise<Long | undefined> {
    const bytes = await this.jobStatePersistence.getItem(
      this.buildJobStorageKey(jobType)
    )
    if (!bytes || !bytes.length) {
      return
    }

    return Long.fromBytes([...bytes])
  }

  // This method is not defined as part of the standard Keystore API, but is available
  // on the InMemoryKeystore to support legacy use-cases.
  lookupTopic(topic: string) {
    return this.v2Store.lookup(topic)
  }
}

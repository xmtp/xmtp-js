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
  topicDataToConversationReference,
} from './utils'
import { nsToDate } from '../utils'
import InviteStore from './InviteStore'
import { Persistence } from './persistence'
import LocalAuthenticator from '../authn/LocalAuthenticator'
const { ErrorCode } = keystore

export default class InMemoryKeystore implements Keystore {
  private v1Keys: PrivateKeyBundleV1
  private v2Keys: PrivateKeyBundleV2 // Do I need this?
  private inviteStore: InviteStore
  private authenticator: LocalAuthenticator

  constructor(keys: PrivateKeyBundleV1, inviteStore: InviteStore) {
    this.v1Keys = keys
    this.v2Keys = PrivateKeyBundleV2.fromLegacyBundle(keys)
    this.inviteStore = inviteStore
    this.authenticator = new LocalAuthenticator(keys.identityKey)
  }

  static async create(keys: PrivateKeyBundleV1, persistence?: Persistence) {
    return new InMemoryKeystore(keys, await InviteStore.create(persistence))
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
        const topicData = this.inviteStore.lookup(contentTopic)
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

        const topicData = this.inviteStore.lookup(contentTopic)
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
    const toAdd: TopicData[] = []

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
          toAdd.push(topicData)
          return {
            conversation: topicDataToConversationReference(topicData),
          }
        } else {
          throw new Error('Invite v2 not implemented')
        }
      },
      ErrorCode.ERROR_CODE_INVALID_INPUT
    )

    await this.inviteStore.add(toAdd)

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
      const invitation = InvitationV1.createRandom(req.context)
      const created = nsToDate(req.createdNs)
      const recipient = toSignedPublicKeyBundle(req.recipient)
      const sealed = await SealedInvitation.createV1({
        sender: this.v2Keys,
        recipient,
        created,
        invitation,
      })
      const topicData = {
        invitation,
        createdNs: req.createdNs,
        peerAddress: await recipient.walletSignatureAddress(),
      }
      await this.inviteStore.add([topicData])

      return keystore.CreateInviteResponse.fromPartial({
        conversation: topicDataToConversationReference(topicData),
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

  async getV2Conversations(): Promise<keystore.ConversationReference[]> {
    const convos = this.inviteStore.topics.map((invite) =>
      topicDataToConversationReference(invite)
    )

    convos.sort((a, b) =>
      a.createdNs.div(1_000_000).sub(b.createdNs.div(1_000_000)).toNumber()
    )
    return convos
  }

  async getPublicKeyBundle(): Promise<PublicKeyBundle> {
    return this.v1Keys.getPublicKeyBundle()
  }

  async getPrivateKeyBundle(): Promise<privateKey.PrivateKeyBundleV1> {
    return this.v1Keys
  }

  async getAccountAddress(): Promise<string> {
    return this.v2Keys.getPublicKeyBundle().walletSignatureAddress()
  }
}

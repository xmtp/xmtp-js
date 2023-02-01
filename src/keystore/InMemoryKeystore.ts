import { messageApi } from '@xmtp/proto'
import {
  PrivateKeyBundleV1,
  PrivateKeyBundleV2,
} from './../crypto/PrivateKeyBundle'
import {
  InvitationContext,
  InvitationV1,
  SealedInvitation,
} from './../Invitation'
import { SignedPublicKeyBundle } from '../crypto'
import {
  Keystore,
  DecryptV1Request,
  DecryptV2Request,
  DecryptV1Response,
  DecryptV2Response,
  EncryptResponse,
  EncryptV1Request,
  EncryptV2Request,
  CreateInviteRequest,
  CreateInviteResponse,
  ResultOrError,
  ConversationReference,
} from './interfaces'
import { decryptV1, encryptV1, encryptV2, decryptV2 } from './encryption'
import { ErrorCode, KeystoreError } from './errors'
import {
  convertError,
  mapAndConvertErrors,
  toPublicKeyBundle,
  toSignedPublicKeyBundle,
} from './utils'
import { nsToDate } from '../utils'

type TopicData = {
  key: Uint8Array
  context?: InvitationContext
  createdAt: Date
}

export default class InMemoryKeystore implements Keystore {
  private v1Keys: PrivateKeyBundleV1
  private v2Keys: PrivateKeyBundleV2 // Do I need this?
  private topicKeys: Map<string, TopicData>

  constructor(keys: PrivateKeyBundleV1) {
    this.v1Keys = keys
    this.v2Keys = PrivateKeyBundleV2.fromLegacyBundle(keys)
    this.topicKeys = new Map<string, TopicData>()
  }

  decryptV1(req: DecryptV1Request[]): Promise<DecryptV1Response[]> {
    return mapAndConvertErrors(
      req,
      async ({ payload, peerKeys, headerBytes, isSender }) => {
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
      ErrorCode.VALIDATION_FAILED
    )
  }

  async decryptV2(req: DecryptV2Request[]): Promise<DecryptV2Response[]> {
    return mapAndConvertErrors(
      req,
      async ({ payload, headerBytes, contentTopic }) => {
        const topicData = this.topicKeys.get(contentTopic)
        if (!topicData) {
          throw new KeystoreError(ErrorCode.NOT_FOUND, 'no topic key')
        }
        const decrypted = await decryptV2(payload, topicData.key, headerBytes)
        return { decrypted }
      },
      ErrorCode.INTERNAL_ERROR
    )
  }

  encryptV1(req: EncryptV1Request[]): Promise<EncryptResponse[]> {
    return mapAndConvertErrors(
      req,
      async ({ recipient, payload, headerBytes }) => {
        return {
          ciphertext: await encryptV1(
            this.v1Keys,
            toPublicKeyBundle(recipient),
            payload,
            headerBytes
          ),
        }
      },
      ErrorCode.VALIDATION_FAILED
    )
  }

  async encryptV2(req: EncryptV2Request[]): Promise<EncryptResponse[]> {
    return mapAndConvertErrors(
      req,
      async ({ contentTopic, message, headerBytes }) => {
        const topicData = this.topicKeys.get(contentTopic)
        if (!topicData) {
          throw new KeystoreError(ErrorCode.NOT_FOUND, 'no topic key')
        }
        return {
          ciphertext: await encryptV2(message, topicData.key, headerBytes),
        }
      },
      ErrorCode.INTERNAL_ERROR
    )
  }

  async saveInvites(
    req: messageApi.Envelope[]
  ): Promise<ResultOrError<ConversationReference>[]> {
    return mapAndConvertErrors(
      req,
      async (envelope) => {
        const sealedInvitation = await SealedInvitation.fromEnvelope(envelope)
        const invite = await sealedInvitation.v1.getInvitation(this.v2Keys)
        return this.addConversationFromV1Invite(
          invite,
          nsToDate(sealedInvitation.v1.header.createdNs)
        )
      },
      ErrorCode.VALIDATION_FAILED
    )
  }

  async createInvite(req: CreateInviteRequest): Promise<CreateInviteResponse> {
    try {
      const invitation = InvitationV1.createRandom(req.context)
      const sealed = await SealedInvitation.createV1({
        sender: this.v2Keys,
        recipient: toSignedPublicKeyBundle(req.recipient),
        created: req.createdAt,
        invitation,
      })
      const convo = this.addConversationFromV1Invite(invitation, req.createdAt)

      return {
        conversation: convo,
        payload: sealed.toBytes(),
      }
    } catch (e) {
      throw convertError(e as Error, ErrorCode.VALIDATION_FAILED)
    }
  }

  async getV2Conversations(): Promise<ConversationReference[]> {
    const convos = Array.from(this.topicKeys.entries()).map(
      ([topic, data]): ConversationReference => ({
        topic,
        createdAt: data.createdAt,
        context: data.context,
      })
    )

    convos.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    return convos
  }

  async getPublicKeyBundle(): Promise<SignedPublicKeyBundle> {
    return this.v2Keys.getPublicKeyBundle()
  }

  async getWalletAddress(): Promise<string> {
    return this.v2Keys.getPublicKeyBundle().walletSignatureAddress()
  }

  private addConversationFromV1Invite(
    invite: InvitationV1,
    createdAt: Date
  ): ConversationReference {
    this.topicKeys.set(invite.topic, {
      key: invite.aes256GcmHkdfSha256.keyMaterial,
      context: invite.context,
      createdAt,
    })

    return {
      topic: invite.topic,
      createdAt,
      context: invite.context,
    }
  }
}

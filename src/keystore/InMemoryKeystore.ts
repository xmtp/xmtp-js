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
  SealedInvitation as ISealedInvitation,
  ResultOrError,
  ConversationReference,
} from './interfaces'
import { decryptV1, encryptV1 } from './encryption'
import { ErrorCode } from './errors'
import { mapAndConvertErrors } from './utils'
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
      async ({ payload, contentTopic }) => {
        const decrypted = await decryptV1(this.v1Keys, payload, contentTopic)
        return {
          decrypted,
        }
      },
      ErrorCode.VALIDATION_FAILED
    )
  }

  async decryptV2(req: DecryptV2Request[]): Promise<DecryptV2Response[]> {
    throw new Error('unimplemented')
  }

  encryptV1(req: EncryptV1Request[]): Promise<EncryptResponse[]> {
    return mapAndConvertErrors(
      req,
      async ({ recipient, message, headerBytes }) => {
        return {
          ciphertext: await encryptV1(
            this.v1Keys,
            recipient,
            message,
            headerBytes
          ),
        }
      },
      ErrorCode.VALIDATION_FAILED
    )
  }

  async encryptV2(req: EncryptV2Request[]): Promise<EncryptResponse[]> {
    throw new Error('unimplemented')
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

  async createInvite(req: CreateInviteRequest): Promise<ISealedInvitation> {
    throw new Error('unimplemented')
  }

  async getV2Conversations(): Promise<ConversationReference[]> {
    const convos = Object.entries(this.topicKeys).map(
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

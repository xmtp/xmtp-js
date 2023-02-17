import { keystore } from '@xmtp/proto'
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
import { Keystore } from './interfaces'
import { decryptV1, encryptV1, encryptV2, decryptV2 } from './encryption'
import { KeystoreError } from './errors'
import {
  convertError,
  mapAndConvertErrors,
  toPublicKeyBundle,
  toSignedPublicKeyBundle,
} from './utils'
import { dateToNs, nsToDate } from '../utils'
const { ErrorCode } = keystore

type TopicData = {
  key: Uint8Array
  context?: InvitationContext
  created: Date
}

type WithoutUndefined<T> = { [P in keyof T]: NonNullable<T[P]> }

// Takes object and returns true if none of the `objectFields` are null or undefined and none of the `arrayFields` are empty
const validateObject = <T>(
  obj: T,
  objectFields: (keyof T)[],
  arrayFields: (keyof T)[]
): obj is WithoutUndefined<T> => {
  for (const field of objectFields) {
    if (!obj[field]) {
      throw new KeystoreError(
        ErrorCode.ERROR_CODE_INVALID_INPUT,
        `Missing field ${String(field)}`
      )
    }
  }
  for (const field of arrayFields) {
    const val = obj[field]
    // @ts-expect-error does not know it's an array
    if (!val || !val?.length) {
      throw new KeystoreError(
        ErrorCode.ERROR_CODE_INVALID_INPUT,
        `Missing field ${String(field)}`
      )
    }
  }

  return true
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
        const topicData = this.topicKeys.get(contentTopic)
        if (!topicData) {
          // This is the wrong error type. Will add to the proto repo later
          throw new KeystoreError(
            keystore.ErrorCode.ERROR_CODE_NO_MATCHING_PREKEY,
            'no topic key'
          )
        }
        const decrypted = await decryptV2(payload, topicData.key, headerBytes)

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

        const topicData = this.topicKeys.get(contentTopic)
        if (!topicData) {
          throw new KeystoreError(
            ErrorCode.ERROR_CODE_NO_MATCHING_PREKEY,
            'no topic key'
          )
        }

        return {
          encrypted: await encryptV2(payload, topicData.key, headerBytes),
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
    const responses = await mapAndConvertErrors(
      req.requests,
      async ({ payload, timestampNs }) => {
        const sealed = SealedInvitation.fromBytes(payload)

        const headerTime = sealed.v1.header.createdNs
        if (!headerTime.equals(timestampNs)) {
          throw new Error('envelope and header timestamp mismatch')
        }

        const invite = await sealed.v1.getInvitation(this.v2Keys)

        return {
          conversation: this.addConversationFromV1Invite(
            invite,
            nsToDate(sealed.v1.header.createdNs)
          ),
        }
      },
      ErrorCode.ERROR_CODE_INVALID_INPUT
    )

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
      const sealed = await SealedInvitation.createV1({
        sender: this.v2Keys,
        recipient: toSignedPublicKeyBundle(req.recipient),
        created,
        invitation,
      })
      const convo = this.addConversationFromV1Invite(invitation, created)

      return keystore.CreateInviteResponse.fromPartial({
        conversation: convo,
        payload: sealed.toBytes(),
      })
    } catch (e) {
      throw convertError(e as Error, ErrorCode.ERROR_CODE_INVALID_INPUT)
    }
  }

  async getV2Conversations(): Promise<keystore.ConversationReference[]> {
    const convos = Array.from(this.topicKeys.entries()).map(
      ([topic, data]): keystore.ConversationReference => ({
        topic,
        createdNs: dateToNs(data.created),
        context: data.context,
      })
    )

    convos.sort((a, b) => a.createdNs.sub(b.createdNs).toNumber())
    return convos
  }

  async getPublicKeyBundle(): Promise<SignedPublicKeyBundle> {
    return this.v2Keys.getPublicKeyBundle()
  }

  async getAccountAddress(): Promise<string> {
    return this.v2Keys.getPublicKeyBundle().walletSignatureAddress()
  }

  private addConversationFromV1Invite(
    invite: InvitationV1,
    created: Date
  ): keystore.ConversationReference {
    this.topicKeys.set(invite.topic, {
      key: invite.aes256GcmHkdfSha256.keyMaterial,
      context: invite.context,
      created,
    })

    return {
      topic: invite.topic,
      createdNs: dateToNs(created),
      context: invite.context,
    }
  }
}

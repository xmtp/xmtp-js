import { invitation, type messageApi } from '@xmtp/proto'
import Long from 'long'
import { dateToNs } from '@/utils/date'
import { buildDirectMessageTopicV2 } from '@/utils/topic'
import Ciphertext from './crypto/Ciphertext'
import crypto from './crypto/crypto'
import { decrypt, encrypt } from './crypto/encryption'
import type { PrivateKeyBundleV2 } from './crypto/PrivateKeyBundle'
import { SignedPublicKeyBundle } from './crypto/PublicKeyBundle'

export type InvitationContext = {
  conversationId: string
  metadata: { [k: string]: string }
}

/**
 * InvitationV1 is a protobuf message to be encrypted and used as the ciphertext in a SealedInvitationV1 message
 */
export class InvitationV1 implements invitation.InvitationV1 {
  topic: string
  context: InvitationContext | undefined
  aes256GcmHkdfSha256: invitation.InvitationV1_Aes256gcmHkdfsha256 // eslint-disable-line camelcase
  consentProof: invitation.ConsentProofPayload | undefined

  constructor({
    topic,
    context,
    aes256GcmHkdfSha256,
    consentProof,
  }: invitation.InvitationV1) {
    if (!topic || !topic.length) {
      throw new Error('Missing topic')
    }
    if (
      !aes256GcmHkdfSha256 ||
      !aes256GcmHkdfSha256.keyMaterial ||
      !aes256GcmHkdfSha256.keyMaterial.length
    ) {
      throw new Error('Missing key material')
    }
    this.topic = topic
    this.context = context
    this.aes256GcmHkdfSha256 = aes256GcmHkdfSha256
    this.consentProof = consentProof
  }

  static createRandom(
    context?: invitation.InvitationV1_Context,
    consentProof?: invitation.ConsentProofPayload
  ): InvitationV1 {
    const topic = buildDirectMessageTopicV2(
      Buffer.from(crypto.getRandomValues(new Uint8Array(32)))
        .toString('base64')
        .replace(/=*$/g, '')
        // Replace slashes with dashes so that the topic is still easily split by /
        // We do not treat this as needing to be valid Base64 anywhere
        .replace(/\//g, '-')
    )
    const keyMaterial = crypto.getRandomValues(new Uint8Array(32))

    return new InvitationV1({
      topic,
      aes256GcmHkdfSha256: { keyMaterial },
      context,
      consentProof,
    })
  }

  toBytes(): Uint8Array {
    return invitation.InvitationV1.encode(this).finish()
  }

  static fromBytes(bytes: Uint8Array): InvitationV1 {
    return new InvitationV1(invitation.InvitationV1.decode(bytes))
  }
}

/**
 * SealedInvitationHeaderV1 is a protobuf message to be used as the headerBytes in a SealedInvitationV1
 */
export class SealedInvitationHeaderV1
  implements invitation.SealedInvitationHeaderV1
{
  sender: SignedPublicKeyBundle
  recipient: SignedPublicKeyBundle
  createdNs: Long

  constructor({
    sender,
    recipient,
    createdNs,
  }: invitation.SealedInvitationHeaderV1) {
    if (!sender) {
      throw new Error('Missing sender')
    }
    if (!recipient) {
      throw new Error('Missing recipient')
    }
    this.sender = new SignedPublicKeyBundle(sender)
    this.recipient = new SignedPublicKeyBundle(recipient)
    this.createdNs = createdNs
  }

  toBytes(): Uint8Array {
    return invitation.SealedInvitationHeaderV1.encode(this).finish()
  }

  static fromBytes(bytes: Uint8Array): SealedInvitationHeaderV1 {
    return new SealedInvitationHeaderV1(
      invitation.SealedInvitationHeaderV1.decode(bytes)
    )
  }
}

export class SealedInvitationV1 implements invitation.SealedInvitationV1 {
  headerBytes: Uint8Array
  ciphertext: Ciphertext
  private _header?: SealedInvitationHeaderV1
  private _invitation?: InvitationV1

  constructor({ headerBytes, ciphertext }: invitation.SealedInvitationV1) {
    if (!headerBytes || !headerBytes.length) {
      throw new Error('Missing header bytes')
    }
    if (!ciphertext) {
      throw new Error('Missing ciphertext')
    }
    this.headerBytes = headerBytes
    this.ciphertext = new Ciphertext(ciphertext)
  }

  /**
   * Accessor method for the full header object
   */
  get header(): SealedInvitationHeaderV1 {
    // Use cached value if already exists
    if (this._header) {
      return this._header
    }
    this._header = SealedInvitationHeaderV1.fromBytes(this.headerBytes)
    return this._header
  }

  /**
   * getInvitation decrypts and returns the InvitationV1 stored in the ciphertext of the Sealed Invitation
   */
  async getInvitation(viewer: PrivateKeyBundleV2): Promise<InvitationV1> {
    // Use cached value if already exists
    if (this._invitation) {
      return this._invitation
    }
    // The constructors for child classes will validate that this is complete
    const header = this.header
    let secret: Uint8Array
    if (viewer.identityKey.matches(this.header.sender.identityKey)) {
      secret = await viewer.sharedSecret(
        header.recipient,
        header.sender.preKey,
        false
      )
    } else {
      secret = await viewer.sharedSecret(
        header.sender,
        header.recipient.preKey,
        true
      )
    }

    const decryptedBytes = await decrypt(
      this.ciphertext,
      secret,
      this.headerBytes
    )
    this._invitation = InvitationV1.fromBytes(decryptedBytes)
    return this._invitation
  }

  toBytes(): Uint8Array {
    return invitation.SealedInvitationV1.encode(this).finish()
  }

  static fromBytes(bytes: Uint8Array): SealedInvitationV1 {
    return new SealedInvitationV1(invitation.SealedInvitationV1.decode(bytes))
  }
}

/**
 * Wrapper class for SealedInvitationV1 and any future iterations of SealedInvitation
 */
export class SealedInvitation implements invitation.SealedInvitation {
  v1: SealedInvitationV1 | undefined

  constructor({ v1 }: invitation.SealedInvitation) {
    if (v1) {
      this.v1 = new SealedInvitationV1(v1)
    } else {
      throw new Error('Missing v1 or v2 invitation')
    }
  }

  toBytes(): Uint8Array {
    return invitation.SealedInvitation.encode(this).finish()
  }

  static fromBytes(bytes: Uint8Array): SealedInvitation {
    return new SealedInvitation(invitation.SealedInvitation.decode(bytes))
  }

  static async fromEnvelope(
    env: messageApi.Envelope
  ): Promise<SealedInvitation> {
    if (!env.message || !env.timestampNs) {
      throw new Error('invalid invitation envelope')
    }
    const sealed = SealedInvitation.fromBytes(env.message)
    const envelopeTime = Long.fromString(env.timestampNs)
    const headerTime = sealed.v1?.header.createdNs
    if (!headerTime || !headerTime.equals(envelopeTime)) {
      throw new Error('envelope and header timestamp mistmatch')
    }
    return sealed
  }

  /**
   * Create a SealedInvitation with a SealedInvitationV1 payload
   * Will encrypt all contents and validate inputs
   */
  static async createV1({
    sender,
    recipient,
    created,
    invitation,
  }: {
    sender: PrivateKeyBundleV2
    recipient: SignedPublicKeyBundle
    created: Date
    invitation: InvitationV1
  }): Promise<SealedInvitation> {
    const headerBytes = new SealedInvitationHeaderV1({
      sender: sender.getPublicKeyBundle(),
      recipient,
      createdNs: dateToNs(created),
    }).toBytes()

    const secret = await sender.sharedSecret(
      recipient,
      sender.getCurrentPreKey().publicKey,
      false
    )

    const invitationBytes = invitation.toBytes()
    const ciphertext = await encrypt(invitationBytes, secret, headerBytes)

    return new SealedInvitation({
      v1: { headerBytes, ciphertext },
    })
  }
}

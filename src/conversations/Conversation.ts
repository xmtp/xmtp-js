import Stream from '../Stream'
import Client, {
  ListMessagesOptions,
  ListMessagesPaginatedOptions,
  SendOptions,
} from '../Client'
import {
  InvitationContext,
  InvitationV1,
  SealedInvitationHeaderV1,
} from '../Invitation'
import { MessageV1, MessageV2 } from '../Message'
import { messageApi, xmtpEnvelope, fetcher } from '@xmtp/proto'
import { encrypt, decrypt, SignedPublicKey, Signature } from '../crypto'
import Ciphertext from '../crypto/Ciphertext'
import { sha256 } from '../crypto/encryption'
import { buildDirectMessageTopic, dateToNs, nsToDate } from '../utils'
const { b64Decode } = fetcher

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

/**
 * Conversation class allows you to view, stream, and send messages to/from a peer address
 */
export class ConversationV1 {
  peerAddress: string
  createdAt: Date
  context = null
  private client: Client

  constructor(client: Client, address: string, createdAt: Date) {
    this.peerAddress = address
    this.client = client
    this.createdAt = createdAt
  }

  /**
   * Returns a list of all messages to/from the peerAddress
   */
  async messages(opts?: ListMessagesOptions): Promise<MessageV1[]> {
    return this.client.listConversationMessages(this.peerAddress, opts)
  }

  get topic(): string {
    return buildDirectMessageTopic(this.peerAddress, this.client.address)
  }

  messagesPaginated(
    opts?: ListMessagesPaginatedOptions
  ): AsyncGenerator<MessageV1[]> {
    return this.client.listConversationMessagesPaginated(this.peerAddress, opts)
  }

  /**
   * Returns a Stream of any new messages to/from the peerAddress
   */
  streamMessages(): Promise<Stream<MessageV1>> {
    return this.client.streamConversationMessages(this.peerAddress)
  }

  /**
   * Send a message into the conversation
   */
  send(
    message: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    options?: SendOptions
  ): Promise<MessageV1> {
    return this.client.sendMessage(this.peerAddress, message, options)
  }
}

export class ConversationV2 {
  topic: string
  keyMaterial: Uint8Array // MUST be kept secret
  context?: InvitationContext
  private header: SealedInvitationHeaderV1
  private client: Client
  peerAddress: string

  constructor(
    client: Client,
    invitation: InvitationV1,
    header: SealedInvitationHeaderV1,
    peerAddress: string
  ) {
    this.topic = invitation.topic
    this.keyMaterial = invitation.aes256GcmHkdfSha256.keyMaterial
    this.context = invitation.context
    this.client = client
    this.header = header
    this.peerAddress = peerAddress
  }

  static async create(
    client: Client,
    invitation: InvitationV1,
    header: SealedInvitationHeaderV1
  ): Promise<ConversationV2> {
    const myKeys = client.keys.getPublicKeyBundle()
    const peer = myKeys.equals(header.sender) ? header.recipient : header.sender
    const peerAddress = await peer.walletSignatureAddress()
    return new ConversationV2(client, invitation, header, peerAddress)
  }

  get createdAt(): Date {
    return nsToDate(this.header.createdNs)
  }

  /**
   * Returns a list of all messages to/from the peerAddress
   */
  async messages(opts?: ListMessagesOptions): Promise<MessageV2[]> {
    return this.client.listEnvelopes(
      [this.topic],
      this.decodeMessage.bind(this),
      opts
    )
  }

  messagesPaginated(
    opts?: ListMessagesPaginatedOptions
  ): AsyncGenerator<MessageV2[]> {
    return this.client.listEnvelopesPaginated(
      [this.topic],
      this.decodeMessage.bind(this),
      opts
    )
  }

  /**
   * Returns a Stream of any new messages to/from the peerAddress
   */
  streamMessages(): Promise<Stream<MessageV2>> {
    return Stream.create<MessageV2>(
      this.client,
      [this.topic],
      this.decodeMessage.bind(this)
    )
  }

  /**
   * Send a message into the conversation
   */
  async send(
    message: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    options?: SendOptions
  ): Promise<MessageV2> {
    const msg = await this.encodeMessage(message, options)
    this.client.publishEnvelopes([
      {
        contentTopic: this.topic,
        message: msg.toBytes(),
        timestamp: msg.sent,
      },
    ])
    return msg
  }

  private async encodeMessage(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content: any,
    options?: SendOptions
  ): Promise<MessageV2> {
    const payload = await this.client.encodeContent(content, options)
    const header: xmtpEnvelope.MessageHeaderV2 = {
      topic: this.topic,
      createdNs: dateToNs(options?.timestamp || new Date()),
    }
    const headerBytes = xmtpEnvelope.MessageHeaderV2.encode(header).finish()
    const digest = await sha256(concat(headerBytes, payload))
    const signed = {
      payload,
      sender: this.client.keys.getPublicKeyBundle(),
      signature: await this.client.keys.getCurrentPreKey().sign(digest),
    }
    const signedBytes = xmtpEnvelope.SignedContent.encode(signed).finish()
    const ciphertext = await encrypt(signedBytes, this.keyMaterial, headerBytes)
    const protoMsg = {
      v1: undefined,
      v2: { headerBytes, ciphertext },
    }
    const bytes = xmtpEnvelope.Message.encode(protoMsg).finish()
    const msg = await MessageV2.create(protoMsg, header, signed, bytes)
    return msg
  }

  async decodeMessage(env: messageApi.Envelope): Promise<MessageV2> {
    if (!env.message || !env.contentTopic) {
      throw new Error('empty envelope')
    }
    const messageBytes = b64Decode(env.message.toString())
    const msg = xmtpEnvelope.Message.decode(messageBytes)
    if (!msg.v2) {
      throw new Error('unknown message version')
    }
    const msgv2 = msg.v2
    const header = xmtpEnvelope.MessageHeaderV2.decode(msgv2.headerBytes)
    if (header.topic !== this.topic) {
      throw new Error('topic mismatch')
    }
    if (!msgv2.ciphertext) {
      throw new Error('missing ciphertext')
    }
    const decrypted = await decrypt(
      new Ciphertext(msgv2.ciphertext),
      this.keyMaterial,
      msgv2.headerBytes
    )
    const signed = xmtpEnvelope.SignedContent.decode(decrypted)
    if (
      !signed.sender?.identityKey ||
      !signed.sender?.preKey ||
      !signed.signature
    ) {
      throw new Error('incomplete signed content')
    }

    const digest = await sha256(concat(msgv2.headerBytes, signed.payload))
    if (
      !new SignedPublicKey(signed.sender?.preKey).verify(
        new Signature(signed.signature),
        digest
      )
    ) {
      throw new Error('invalid signature')
    }
    const message = await MessageV2.create(msg, header, signed, messageBytes)
    message.contentTopic = env.contentTopic
    await this.client.decodeContent(message)
    return message
  }
}

export type Conversation = ConversationV1 | ConversationV2

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const ab = new Uint8Array(a.length + b.length)
  ab.set(a)
  ab.set(b, a.length)
  return ab
}

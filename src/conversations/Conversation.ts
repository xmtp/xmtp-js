import { buildUserIntroTopic } from './../utils'
import { DecodedMessage } from './../Message'
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
import { MessageV1, MessageV2, decodeContent } from '../Message'
import { messageApi, message, content as proto, fetcher } from '@xmtp/proto'
import {
  encrypt,
  decrypt,
  SignedPublicKey,
  Signature,
  PublicKeyBundle,
} from '../crypto'
import Ciphertext from '../crypto/Ciphertext'
import { sha256 } from '../crypto/encryption'
import { buildDirectMessageTopic, dateToNs, nsToDate } from '../utils'
import { ContentTypeText } from '../codecs/Text'
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
  async messages(opts?: ListMessagesOptions): Promise<DecodedMessage[]> {
    const topics = [
      buildDirectMessageTopic(this.peerAddress, this.client.address),
    ]
    return this.client.listEnvelopes(
      topics,
      this.decodeMessage.bind(this),
      opts
    )
  }

  get topic(): string {
    return buildDirectMessageTopic(this.peerAddress, this.client.address)
  }

  messagesPaginated(
    opts?: ListMessagesPaginatedOptions
  ): AsyncGenerator<DecodedMessage[]> {
    return this.client.listEnvelopesPaginated(
      [this.topic],
      this.decodeMessage.bind(this),
      opts
    )
  }

  /**
   * Returns a Stream of any new messages to/from the peerAddress
   */
  streamMessages(): Promise<Stream<DecodedMessage>> {
    return Stream.create<DecodedMessage>(
      this.client,
      [this.topic],
      this.decodeMessage.bind(this)
    )
  }

  async decodeMessage({
    message,
    contentTopic,
  }: messageApi.Envelope): Promise<DecodedMessage> {
    const messageBytes = fetcher.b64Decode(message as unknown as string)
    const decoded = await MessageV1.fromBytes(messageBytes)
    const { senderAddress, recipientAddress } = decoded

    // Filter for topics
    if (
      !senderAddress ||
      !recipientAddress ||
      !contentTopic ||
      buildDirectMessageTopic(senderAddress, recipientAddress) !== this.topic
    ) {
      throw new Error('Headers do not match intended recipient')
    }
    const decrypted = await decoded.decrypt(this.client.legacyKeys)
    const { content, contentType, error } = decodeContent(
      decrypted,
      this.client
    )

    return DecodedMessage.fromV1Message(
      decoded,
      content,
      contentType,
      contentTopic,
      this,
      error
    )
  }

  /**
   * Send a message into the conversation
   */
  async send(
    content: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    options?: SendOptions
  ): Promise<DecodedMessage> {
    let topics: string[]
    let recipient = await this.client.getUserContact(this.peerAddress)
    if (!recipient) {
      throw new Error(`recipient ${this.peerAddress} is not registered`)
    }
    if (!(recipient instanceof PublicKeyBundle)) {
      recipient = recipient.toLegacyBundle()
    }

    if (!this.client.contacts.has(this.peerAddress)) {
      topics = [
        buildUserIntroTopic(this.peerAddress),
        buildUserIntroTopic(this.client.address),
        this.topic,
      ]
      this.client.contacts.add(this.peerAddress)
    } else {
      topics = [this.topic]
    }

    const contentType = options?.contentType || ContentTypeText
    const timestamp = options?.timestamp || new Date()
    const payload = await this.client.encodeContent(content, options)
    const msg = await MessageV1.encode(
      this.client.legacyKeys,
      recipient,
      payload,
      timestamp
    )

    await this.client.publishEnvelopes(
      topics.map((topic) => ({
        contentTopic: topic,
        message: msg.toBytes(),
        timestamp: msg.sent,
      }))
    )

    return DecodedMessage.fromV1Message(
      msg,
      content,
      contentType,
      topics[0], // Just use the first topic for the returned value
      this
    )
  }

  get clientAddress() {
    return this.client.address
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
  async messages(opts?: ListMessagesOptions): Promise<DecodedMessage[]> {
    return this.client.listEnvelopes(
      [this.topic],
      this.decodeMessage.bind(this),
      opts
    )
  }

  messagesPaginated(
    opts?: ListMessagesPaginatedOptions
  ): AsyncGenerator<DecodedMessage[]> {
    return this.client.listEnvelopesPaginated(
      [this.topic],
      this.decodeMessage.bind(this),
      opts
    )
  }

  /**
   * Returns a Stream of any new messages to/from the peerAddress
   */
  streamMessages(): Promise<Stream<DecodedMessage>> {
    return Stream.create<DecodedMessage>(
      this.client,
      [this.topic],
      this.decodeMessage.bind(this)
    )
  }

  /**
   * Send a message into the conversation
   */
  async send(
    content: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    options?: SendOptions
  ): Promise<DecodedMessage> {
    const msg = await this.encodeMessage(content, options)
    await this.client.publishEnvelopes([
      {
        contentTopic: this.topic,
        message: msg.toBytes(),
        timestamp: msg.sent,
      },
    ])
    const contentType = options?.contentType || ContentTypeText

    return DecodedMessage.fromV2Message(
      msg,
      content,
      contentType,
      this.topic,
      this
    )
  }

  get clientAddress() {
    return this.client.address
  }

  private async encodeMessage(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content: any,
    options?: SendOptions
  ): Promise<MessageV2> {
    const payload = await this.client.encodeContent(content, options)
    const header: message.MessageHeaderV2 = {
      topic: this.topic,
      createdNs: dateToNs(options?.timestamp || new Date()),
    }
    const headerBytes = message.MessageHeaderV2.encode(header).finish()
    const digest = await sha256(concat(headerBytes, payload))
    const signed = {
      payload,
      sender: this.client.keys.getPublicKeyBundle(),
      signature: await this.client.keys.getCurrentPreKey().sign(digest),
    }
    const signedBytes = proto.SignedContent.encode(signed).finish()
    const ciphertext = await encrypt(signedBytes, this.keyMaterial, headerBytes)
    const protoMsg = {
      v1: undefined,
      v2: { headerBytes, ciphertext },
    }
    const bytes = message.Message.encode(protoMsg).finish()
    return MessageV2.create(protoMsg, header, signed, bytes)
  }

  async decodeMessage(env: messageApi.Envelope): Promise<DecodedMessage> {
    if (!env.message || !env.contentTopic) {
      throw new Error('empty envelope')
    }
    const messageBytes = b64Decode(env.message.toString())
    const msg = message.Message.decode(messageBytes)
    if (!msg.v2) {
      throw new Error('unknown message version')
    }
    const msgv2 = msg.v2
    const header = message.MessageHeaderV2.decode(msgv2.headerBytes)
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
    const signed = proto.SignedContent.decode(decrypted)
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
    const messageV2 = await MessageV2.create(msg, header, signed, messageBytes)
    const { content, contentType, error } = decodeContent(
      signed.payload,
      this.client
    )

    return DecodedMessage.fromV2Message(
      messageV2,
      content,
      contentType,
      env.contentTopic,
      this,
      error
    )
  }
}

export type Conversation = ConversationV1 | ConversationV2

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const ab = new Uint8Array(a.length + b.length)
  ab.set(a)
  ab.set(b, a.length)
  return ab
}

import {
  buildDirectMessageTopic,
  buildUserIntroTopic,
  dateToNs,
  nsToDate,
} from '../utils'
import { utils } from 'ethers'
import {
  decodeContent,
  DecodedMessage,
  DecodedMessageExport,
  MessageV1,
  MessageV2,
} from '../Message'
import Stream from '../Stream'
import Client, {
  encodeContent,
  ListMessagesOptions,
  ListMessagesPaginatedOptions,
  SendOptions,
} from '../Client'
import {
  InvitationContext,
  InvitationV1,
  SealedInvitationHeaderV1,
} from '../Invitation'
import {
  content as proto,
  fetcher,
  message,
  messageApi,
  privateKey as privateKeyProto,
  publicKey,
} from '@xmtp/proto'
import {
  decrypt,
  encrypt,
  PrivateKeyBundleV1,
  PrivateKeyBundleV2,
  PublicKeyBundle,
  Signature,
  SignedPublicKey,
} from '../crypto'
import Ciphertext from '../crypto/Ciphertext'
import { sha256 } from '../crypto/encryption'
import { ContentTypeText } from '../codecs/Text'
import { CodecRegistry } from '../MessageContent'

const { b64Decode } = fetcher

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

type ConversationV1Export = {
  version: 'v1'
  peerAddress: string
  createdAt: string
  topic: string
}

type ConversationV2Export = {
  version: 'v2'
  topic: string
  keyMaterial: string
  createdAt: string
  peerAddress: string
  context: InvitationContext | undefined
}

export type ConversationExport = ConversationV1Export | ConversationV2Export

/**
 * Conversation class allows you to view, stream, and send messages to/from a peer address
 */
export class ConversationV1 {
  peerAddress: string
  createdAt: Date
  context = null
  private client: Client
  readonly topic: string

  constructor(client: Client, address: string, createdAt: Date) {
    this.peerAddress = utils.getAddress(address)
    this.client = client
    this.createdAt = createdAt
    this.topic = buildDirectMessageTopic(this.peerAddress, this.client.address)
  }

  getClient(): Client {
    return this.client
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

  export(): ConversationV1Export {
    return {
      version: 'v1',
      peerAddress: this.peerAddress,
      createdAt: this.createdAt.toISOString(),
      topic: this.topic,
    }
  }

  static fromExport(
    client: Client,
    data: ConversationV1Export
  ): ConversationV1 {
    return new ConversationV1(
      client,
      data.peerAddress,
      new Date(data.createdAt)
    )
  }

  async decodeMessage(envelope: messageApi.Envelope): Promise<DecodedMessage> {
    const dme = await decodeMessageV1(
      envelope,
      this.export(),
      this.client,
      this.client.legacyKeys
    )
    return DecodedMessage.fromExport(dme, this)
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
    const msg = await encodeMessageV1(
      content,
      this.client.legacyKeys,
      recipient,
      this.client,
      options
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
  private keyMaterial: Uint8Array // MUST be kept secret
  context?: InvitationContext
  private client: Client
  createdAt: Date
  peerAddress: string

  constructor(
    client: Client,
    topic: string,
    keyMaterial: Uint8Array,
    peerAddress: string,
    createdAt: Date,
    context: InvitationContext | undefined
  ) {
    this.topic = topic
    this.keyMaterial = keyMaterial
    this.createdAt = createdAt
    this.context = context
    this.client = client
    this.peerAddress = peerAddress
  }

  getClient(): Client {
    return this.client
  }

  static async create(
    client: Client,
    invitation: InvitationV1,
    header: SealedInvitationHeaderV1
  ): Promise<ConversationV2> {
    const myKeys = client.keys.getPublicKeyBundle()
    const peer = myKeys.equals(header.sender) ? header.recipient : header.sender
    const peerAddress = utils.getAddress(await peer.walletSignatureAddress())
    return new ConversationV2(
      client,
      invitation.topic,
      invitation.aes256GcmHkdfSha256.keyMaterial,
      peerAddress,
      nsToDate(header.createdNs),
      invitation.context
    )
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

  async encodeMessage(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content: any,
    options?: SendOptions
  ): Promise<MessageV2> {
    return encodeMessageV2(
      content,
      this.export(),
      this.client.keys,
      this.client,
      options
    )
  }

  async decodeMessage(env: messageApi.Envelope): Promise<DecodedMessage> {
    const dme = await decodeMessageV2(env, this.export(), this.client)
    return DecodedMessage.fromExport(dme, this)
  }

  export(): ConversationV2Export {
    return {
      version: 'v2',
      topic: this.topic,
      keyMaterial: Buffer.from(this.keyMaterial).toString('base64'),
      peerAddress: this.peerAddress,
      createdAt: this.createdAt.toISOString(),
      context: this.context,
    }
  }

  static fromExport(
    client: Client,
    data: ConversationV2Export
  ): ConversationV2 {
    return new ConversationV2(
      client,
      data.topic,
      Buffer.from(data.keyMaterial, 'base64'),
      data.peerAddress,
      new Date(data.createdAt),
      data.context
    )
  }
}

export type Conversation = ConversationV1 | ConversationV2

export const conversationFromExport = (
  data: ConversationExport,
  client: Client
): Conversation => {
  switch (data.version) {
    case 'v1':
      return ConversationV1.fromExport(client, data)
    case 'v2':
      return ConversationV2.fromExport(client, data)
    default:
      throw new Error('unknown conversation version')
  }
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const ab = new Uint8Array(a.length + b.length)
  ab.set(a)
  ab.set(b, a.length)
  return ab
}

export async function decodeMessageV1(
  envelope: messageApi.Envelope,
  conversation: ConversationV1Export,
  registry: CodecRegistry,
  keys: privateKeyProto.PrivateKeyBundleV1
): Promise<DecodedMessageExport> {
  const legacyKeys = PrivateKeyBundleV1.from(keys)
  const { message, contentTopic } = envelope
  const messageBytes = fetcher.b64Decode(message as unknown as string)
  const decoded = await MessageV1.fromBytes(messageBytes)
  const { senderAddress, recipientAddress } = decoded

  // Filter for topics
  if (
    !senderAddress ||
    !recipientAddress ||
    !contentTopic ||
    buildDirectMessageTopic(senderAddress, recipientAddress) !==
      conversation.topic
  ) {
    throw new Error('Headers do not match intended recipient')
  }
  const decrypted = await decoded.decrypt(legacyKeys)
  const { content, contentType, error } = await decodeContent(
    decrypted,
    registry
  )

  return DecodedMessage.exportFromV1Message(
    decoded,
    content,
    contentType,
    contentTopic,
    conversation,
    error
  )
}

export async function decodeMessageV2(
  env: messageApi.Envelope,
  conversation: ConversationV2Export,
  registry: CodecRegistry
): Promise<DecodedMessageExport> {
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
  if (header.topic !== conversation.topic) {
    throw new Error('topic mismatch')
  }
  if (!msgv2.ciphertext) {
    throw new Error('missing ciphertext')
  }
  const decrypted = await decrypt(
    new Ciphertext(msgv2.ciphertext),
    conversation.keyMaterial,
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
  const { content, contentType, error } = await decodeContent(
    signed.payload,
    registry
  )

  return DecodedMessage.exportFromV2Message(
    messageV2,
    content,
    contentType,
    env.contentTopic,
    conversation,
    error
  )
}

export async function encodeMessageV1(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any,
  senderBundle: privateKeyProto.PrivateKeyBundleV1,
  recipientBundle: publicKey.PublicKeyBundle,
  registry: CodecRegistry,
  options?: SendOptions
): Promise<MessageV1> {
  const sender = PrivateKeyBundleV1.from(senderBundle)
  const recipient = PublicKeyBundle.from(recipientBundle)
  const timestamp = options?.timestamp || new Date()
  const payload = await encodeContent(content, registry, options)
  return MessageV1.encode(sender, recipient, payload, timestamp)
}

export async function encodeMessageV2(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any,
  conversation: ConversationV2Export,
  keyBundleV2: privateKeyProto.PrivateKeyBundleV2,
  registry: CodecRegistry,
  options?: SendOptions
): Promise<MessageV2> {
  const keys = PrivateKeyBundleV2.from(keyBundleV2)
  const payload = await encodeContent(content, registry, options)
  const header: message.MessageHeaderV2 = {
    topic: conversation.topic,
    createdNs: dateToNs(options?.timestamp || new Date()),
  }
  const headerBytes = message.MessageHeaderV2.encode(header).finish()
  const digest = await sha256(concat(headerBytes, payload))
  const signed = {
    payload,
    sender: keys.getPublicKeyBundle(),
    signature: await keys.getCurrentPreKey().sign(digest),
  }
  const signedBytes = proto.SignedContent.encode(signed).finish()
  const ciphertext = await encrypt(
    signedBytes,
    conversation.keyMaterial,
    headerBytes
  )
  const protoMsg = {
    v1: undefined,
    v2: { headerBytes, ciphertext },
  }
  const bytes = message.Message.encode(protoMsg).finish()
  return MessageV2.create(protoMsg, header, signed, bytes)
}

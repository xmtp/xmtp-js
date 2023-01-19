import type { Conversation } from './conversations/Conversation'
import type Client from './Client'
import { message as proto, content as protoContent } from '@xmtp/proto'
import Long from 'long'
import Ciphertext from './crypto/Ciphertext'
import {
  PublicKeyBundle,
  PrivateKeyBundleV1,
  PublicKey,
  SignedPublicKeyBundle,
  decrypt,
  encrypt,
} from './crypto'
import { bytesToHex } from './crypto/utils'
import { sha256 } from './crypto/encryption'
import {
  ContentTypeFallback,
  ContentTypeId,
  EncodedContent,
} from './MessageContent'
import { nsToDate } from './utils/date'

const headerBytesAndCiphertext = (
  msg: proto.Message
): [Uint8Array, Ciphertext] => {
  if (msg.v1?.ciphertext) {
    return [msg.v1.headerBytes, new Ciphertext(msg.v1.ciphertext)]
  }
  if (msg.v2?.ciphertext) {
    return [msg.v2.headerBytes, new Ciphertext(msg.v2.ciphertext)]
  }
  throw new Error('unknown message version')
}

// Message is basic unit of communication on the network.
// Message timestamp is set by the sender.
class MessageBase {
  headerBytes: Uint8Array // encoded header bytes
  ciphertext: Ciphertext
  // content allows attaching decoded content to the Message
  // the message receiving APIs need to return a Message to provide access to the header fields like sender/recipient
  contentType?: ContentTypeId
  error?: Error
  /**
   * Identifier that is deterministically derived from the bytes of the message
   * header and ciphertext, where all those bytes are authenticated. This can
   * be used in determining uniqueness of messages.
   */
  id: string
  private bytes: Uint8Array

  constructor(id: string, bytes: Uint8Array, obj: proto.Message) {
    ;[this.headerBytes, this.ciphertext] = headerBytesAndCiphertext(obj)
    this.id = id
    this.bytes = bytes
  }

  toBytes(): Uint8Array {
    return this.bytes
  }
}

// Message header carries the sender and recipient keys used to protect message.
// Message timestamp is set by the sender.
export class MessageV1 extends MessageBase implements proto.MessageV1 {
  header: proto.MessageHeaderV1 // eslint-disable-line camelcase
  // wallet address derived from the signature of the message recipient
  senderAddress: string | undefined
  conversation = undefined

  constructor(
    id: string,
    bytes: Uint8Array,
    obj: proto.Message,
    header: proto.MessageHeaderV1,
    senderAddress: string | undefined
  ) {
    super(id, bytes, obj)
    this.senderAddress = senderAddress
    this.header = header
  }

  static async create(
    obj: proto.Message,
    header: proto.MessageHeaderV1,
    bytes: Uint8Array
  ): Promise<MessageV1> {
    if (!header.sender) {
      throw new Error('missing message sender')
    }
    const senderAddress = new PublicKeyBundle(
      header.sender
    ).walletSignatureAddress()
    const id = bytesToHex(await sha256(bytes))
    return new MessageV1(id, bytes, obj, header, senderAddress)
  }

  get sent(): Date {
    return new Date(this.header.timestamp.toNumber())
  }

  // wallet address derived from the signature of the message recipient
  get recipientAddress(): string | undefined {
    if (!this.header?.recipient?.identityKey) {
      return undefined
    }
    return new PublicKey(
      this.header.recipient.identityKey
    ).walletSignatureAddress()
  }

  // encrypt and serialize the message
  static async encode(
    sender: PrivateKeyBundleV1,
    recipient: PublicKeyBundle,
    message: Uint8Array,
    timestamp: Date
  ): Promise<MessageV1> {
    const secret = await sender.sharedSecret(
      recipient,
      sender.getCurrentPreKey().publicKey,
      false
    )
    // eslint-disable-next-line camelcase
    const header: proto.MessageHeaderV1 = {
      sender: sender.getPublicKeyBundle(),
      recipient,
      timestamp: Long.fromNumber(timestamp.getTime()),
    }
    const headerBytes = proto.MessageHeaderV1.encode(header).finish()
    const ciphertext = await encrypt(message, secret, headerBytes)
    const protoMsg = {
      v1: { headerBytes, ciphertext },
      v2: undefined,
    }
    const bytes = proto.Message.encode(protoMsg).finish()
    return MessageV1.create(protoMsg, header, bytes)
  }

  static fromBytes(bytes: Uint8Array): Promise<MessageV1> {
    const message = proto.Message.decode(bytes)
    const [headerBytes] = headerBytesAndCiphertext(message)
    const header = proto.MessageHeaderV1.decode(headerBytes)
    if (!header) {
      throw new Error('missing message header')
    }
    if (!header.sender) {
      throw new Error('missing message sender')
    }
    if (!header.sender.identityKey) {
      throw new Error('missing message sender identity key')
    }
    if (!header.sender.preKey) {
      throw new Error('missing message sender pre-key')
    }
    if (!header.recipient) {
      throw new Error('missing message recipient')
    }
    if (!header.recipient.identityKey) {
      throw new Error('missing message recipient identity-key')
    }
    if (!header.recipient.preKey) {
      throw new Error('missing message recipient pre-key')
    }

    return MessageV1.create(message, header, bytes)
  }

  async decrypt(viewer: PrivateKeyBundleV1) {
    const header = this.header
    // This should never happen if the message was created through the fromBytes function
    // But needed for type safety
    if (
      !header.recipient?.identityKey ||
      !header.sender?.identityKey ||
      !header.recipient.preKey ||
      !header.sender.preKey
    ) {
      throw new Error('Missing headers')
    }
    const recipient = new PublicKeyBundle({
      identityKey: new PublicKey(header.recipient.identityKey),
      preKey: new PublicKey(header.recipient.preKey),
    })
    const sender = new PublicKeyBundle({
      identityKey: new PublicKey(header.sender.identityKey),
      preKey: new PublicKey(header.sender.preKey),
    })

    let secret: Uint8Array
    if (viewer.identityKey.matches(sender.identityKey)) {
      // viewer is the sender
      secret = await viewer.sharedSecret(recipient, sender.preKey, false)
    } else {
      // viewer is the recipient
      secret = await viewer.sharedSecret(sender, recipient.preKey, true)
    }

    return decrypt(this.ciphertext, secret, this.headerBytes)
  }
}

export class MessageV2 extends MessageBase implements proto.MessageV2 {
  senderAddress: string | undefined
  private header: proto.MessageHeaderV2 // eslint-disable-line camelcase
  private signed?: protoContent.SignedContent

  constructor(
    id: string,
    bytes: Uint8Array,
    obj: proto.Message,
    header: proto.MessageHeaderV2,
    signed: protoContent.SignedContent,
    // wallet address derived from the signature of the message sender
    senderAddress: string
  ) {
    super(id, bytes, obj)
    this.header = header
    this.signed = signed
    this.senderAddress = senderAddress
  }

  static async create(
    obj: proto.Message,
    header: proto.MessageHeaderV2,
    signed: protoContent.SignedContent,
    bytes: Uint8Array
  ): Promise<MessageV2> {
    const id = bytesToHex(await sha256(bytes))
    if (!signed.sender) {
      throw new Error('missing message sender')
    }
    const senderAddress = await new SignedPublicKeyBundle(
      signed.sender
    ).walletSignatureAddress()

    return new MessageV2(id, bytes, obj, header, signed, senderAddress)
  }

  get sent(): Date {
    return nsToDate(this.header.createdNs)
  }
}

export type Message = MessageV1 | MessageV2

export class DecodedMessage {
  id: string
  messageVersion: 'v1' | 'v2'
  senderAddress: string
  recipientAddress?: string
  sent: Date
  contentTopic: string
  conversation: Conversation
  contentType: ContentTypeId
  content: any // eslint-disable-line @typescript-eslint/no-explicit-any
  error?: Error

  constructor({
    id,
    messageVersion,
    senderAddress,
    recipientAddress,
    conversation,
    contentType,
    contentTopic,
    content,
    sent,
    error,
  }: DecodedMessage) {
    this.id = id
    this.messageVersion = messageVersion
    this.senderAddress = senderAddress
    this.recipientAddress = recipientAddress
    this.conversation = conversation
    this.contentType = contentType
    this.sent = sent
    this.error = error
    this.content = content
    this.contentTopic = contentTopic
  }

  static fromV1Message(
    message: MessageV1,
    content: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    contentType: ContentTypeId,
    contentTopic: string,
    conversation: Conversation,
    error?: Error
  ): DecodedMessage {
    const { id, senderAddress, recipientAddress, sent } = message
    if (!senderAddress) {
      throw new Error('Sender address is required')
    }
    return new DecodedMessage({
      id,
      messageVersion: 'v1',
      senderAddress,
      recipientAddress,
      sent,
      content,
      contentType,
      contentTopic,
      conversation,
      error,
    })
  }

  static fromV2Message(
    message: MessageV2,
    content: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    contentType: ContentTypeId,
    contentTopic: string,
    conversation: Conversation,
    error?: Error
  ): DecodedMessage {
    const { id, senderAddress, sent } = message
    if (!senderAddress) {
      throw new Error('Sender address is required')
    }

    return new DecodedMessage({
      id,
      messageVersion: 'v2',
      senderAddress,
      sent,
      content,
      contentType,
      contentTopic,
      conversation,
      error,
    })
  }
}

export function decodeContent(contentBytes: Uint8Array, client: Client) {
  const encodedContent = protoContent.EncodedContent.decode(contentBytes)

  if (!encodedContent.type) {
    throw new Error('missing content type')
  }

  let content: any // eslint-disable-line @typescript-eslint/no-explicit-any
  let contentType = new ContentTypeId(encodedContent.type)
  let error: Error | undefined

  const codec = client.codecFor(contentType)
  if (codec) {
    content = codec.decode(encodedContent as EncodedContent, client)
  } else {
    error = new Error('unknown content type ' + contentType)
    if (encodedContent.fallback) {
      content = encodedContent.fallback
      contentType = ContentTypeFallback
    }
  }

  return { content, contentType, error }
}

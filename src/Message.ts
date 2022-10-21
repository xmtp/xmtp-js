import { xmtpEnvelope as proto } from '@xmtp/proto'
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
import type { ConversationV2 } from './conversations/Conversation'
import { NoMatchingPreKeyError } from './crypto/errors'
import { bytesToHex } from './crypto/utils'
import { sha256 } from './crypto/encryption'
import { ContentTypeId } from './MessageContent'
import { nsToDate } from './utils'

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
  decrypted?: Uint8Array
  // content allows attaching decoded content to the Message
  // the message receiving APIs need to return a Message to provide access to the header fields like sender/recipient
  contentType?: ContentTypeId
  content?: any // eslint-disable-line @typescript-eslint/no-explicit-any
  contentTopic?: string // content topic that triggered the message
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
    const msg = await MessageV1.create(protoMsg, header, bytes)
    msg.decrypted = message
    return msg
  }

  // deserialize and decrypt the message;
  // throws if any part of the messages (including the header) was tampered with
  // or the recipient preKey used to encrypt the message is not recognized
  static async decode(
    viewer: PrivateKeyBundleV1,
    bytes: Uint8Array
  ): Promise<MessageV1> {
    const message = proto.Message.decode(bytes)
    const [headerBytes, ciphertext] = headerBytesAndCiphertext(message)
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
    const recipient = new PublicKeyBundle({
      identityKey: new PublicKey(header.recipient.identityKey),
      preKey: new PublicKey(header.recipient.preKey),
    })
    const sender = new PublicKeyBundle({
      identityKey: new PublicKey(header.sender.identityKey),
      preKey: new PublicKey(header.sender.preKey),
    })
    const msg = await MessageV1.create(message, header, bytes)
    let secret: Uint8Array
    try {
      if (viewer.identityKey.matches(sender.identityKey)) {
        // viewer is the sender
        secret = await viewer.sharedSecret(recipient, sender.preKey, false)
      } else {
        // viewer is the recipient
        secret = await viewer.sharedSecret(sender, recipient.preKey, true)
      }
    } catch (e) {
      if (!(e instanceof NoMatchingPreKeyError)) {
        throw e
      }
      msg.error = e
      return msg
    }
    msg.decrypted = await decrypt(ciphertext, secret, headerBytes)
    return msg
  }
}

export class MessageV2 extends MessageBase implements proto.MessageV2 {
  senderAddress: string | undefined
  conversation: ConversationV2
  private header: proto.MessageHeaderV2 // eslint-disable-line camelcase
  private signed?: proto.SignedContent

  constructor(
    id: string,
    bytes: Uint8Array,
    obj: proto.Message,
    header: proto.MessageHeaderV2,
    signed: proto.SignedContent,
    // wallet address derived from the signature of the message sender
    senderAddress: string,
    conversation: ConversationV2
  ) {
    super(id, bytes, obj)
    this.decrypted = signed.payload
    this.header = header
    this.signed = signed
    this.senderAddress = senderAddress
    this.conversation = conversation
  }

  static async create(
    obj: proto.Message,
    header: proto.MessageHeaderV2,
    signed: proto.SignedContent,
    bytes: Uint8Array,
    conversation: ConversationV2
  ): Promise<MessageV2> {
    const id = bytesToHex(await sha256(bytes))
    if (!signed.sender) {
      throw new Error('missing message sender')
    }
    const senderAddress = await new SignedPublicKeyBundle(
      signed.sender
    ).walletSignatureAddress()
    return new MessageV2(
      id,
      bytes,
      obj,
      header,
      signed,
      senderAddress,
      conversation
    )
  }

  get sent(): Date {
    return nsToDate(this.header.createdNs)
  }
}

export type Message = MessageV1 | MessageV2

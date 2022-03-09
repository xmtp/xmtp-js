import * as proto from './proto/messaging'
import Ciphertext from './crypto/Ciphertext'
import {
  PublicKeyBundle,
  PrivateKeyBundle,
  PublicKey,
  decrypt,
  encrypt,
} from './crypto'
import { NoMatchingPreKeyError } from './crypto/errors'
import { bytesToHex } from './crypto/utils'
import { sha256 } from './crypto/encryption'
import { ContentTypeId } from './MessageContent'

// Message is basic unit of communication on the network.
// Message header carries the sender and recipient keys used to protect message.
// Message timestamp is set by the sender.
export default class Message implements proto.Message {
  header: proto.MessageHeader // eslint-disable-line camelcase
  headerBytes: Uint8Array // encoded header bytes
  ciphertext: Ciphertext
  decrypted?: Uint8Array
  // content allows attaching decoded content to the Message
  // the message receiving APIs need to return a Message to provide access to the header fields like sender/recipient
  contentType?: ContentTypeId
  content?: any // eslint-disable-line @typescript-eslint/no-explicit-any
  error?: Error
  /**
   * Identifier that is deterministically derived from the bytes of the message
   * header and ciphertext, where all those bytes are authenticated. This can
   * be used in determining uniqueness of messages.
   */
  id: string
  private bytes: Uint8Array

  constructor(
    id: string,
    bytes: Uint8Array,
    obj: proto.Message,
    header: proto.MessageHeader
  ) {
    this.id = id
    this.bytes = bytes
    this.headerBytes = obj.headerBytes
    this.header = header
    if (!obj.ciphertext) {
      throw new Error('missing message ciphertext')
    }
    this.ciphertext = new Ciphertext(obj.ciphertext)
  }

  toBytes(): Uint8Array {
    return this.bytes
  }

  static async create(
    obj: proto.Message,
    header: proto.MessageHeader,
    bytes: Uint8Array
  ): Promise<Message> {
    const id = bytesToHex(await sha256(bytes))
    return new Message(id, bytes, obj, header)
  }

  static async fromBytes(bytes: Uint8Array): Promise<Message> {
    const msg = proto.Message.decode(bytes)
    const header = proto.MessageHeader.decode(msg.headerBytes)
    return Message.create(msg, header, bytes)
  }

  get sent(): Date | undefined {
    return this.header ? new Date(this.header?.timestamp) : undefined
  }

  // wallet address of the message sender
  get senderAddress(): string | undefined {
    if (!this.header?.sender?.identityKey) {
      return undefined
    }
    return new PublicKey(
      this.header.sender.identityKey
    ).walletSignatureAddress()
  }

  // wallet address of the message recipient
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
    sender: PrivateKeyBundle,
    recipient: PublicKeyBundle,
    message: Uint8Array,
    timestamp: Date
  ): Promise<Message> {
    const secret = await sender.sharedSecret(
      recipient,
      sender.getCurrentPreKey().publicKey,
      false
    )
    // eslint-disable-next-line camelcase
    const header: proto.MessageHeader = {
      sender: sender.getPublicKeyBundle(),
      recipient,
      timestamp: timestamp.getTime(),
    }
    const headerBytes = proto.MessageHeader.encode(header).finish()
    const ciphertext = await encrypt(message, secret, headerBytes)
    const protoMsg = { headerBytes: headerBytes, ciphertext }
    const bytes = proto.Message.encode(protoMsg).finish()
    const msg = await Message.create(protoMsg, header, bytes)
    msg.decrypted = message
    return msg
  }

  // deserialize and decrypt the message;
  // throws if any part of the messages (including the header) was tampered with
  // or the recipient preKey used to encrypt the message is not recognized
  static async decode(
    viewer: PrivateKeyBundle,
    bytes: Uint8Array
  ): Promise<Message> {
    const message = proto.Message.decode(bytes)
    const header = proto.MessageHeader.decode(message.headerBytes)
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
    const recipient = new PublicKeyBundle(
      new PublicKey(header.recipient.identityKey),
      new PublicKey(header.recipient.preKey)
    )
    const sender = new PublicKeyBundle(
      new PublicKey(header.sender.identityKey),
      new PublicKey(header.sender.preKey)
    )
    if (!message.ciphertext?.aes256GcmHkdfSha256) {
      throw new Error('missing message ciphertext')
    }
    const ciphertext = new Ciphertext(message.ciphertext)
    const msg = await Message.create(message, header, bytes)
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
    msg.decrypted = await decrypt(ciphertext, secret, message.headerBytes)
    return msg
  }
}

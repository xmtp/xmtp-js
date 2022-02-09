import * as proto from './proto/messaging'
import Ciphertext from './crypto/Ciphertext'
import {
  PublicKeyBundle,
  PrivateKeyBundle,
  PublicKey,
  decrypt,
  encrypt,
} from './crypto'

// Message is basic unit of communication on the network.
// Message header carries the sender and recipient keys used to protect message.
// Message timestamp is set by the sender.
export default class Message implements proto.Message {
  header: proto.Message_Header | undefined // eslint-disable-line camelcase
  ciphertext: Ciphertext | undefined
  decrypted: string | undefined

  constructor(obj: proto.Message) {
    this.header = obj.header
    if (obj.ciphertext) {
      this.ciphertext = new Ciphertext(obj.ciphertext)
    }
  }

  toBytes(): Uint8Array {
    return proto.Message.encode(this).finish()
  }

  static fromBytes(bytes: Uint8Array): Message {
    return new Message(proto.Message.decode(bytes))
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
    message: string,
    timestamp: Date
  ): Promise<Message> {
    const bytes = new TextEncoder().encode(message)

    const secret = await sender.sharedSecret(
      recipient,
      sender.getCurrentPreKey().publicKey,
      false
    )
    // eslint-disable-next-line camelcase
    const header: proto.Message_Header = {
      sender: sender.getPublicKeyBundle(),
      recipient,
      timestamp: timestamp.getTime(),
    }
    const headerBytes = proto.Message_Header.encode(header).finish()
    const ciphertext = await encrypt(bytes, secret, headerBytes)

    const msg = new Message({
      header,
      ciphertext,
    })
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
    if (!message.header) {
      throw new Error('missing message header')
    }
    if (!message.header.sender) {
      throw new Error('missing message sender')
    }
    if (!message.header.sender.identityKey) {
      throw new Error('missing message sender identity key')
    }
    if (!message.header.sender.preKey) {
      throw new Error('missing message sender pre-key')
    }
    if (!message.header.recipient) {
      throw new Error('missing message recipient')
    }
    if (!message.header.recipient.identityKey) {
      throw new Error('missing message recipient identity-key')
    }
    if (!message.header.recipient.preKey) {
      throw new Error('missing message recipient pre-key')
    }
    const recipient = new PublicKeyBundle(
      new PublicKey(message.header.recipient.identityKey),
      new PublicKey(message.header.recipient.preKey)
    )
    const sender = new PublicKeyBundle(
      new PublicKey(message.header.sender.identityKey),
      new PublicKey(message.header.sender.preKey)
    )
    let secret: Uint8Array
    if (viewer.identityKey.matches(sender.identityKey)) {
      // viewer is the sender
      secret = await viewer.sharedSecret(recipient, sender.preKey, false)
    } else {
      // viewer is the recipient
      secret = await viewer.sharedSecret(sender, recipient.preKey, true)
    }
    if (!message.ciphertext?.aes256GcmHkdfSha256) {
      throw new Error('missing message ciphertext')
    }
    const ciphertext = new Ciphertext(message.ciphertext)
    const headerBytes = proto.Message_Header.encode({
      sender: sender,
      recipient: recipient,
      timestamp: message.header.timestamp,
    }).finish()
    bytes = await decrypt(ciphertext, secret, headerBytes)
    const msg = new Message(message)
    msg.decrypted = new TextDecoder().decode(bytes)
    return msg
  }
}

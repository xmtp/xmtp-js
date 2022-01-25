import * as proto from './proto/messaging';
import Ciphertext from './crypto/Ciphertext';
import {
  PublicKeyBundle,
  PrivateKeyBundle,
  PublicKey,
  decrypt,
  encrypt
} from './crypto';

export default class Message implements proto.Message {
  header: proto.Message_Header | undefined;
  ciphertext: Ciphertext | undefined;
  decrypted: string | undefined;

  constructor(obj: proto.Message) {
    this.header = obj.header;
    if (obj.ciphertext) {
      this.ciphertext = new Ciphertext(obj.ciphertext);
    }
  }

  toBytes(): Uint8Array {
    return proto.Message.encode(this).finish();
  }

  static fromBytes(bytes: Uint8Array): Message {
    return new Message(proto.Message.decode(bytes));
  }

  senderAddress(): string | undefined {
    if (!this.header?.sender?.identityKey) {
      return undefined;
    }
    return new PublicKey(
      this.header.sender.identityKey
    ).walletSignatureAddress();
  }

  // encrypt and serialize the message
  static async encode(
    sender: PrivateKeyBundle,
    recipient: PublicKeyBundle,
    message: string
  ): Promise<Message> {
    const bytes = new TextEncoder().encode(message);
    const ciphertext = await this.encrypt(bytes, sender, recipient);
    const msg = new Message({
      header: {
        sender: sender.publicKeyBundle,
        recipient
      },
      ciphertext
    });
    msg.decrypted = message;
    return msg;
  }

  // deserialize and decrypt the message;
  // throws if any part of the messages (including the header) was tampered with
  static async decode(
    recipient: PrivateKeyBundle,
    bytes: Uint8Array
  ): Promise<Message> {
    const message = proto.Message.decode(bytes);
    if (!message.header) {
      throw new Error('missing message header');
    }
    if (!message.header.sender) {
      throw new Error('missing message sender');
    }
    if (!message.header.sender.identityKey) {
      throw new Error('missing message sender identity key');
    }
    if (!message.header.sender.preKey) {
      throw new Error('missing message sender pre key');
    }
    if (!message.header.recipient) {
      throw new Error('missing message recipient');
    }
    if (!message.header.recipient?.preKey) {
      throw new Error('missing message recipient pre key');
    }
    const sender = new PublicKeyBundle(
      new PublicKey(message.header.sender.identityKey),
      new PublicKey(message.header.sender.preKey)
    );
    if (!recipient.preKey) {
      throw new Error('missing message recipient pre key');
    }
    if (recipient.preKeys.length === 0) {
      throw new Error('missing pre key');
    }
    if (
      !recipient.preKey.matches(new PublicKey(message.header.recipient.preKey))
    ) {
      throw new Error('recipient pre-key mismatch');
    }
    if (!message.ciphertext?.aes256GcmHkdfSha256) {
      throw new Error('missing message ciphertext');
    }
    const ciphertext = new Ciphertext(message.ciphertext);
    bytes = await this.decrypt(ciphertext, sender, recipient);
    const msg = new Message(message);
    msg.decrypted = new TextDecoder().decode(bytes);
    return msg;
  }

  // encrypt the plaintext with a symmetric key derived from the peers' key bundles.
  static async encrypt(
    plain: Uint8Array,
    sender: PrivateKeyBundle,
    recipient: PublicKeyBundle
  ): Promise<Ciphertext> {
    const secret = await sender.sharedSecret(recipient, false);
    const ad = proto.Message_Header.encode({
      sender: sender.publicKeyBundle,
      recipient: recipient
    }).finish();
    return encrypt(plain, secret, ad);
  }

  // decrypt the encrypted content using a symmetric key derived from the peers' key bundles.
  static async decrypt(
    encrypted: Ciphertext,
    sender: PublicKeyBundle,
    recipient: PrivateKeyBundle
  ): Promise<Uint8Array> {
    const secret = await recipient.sharedSecret(sender, true);
    const ad = proto.Message_Header.encode({
      sender: sender,
      recipient: recipient.publicKeyBundle
    }).finish();
    return decrypt(encrypted, secret, ad);
  }
}

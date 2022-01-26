import * as proto from './proto/message';
import Ciphertext from './crypto/Ciphertext';
import { KeyBundle } from './crypto';

export class Header implements proto.Message_Header {
  sender: KeyBundle | undefined;
  recipient: KeyBundle | undefined;
  decrypted: string | undefined;

  constructor(obj: proto.Message_Header) {
    if (obj.sender) {
      this.sender = new KeyBundle(obj.sender);
    }
    if (obj.recipient) {
      this.recipient = new KeyBundle(obj.recipient);
    }
  }

  toBytes(): Uint8Array {
    return proto.Message_Header.encode(this).finish();
  }

  static fromBytes(bytes: Uint8Array): Header {
    return new Header(proto.Message_Header.decode(bytes));
  }
}

export default class Message implements proto.Message {
  header: Header | undefined;
  ciphertext: Ciphertext | undefined;
  decrypted: string | undefined;

  constructor(obj: proto.Message) {
    if (obj.header) {
      this.header = new Header(obj.header);
    }
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
}

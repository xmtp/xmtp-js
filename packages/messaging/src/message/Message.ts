import { Header } from './Header';
import * as proto from '../proto/messaging';
import Ciphertext from '../crypto/Ciphertext';

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

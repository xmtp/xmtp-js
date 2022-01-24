import * as proto from '../../src/proto/message';
import * as secp from '@noble/secp256k1';
import PublicKey from './PublicKey';

// Signature represents an ECDSA signature with recovery bit.
export default class Signature {
  bytes: Uint8Array; // compact format [ R || S ], 64 bytes
  recovery: number; // recovery bit 0 | 1
  constructor(bytes: Uint8Array, recovery: number) {
    if (bytes.length !== 64) {
      throw new Error(`invalid signature length: ${bytes.length}`);
    }
    this.bytes = bytes;
    if (recovery !== 0 && recovery !== 1) {
      throw new Error(`invalid recovery bit: ${recovery}`);
    }
    this.recovery = recovery;
  }

  // decode serialized Signature
  static decode(bytes: Uint8Array): Signature {
    const sig = proto.Signature.decode(bytes);
    return Signature.fromDecoded(sig);
  }

  // build Signature from proto.Signature structure
  static fromDecoded(sig: proto.Signature): Signature {
    if (sig.ecdsaCompact) {
      return new Signature(sig.ecdsaCompact.bytes, sig.ecdsaCompact.recovery);
    }
    throw new Error('unrecognized signature');
  }

  // If the signature is valid for the provided digest
  // then return the public key that validates it.
  // Otherwise return undefined.
  getPublicKey(digest: Uint8Array): PublicKey | undefined {
    const bytes = secp.recoverPublicKey(digest, this.bytes, this.recovery);
    return bytes ? PublicKey.fromBytes(bytes) : undefined;
  }

  // If the signature is valid for the provided digest
  // return the address derived from te public key that validest it.
  // Otherwise return undefined.
  getEthereumAddress(digest: Uint8Array): string | undefined {
    const pub = this.getPublicKey(digest);
    if (!pub) {
      return undefined;
    }
    return pub.getEthereumAddress();
  }

  // serialize Signature into bytes
  encode(): Uint8Array {
    return proto.Signature.encode(this.toBeEncoded()).finish();
  }

  // build proto.Signature from Signature
  toBeEncoded(): proto.Signature {
    return {
      ecdsaCompact: {
        bytes: this.bytes,
        recovery: this.recovery
      }
    };
  }
}

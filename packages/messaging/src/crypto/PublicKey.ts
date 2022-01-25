import * as proto from '../../src/proto/messaging';
import * as secp from '@noble/secp256k1';
import Signature from './Signature';
import PrivateKey from './PrivateKey';
import { hexToBytes } from './utils';
import * as ethers from 'ethers';

// PublicKey respresents uncompressed secp256k1 public key,
// that can optionally be signed with another trusted key pair.
export default class PublicKey implements proto.PublicKey {
  secp256k1Uncompressed: proto.PublicKey_Secp256k1Uncompresed | undefined;
  signature?: Signature | undefined;

  constructor(obj: proto.PublicKey) {
    if (!obj?.secp256k1Uncompressed?.bytes) {
      throw new Error('invalid public key');
    }
    if (obj.secp256k1Uncompressed.bytes.length !== 65) {
      throw new Error(
        `invalid public key length: ${obj.secp256k1Uncompressed.bytes.length}`
      );
    }
    if (obj.secp256k1Uncompressed.bytes[0] !== 4) {
      throw new Error(
        `unrecognized public key prefix: ${obj.secp256k1Uncompressed.bytes[0]}`
      );
    }
    this.secp256k1Uncompressed = obj.secp256k1Uncompressed;
    if (obj.signature) {
      this.signature = new Signature(obj.signature);
    }
  }

  // create PublicKey that corresponds to the provided PublicKey
  static fromPrivateKey(pri: PrivateKey): PublicKey {
    if (!pri.secp256k1) {
      throw new Error('invalid private key');
    }
    return new PublicKey({
      secp256k1Uncompressed: {
        bytes: secp.getPublicKey(pri.secp256k1.bytes)
      }
    });
  }

  // verify that Signature was created from provided digest using the corresponding PrivateKey
  verify(signature: Signature, digest: Uint8Array): boolean {
    if (!this.secp256k1Uncompressed) {
      return false;
    }
    if (!signature.ecdsaCompact) {
      return false;
    }
    return secp.verify(
      signature.ecdsaCompact.bytes,
      digest,
      this.secp256k1Uncompressed.bytes
    );
  }

  // verify that the provided PublicKey was signed by the corresponding PrivateKey
  async verifyKey(pub: PublicKey): Promise<boolean> {
    if (typeof pub.signature === undefined) {
      return false;
    }
    if (!pub.secp256k1Uncompressed) {
      return false;
    }
    const digest = await secp.utils.sha256(pub.secp256k1Uncompressed.bytes);
    return pub.signature ? this.verify(pub.signature, digest) : false;
  }

  // sign the key using a wallet
  async signWithWallet(wallet: ethers.Signer) {
    if (!this.secp256k1Uncompressed) {
      throw new Error('missing public key');
    }
    const sigString = await wallet.signMessage(
      this.secp256k1Uncompressed.bytes
    );
    const eSig = ethers.utils.splitSignature(sigString);
    const r = hexToBytes(eSig.r);
    const s = hexToBytes(eSig.s);
    const sigBytes = new Uint8Array(64);
    sigBytes.set(r);
    sigBytes.set(s, r.length);
    this.signature = new Signature({
      ecdsaCompact: {
        bytes: sigBytes,
        recovery: eSig.recoveryParam
      }
    });
  }

  // if the key was signed by a wallet, and the signature is valid,
  // then return the wallet address, otherwise throw
  walletSignatureAddress(): string {
    if (!this.signature) {
      throw new Error('key is not signed');
    }
    if (!this.secp256k1Uncompressed) {
      throw new Error('missing public key');
    }
    const digest = hexToBytes(
      ethers.utils.hashMessage(this.secp256k1Uncompressed.bytes)
    );
    const pk = this.signature.getPublicKey(digest);
    if (!pk) {
      throw new Error('key was not signed by a wallet');
    }
    return pk.getEthereumAddress();
  }

  // derive Ethereum address from this PublicKey
  getEthereumAddress(): string {
    if (!this.secp256k1Uncompressed) {
      throw new Error('missing public key');
    }
    return ethers.utils.computeAddress(this.secp256k1Uncompressed.bytes);
  }

  // is other the same/equivalent PublicKey?
  equals(other: PublicKey): boolean {
    if (!this.secp256k1Uncompressed || !other.secp256k1Uncompressed) {
      return !this.secp256k1Uncompressed && !other.secp256k1Uncompressed;
    }
    for (let i = 0; i < this.secp256k1Uncompressed.bytes.length; i++) {
      if (
        this.secp256k1Uncompressed.bytes[i] !==
        other.secp256k1Uncompressed.bytes[i]
      ) {
        return false;
      }
    }
    return true;
  }

  toBytes(): Uint8Array {
    return proto.PublicKey.encode(this).finish();
  }

  static fromBytes(bytes: Uint8Array): PublicKey {
    return new PublicKey(proto.PublicKey.decode(bytes));
  }
}

import * as proto from '../../src/proto/message';
import * as secp from '@noble/secp256k1';
import Signature from './Signature';
import PrivateKey from './PrivateKey';
import { hexToBytes } from './utils';
import { keccak_256 as keccak256 } from '@noble/hashes/sha3';
import * as ethers from 'ethers';

// PublicKey respresents uncompressed secp256k1 public key,
// that can optionally be signed with another trusted key pair.
export default class PublicKey {
  bytes: Uint8Array; // uncompressed point [ P || X || Y ], 65 bytes
  signature?: Signature;
  constructor(bytes: Uint8Array, signature?: Signature) {
    if (bytes.length !== 65) {
      throw new Error(`invalid public key length: ${bytes.length}`);
    }
    if (bytes[0] !== 4) {
      throw new Error(`unrecognized public key prefix: ${bytes[0]}`);
    }
    this.bytes = bytes;
    this.signature = signature;
  }

  // create PublicKey that corresponds to the provided PublicKey
  static fromPrivateKey(pri: PrivateKey): PublicKey {
    return new PublicKey(secp.getPublicKey(pri.bytes));
  }

  // create PublicKey from the raw uncompressed point bytes [ P || X || Y ], 65 bytes
  static fromBytes(bytes: Uint8Array): PublicKey {
    return new PublicKey(bytes);
  }

  // decode serialized PublicKey
  static decode(bytes: Uint8Array): PublicKey {
    return PublicKey.fromDecoded(proto.PublicKey.decode(bytes));
  }

  // build PublicKey from proto.PublicKey
  static fromDecoded(key: proto.PublicKey): PublicKey {
    if (key.secp256k1Uncompressed) {
      if (key.signature) {
        const sig = Signature.fromDecoded(key.signature);
        return new PublicKey(key.secp256k1Uncompressed.bytes, sig);
      } else {
        return new PublicKey(key.secp256k1Uncompressed.bytes);
      }
    }
    throw new Error('unrecognized signature');
  }

  // verify that Signature was created from provided digest using the corresponding PrivateKey
  verify(signature: Signature, digest: Uint8Array): boolean {
    return secp.verify(signature.bytes, digest, this.bytes);
  }

  // verify that the provided PublicKey was signed by the corresponding PrivateKey
  async verifyKey(pub: PublicKey): Promise<boolean> {
    if (typeof pub.signature === undefined) {
      return false;
    }
    const digest = await secp.utils.sha256(pub.bytes);
    return pub.signature ? this.verify(pub.signature, digest) : false;
  }

  // sign the key using a wallet
  async signWithWallet(wallet: ethers.Signer) {
    const sigString = await wallet.signMessage(this.bytes);
    const eSig = ethers.utils.splitSignature(sigString);
    const r = hexToBytes(eSig.r);
    const s = hexToBytes(eSig.s);
    const sigBytes = new Uint8Array(64);
    sigBytes.set(r);
    sigBytes.set(s, r.length);
    this.signature = new Signature(sigBytes, eSig.recoveryParam);
  }

  // if the key was signed by a wallet, and the signature is valid,
  // then return the wallet address, otherwise throw
  walletSignatureAddress(): string {
    if (!this.signature) {
      throw new Error('key is not signed');
    }
    const digest = hexToBytes(ethers.utils.hashMessage(this.bytes));
    const pk = this.signature.getPublicKey(digest);
    if (!pk) {
      throw new Error('key was not signed by a wallet');
    }
    return ethers.utils.computeAddress(pk.bytes);
  }

  // derive Ethereum address from this PublicKey
  getEthereumAddress(): string {
    // drop the uncompressed format prefix byte
    const key = this.bytes.slice(1);
    const bytes = keccak256(key).subarray(-20);
    return '0x' + secp.utils.bytesToHex(bytes);
  }

  // serialize this PublicKey
  encode(): Uint8Array {
    return proto.PublicKey.encode(this.toBeEncoded()).finish();
  }

  // build proto.PublicKey from this PublicKey
  toBeEncoded(): proto.PublicKey {
    const key: proto.PublicKey = {
      secp256k1Uncompressed: { bytes: this.bytes }
    };
    if (this.signature) {
      key.signature = this.signature.toBeEncoded();
    }
    return key;
  }

  // is other the same/equivalent PublicKey?
  equals(other: PublicKey): boolean {
    for (let i = 0; i < this.bytes.length; i++) {
      if (this.bytes[i] !== other.bytes[i]) {
        return false;
      }
    }
    return true;
  }
}

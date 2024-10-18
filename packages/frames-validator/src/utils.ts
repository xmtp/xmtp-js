import { bytesToHex } from "@noble/curves/abstract/utils";
import { secp256k1 } from "@noble/curves/secp256k1";
import { sha256 } from "@noble/hashes/sha256";
import { publicKey, type signature } from "@xmtp/proto";
import type { SignedPublicKeyBundle } from "@xmtp/xmtp-js";
import {
  getAddress,
  hashMessage,
  keccak256,
  bytesToHex as viemBytesToHex,
} from "viem/utils";

export type ECDSACompactWithRecovery = {
  bytes: Uint8Array; // compact representation [ R || S ], 64 bytes
  recovery: number; // recovery bit
};

// hexToBytes implementation that is compatible with `xmtp-js`'s implementation
export function hexToBytes(s: string): Uint8Array {
  if (s.startsWith("0x")) {
    s = s.slice(2);
  }
  const bytes = new Uint8Array(s.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    const j = i * 2;
    bytes[i] = Number.parseInt(s.slice(j, j + 2), 16);
  }
  return bytes;
}

// Ensure the signature is valid
function ecdsaCheck(sig: ECDSACompactWithRecovery): void {
  if (sig.bytes.length !== 64) {
    throw new Error(`invalid signature length: ${sig.bytes.length}`);
  }
  if (sig.recovery !== 0 && sig.recovery !== 1) {
    throw new Error(`invalid recovery bit: ${sig.recovery}`);
  }
}

// Get the signature bytes from a Signature proto message, whether it is wallet signed or signed by
// an XMTP key
function extractSignature(
  signature: signature.Signature,
): ECDSACompactWithRecovery {
  if (signature.ecdsaCompact?.bytes) {
    ecdsaCheck(signature.ecdsaCompact);
    return signature.ecdsaCompact;
  } else if (signature.walletEcdsaCompact?.bytes) {
    ecdsaCheck(signature.walletEcdsaCompact);
    return signature.walletEcdsaCompact;
  } else {
    throw new Error("invalid signature");
  }
}

// Directly copied from `xmtp-js`
function walletSignatureText(keyBytes: Uint8Array): string {
  return (
    "XMTP : Create Identity\n" +
    `${bytesToHex(keyBytes)}\n` +
    "\n" +
    "For more info: https://xmtp.org/signatures/"
  );
}

// Ensure that the `SignedPublicKeyBundle` has the required fields
function validateSignedPublicKeyBundle(
  bundle: publicKey.SignedPublicKeyBundle,
): bundle is SignedPublicKeyBundle {
  if (!bundle.identityKey?.keyBytes) {
    return false;
  }
  if (!bundle.preKey?.keyBytes) {
    return false;
  }
  return true;
}

/**
 * Validate that a message was signed by the identity key in a `SignedPublicKeyBundle`
 * @param message Uint8array
 * @param sig signature.Signature
 * @param bundle publicKey.SignedPublicKeyBundle
 */
export function verifyIdentityKeySignature(
  message: Uint8Array,
  sig: signature.Signature,
  bundle: publicKey.SignedPublicKeyBundle,
) {
  if (!validateSignedPublicKeyBundle(bundle)) {
    throw new Error("Invalid public key bundle");
  }
  if (!sig.ecdsaCompact?.bytes) {
    throw new Error("Missing ECDSA compact");
  }
  const pubKey = publicKey.UnsignedPublicKey.decode(
    bundle.identityKey.keyBytes,
  );
  if (!pubKey.secp256k1Uncompressed?.bytes) {
    throw new Error("Missing key bytes");
  }

  const digest = sha256(message);
  const isVerified = secp256k1.verify(
    sig.ecdsaCompact.bytes,
    digest,
    pubKey.secp256k1Uncompressed.bytes,
  );
  if (!isVerified) {
    throw new Error("Invalid signature");
  }
}

function computeAddress(bytes: Uint8Array) {
  const publicKey = viemBytesToHex(bytes.slice(1));
  const hash = keccak256(publicKey);
  const address = hash.substring(hash.length - 40);
  return getAddress(`0x${address}`);
}

function recoverWalletAddress(
  messageString: string,
  sig: ECDSACompactWithRecovery,
) {
  const digest = hexToBytes(hashMessage(messageString));
  const pubKey = secp256k1.Signature.fromCompact(sig.bytes)
    .addRecoveryBit(sig.recovery)
    .recoverPublicKey(digest)
    .toRawBytes(false);

  return computeAddress(pubKey);
}

/**
 * Retrieve the wallet address from a `SignedPublicKeyBundle` proto
 * @param publicKeyBundle
 * @returns string wallet address
 */
export function verifyWalletSignature(
  publicKeyBundle: publicKey.SignedPublicKeyBundle,
) {
  if (!validateSignedPublicKeyBundle(publicKeyBundle)) {
    throw new Error("Invalid public key bundle");
  }
  const toVerify = extractSignature(publicKeyBundle.identityKey.signature);

  const signatureText = walletSignatureText(
    publicKeyBundle.identityKey.keyBytes,
  );

  const walletAddress = recoverWalletAddress(signatureText, toVerify);

  return walletAddress;
}

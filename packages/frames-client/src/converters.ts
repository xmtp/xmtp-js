import { publicKey } from "@xmtp/proto";

function publicKeyBytesToSign(pubKey: publicKey.PublicKey): Uint8Array {
  return publicKey.PublicKey.encode({
    timestamp: pubKey.timestamp,
    secp256k1Uncompressed: pubKey.secp256k1Uncompressed,
  }).finish();
}

function toSignedPublicKey(
  v1Key: publicKey.PublicKey,
  signedByWallet: boolean,
): publicKey.SignedPublicKey {
  if (!v1Key.signature) {
    throw new Error("Missing signature");
  }

  let v1Signature = v1Key.signature;
  if (signedByWallet) {
    v1Signature = {
      walletEcdsaCompact: v1Signature.ecdsaCompact,
      ecdsaCompact: undefined,
    };
  }

  return {
    keyBytes: publicKeyBytesToSign(v1Key),
    signature: v1Signature,
  };
}

export function v1ToV2Bundle(
  v1Bundle: publicKey.PublicKeyBundle,
): publicKey.SignedPublicKeyBundle {
  if (!v1Bundle.identityKey || !v1Bundle.preKey) {
    throw new Error("Invalid bundle");
  }

  return {
    identityKey: toSignedPublicKey(v1Bundle.identityKey, true),
    preKey: toSignedPublicKey(v1Bundle.preKey, false),
  };
}

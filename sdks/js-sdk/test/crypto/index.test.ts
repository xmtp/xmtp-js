import { assert } from "vitest";
import { PrivateKey } from "@/crypto/PrivateKey";
import { PrivateKeyBundleV1 } from "@/crypto/PrivateKeyBundle";
import { PublicKeyBundle } from "@/crypto/PublicKeyBundle";
import { crypto, decrypt, encrypt } from "@/encryption";

describe("Crypto", function () {
  it("signs keys and verifies signatures", async function () {
    const identityKey = PrivateKey.generate();
    const preKey = PrivateKey.generate();
    await identityKey.signKey(preKey.publicKey);
    expect(
      await identityKey.publicKey.verifyKey(preKey.publicKey),
    ).toBeTruthy();
  });

  it("encrypts and decrypts payload", async function () {
    const alice = PrivateKey.generate();
    const bob = PrivateKey.generate();
    const msg1 = "Yo!";
    const decrypted = new TextEncoder().encode(msg1);
    // Alice encrypts msg for Bob.
    const encrypted = await alice.encrypt(decrypted, bob.publicKey);
    // Bob decrypts msg from Alice.
    const decrypted2 = await bob.decrypt(encrypted, alice.publicKey);
    const msg2 = new TextDecoder().decode(decrypted2);
    expect(msg2).toEqual(msg1);
  });

  it("detects tampering with encrypted message", async function () {
    const alice = PrivateKey.generate();
    const bob = PrivateKey.generate();
    const msg1 = "Yo!";
    const decrypted = new TextEncoder().encode(msg1);
    // Alice encrypts msg for Bob.
    const encrypted = await alice.encrypt(decrypted, bob.publicKey);
    // Malory tampers with the message
    expect(encrypted.aes256GcmHkdfSha256).toBeTruthy();
    encrypted.aes256GcmHkdfSha256!.payload[2] ^= 4; // flip one bit
    // Bob attempts to decrypt msg from Alice.
    try {
      await bob.decrypt(encrypted, alice.publicKey);
      assert.fail("should have thrown");
    } catch (e) {
      expect(e).toBeTruthy();
    }
  });

  it("derives public key from signature", async function () {
    const pri = PrivateKey.generate();
    const digest = crypto.getRandomValues(new Uint8Array(16));
    const sig = await pri.sign(digest);
    const sigPub = sig.getPublicKey(digest);
    expect(sigPub).toBeTruthy();
    expect(sigPub!.secp256k1Uncompressed).toBeTruthy();
    expect(pri.publicKey.secp256k1Uncompressed).toBeTruthy();
    expect(sigPub!.secp256k1Uncompressed.bytes).toEqual(
      pri.publicKey.secp256k1Uncompressed.bytes,
    );
  });

  it("encrypts and decrypts payload with key bundles", async function () {
    const alice = await PrivateKeyBundleV1.generate();
    const bob = await PrivateKeyBundleV1.generate();
    const msg1 = "Yo!";
    const decrypted = new TextEncoder().encode(msg1);
    // Alice encrypts msg for Bob.
    const alicePublic = alice.getPublicKeyBundle();
    const bobPublic = bob.getPublicKeyBundle();
    let secret = await alice.sharedSecret(bobPublic, alicePublic.preKey, false);
    const encrypted = await encrypt(decrypted, secret);
    // Bob decrypts msg from Alice.
    secret = await bob.sharedSecret(alicePublic, bobPublic.preKey, true);
    const decrypted2 = await decrypt(encrypted, secret);
    const msg2 = new TextDecoder().decode(decrypted2);
    expect(msg2).toEqual(msg1);
  });

  it("serializes and deserializes keys and signatures", async function () {
    const alice = await PrivateKeyBundleV1.generate();
    const bytes = alice.getPublicKeyBundle().toBytes();
    expect(bytes.length >= 213).toBeTruthy();
    const pub2 = PublicKeyBundle.fromBytes(bytes);
    expect(pub2.identityKey).toBeTruthy();
    expect(pub2.preKey).toBeTruthy();
    expect(pub2.identityKey.verifyKey(pub2.preKey)).toBeTruthy();
  });
});

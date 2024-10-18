import { encrypt, getPublic } from "@/crypto/ecies";
import { PrivateKeyBundleV1 } from "@/crypto/PrivateKeyBundle";
import SignedEciesCiphertext from "@/crypto/SignedEciesCiphertext";
import { equalBytes } from "@/crypto/utils";
import { crypto } from "@/encryption";
import { newWallet } from "@test/helpers";

describe("SignedEciesCiphertext", () => {
  let bundle: PrivateKeyBundleV1;
  beforeEach(async () => {
    bundle = await PrivateKeyBundleV1.generate(newWallet());
  });

  it("round trips successfully", async () => {
    const rawData = new TextEncoder().encode("hi");
    const encrypted = await encrypt(
      getPublic(Buffer.from(bundle.identityKey.secp256k1.bytes)),
      Buffer.from(rawData),
    );

    const signedEcies = await SignedEciesCiphertext.create(
      encrypted,
      bundle.identityKey,
    );

    expect(signedEcies.signature).toBeDefined();
    expect(signedEcies.ciphertext.mac).toHaveLength(32);
    expect(signedEcies.ciphertext.iv).toHaveLength(16);
    expect(signedEcies.ciphertext.ephemeralPublicKey).toHaveLength(65);

    const asBytes = signedEcies.toBytes();
    expect(asBytes).toBeInstanceOf(Uint8Array);

    const fromBytes = await SignedEciesCiphertext.fromBytes(asBytes);
    expect(fromBytes.ciphertext.ciphertext).toEqual(
      signedEcies.ciphertext.ciphertext,
    );
    expect(
      equalBytes(
        fromBytes.signature.ecdsaCompact!.bytes,
        signedEcies.signature.ecdsaCompact!.bytes,
      ),
    ).toBeTruthy();

    const verificationResult = await fromBytes.verify(
      bundle.identityKey.publicKey,
    );
    expect(verificationResult).toBe(true);
  });

  it("rejects malformed inputs", async () => {
    const rawData = new TextEncoder().encode("hello world");
    const goodInput = await encrypt(
      getPublic(Buffer.from(bundle.identityKey.secp256k1.bytes)),
      Buffer.from(rawData),
    );

    const badInput = crypto.getRandomValues(new Uint8Array(11));

    expect(
      SignedEciesCiphertext.create(
        { ...goodInput, iv: badInput },
        bundle.identityKey,
      ),
    ).rejects.toThrow("Invalid iv length");

    expect(
      SignedEciesCiphertext.create(
        { ...goodInput, ciphertext: badInput },
        bundle.identityKey,
      ),
    ).rejects.toThrow("Invalid ciphertext length");

    expect(
      SignedEciesCiphertext.create(
        { ...goodInput, mac: badInput },
        bundle.identityKey,
      ),
    ).rejects.toThrow("Invalid mac length");

    expect(
      SignedEciesCiphertext.create(
        { ...goodInput, ephemeralPublicKey: badInput },
        bundle.identityKey,
      ),
    ).rejects.toThrow("Invalid ephemPublicKey length");
  });

  it("rejects incorrect signatures", async () => {
    const rawData = new TextEncoder().encode("hi");
    const stranger = await PrivateKeyBundleV1.generate(newWallet());
    const encrypted = await encrypt(
      getPublic(Buffer.from(bundle.identityKey.secp256k1.bytes)),
      Buffer.from(rawData),
    );

    const ciphertext = await SignedEciesCiphertext.create(
      encrypted,
      bundle.identityKey,
    );
    const signedWithWrongKey = await SignedEciesCiphertext.create(
      encrypted,
      stranger.identityKey,
    );

    ciphertext.signature = signedWithWrongKey.signature;

    expect(await ciphertext.verify(bundle.identityKey.publicKey)).toBe(false);
  });
});

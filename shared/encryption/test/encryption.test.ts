import crypto from "@/crypto";
import {
  exportHmacKey,
  generateHmacSignature,
  hkdfHmacKey,
  importHmacKey,
  verifyHmacSignature,
} from "@/encryption";

describe("HMAC encryption", () => {
  it("generates and validates HMAC", async () => {
    const secret = crypto.getRandomValues(new Uint8Array(32));
    const info = crypto.getRandomValues(new Uint8Array(32));
    const message = crypto.getRandomValues(new Uint8Array(32));
    const hmac = await generateHmacSignature(secret, info, message);
    const key = await hkdfHmacKey(secret, info);
    const valid = await verifyHmacSignature(key, hmac, message);
    expect(valid).toBe(true);
  });

  it("generates and validates HMAC with imported key", async () => {
    const secret = crypto.getRandomValues(new Uint8Array(32));
    const info = crypto.getRandomValues(new Uint8Array(32));
    const message = crypto.getRandomValues(new Uint8Array(32));
    const hmac = await generateHmacSignature(secret, info, message);
    const key = await hkdfHmacKey(secret, info);
    const exportedKey = await exportHmacKey(key);
    const importedKey = await importHmacKey(exportedKey);
    const valid = await verifyHmacSignature(importedKey, hmac, message);
    expect(valid).toBe(true);
  });

  it("generates different HMAC keys with different infos", async () => {
    const secret = crypto.getRandomValues(new Uint8Array(32));
    const info1 = crypto.getRandomValues(new Uint8Array(32));
    const info2 = crypto.getRandomValues(new Uint8Array(32));
    const key1 = await hkdfHmacKey(secret, info1);
    const key2 = await hkdfHmacKey(secret, info2);

    expect(await exportHmacKey(key1)).not.toEqual(await exportHmacKey(key2));
  });

  it("fails to validate HMAC with wrong message", async () => {
    const secret = crypto.getRandomValues(new Uint8Array(32));
    const info = crypto.getRandomValues(new Uint8Array(32));
    const message = crypto.getRandomValues(new Uint8Array(32));
    const hmac = await generateHmacSignature(secret, info, message);
    const key = await hkdfHmacKey(secret, info);
    const valid = await verifyHmacSignature(
      key,
      hmac,
      crypto.getRandomValues(new Uint8Array(32)),
    );
    expect(valid).toBe(false);
  });

  it("fails to validate HMAC with wrong key", async () => {
    const secret = crypto.getRandomValues(new Uint8Array(32));
    const info = crypto.getRandomValues(new Uint8Array(32));
    const message = crypto.getRandomValues(new Uint8Array(32));
    const hmac = await generateHmacSignature(secret, info, message);
    const valid = await verifyHmacSignature(
      await hkdfHmacKey(
        crypto.getRandomValues(new Uint8Array(32)),
        crypto.getRandomValues(new Uint8Array(32)),
      ),
      hmac,
      message,
    );
    expect(valid).toBe(false);
  });
});

import { Wallet } from "ethers";
import { PrivateKeyBundleV1 } from "@/crypto/PrivateKeyBundle";
import { equalBytes } from "@/crypto/utils";
import { Ciphertext } from "@/encryption";
import { decryptV1, encryptV1 } from "@/keystore/encryption";
import InMemoryKeystore from "@/keystore/InMemoryKeystore";
import InMemoryPersistence from "@/keystore/persistence/InMemoryPersistence";
import type { KeystoreInterface } from "@/keystore/rpcDefinitions";
import { MessageV1 } from "@/Message";
import { newWallet } from "@test/helpers";

describe("encryption primitives", () => {
  let aliceKeys: PrivateKeyBundleV1;
  let aliceWallet: Wallet;
  let aliceKeystore: KeystoreInterface;
  let bobKeys: PrivateKeyBundleV1;
  let bobWallet: Wallet;

  beforeEach(async () => {
    aliceWallet = newWallet();
    aliceKeys = await PrivateKeyBundleV1.generate(aliceWallet);
    aliceKeystore = await InMemoryKeystore.create(
      aliceKeys,
      InMemoryPersistence.create(),
    );
    bobWallet = newWallet();
    bobKeys = await PrivateKeyBundleV1.generate(bobWallet);
  });

  describe("decryptV1", () => {
    it("should decrypt a valid payload", async () => {
      const messageText = "Hello, world!";
      const message = new TextEncoder().encode(messageText);

      const payload = await MessageV1.encode(
        aliceKeystore,
        message,
        aliceKeys.getPublicKeyBundle(),
        bobKeys.getPublicKeyBundle(),
        new Date(),
      );

      const aliceDecrypted = await decryptV1(
        aliceKeys,
        bobKeys.getPublicKeyBundle(),
        payload.ciphertext,
        payload.headerBytes,
        true,
      );
      expect(new TextDecoder().decode(aliceDecrypted)).toEqual(messageText);

      const bobDecrypted = await decryptV1(
        bobKeys,
        aliceKeys.getPublicKeyBundle(),
        payload.ciphertext,
        payload.headerBytes,
        false,
      );
      expect(new TextDecoder().decode(bobDecrypted)).toEqual(messageText);

      expect(equalBytes(aliceDecrypted, bobDecrypted)).toBeTruthy();
    });

    it("fails to decrypt when wrong keys are used", async () => {
      const message = new TextEncoder().encode("should fail");

      const payload = await MessageV1.encode(
        aliceKeystore,
        message,
        aliceKeys.getPublicKeyBundle(),
        bobKeys.getPublicKeyBundle(),
        new Date(),
      );
      const charlieKeys = await PrivateKeyBundleV1.generate(
        Wallet.createRandom(),
      );

      expect(async () => {
        await decryptV1(
          charlieKeys,
          bobKeys.getPublicKeyBundle(),
          payload.ciphertext,
          payload.headerBytes,
          true,
        );
      }).rejects.toThrow();
    });
  });

  describe("encryptV1", () => {
    it("should round trip a valid payload", async () => {
      const messageText = "Hello, world!";
      const message = new TextEncoder().encode(messageText);
      const headerBytes = new Uint8Array(5);

      const ciphertext = await encryptV1(
        aliceKeys,
        bobKeys.getPublicKeyBundle(),
        message,
        headerBytes,
      );
      expect(ciphertext).toBeInstanceOf(Ciphertext);

      const decrypted = await decryptV1(
        aliceKeys,
        bobKeys.getPublicKeyBundle(),
        ciphertext,
        headerBytes,
        true,
      );
      expect(equalBytes(message, decrypted)).toBeTruthy();
    });
  });
});

import { PrivateKeyBundleV1 } from "@/crypto/PrivateKeyBundle";
import Signature from "@/crypto/Signature";
import { newWallet } from "@test/helpers";

describe("Crypto", function () {
  describe("Signature", function () {
    it("transplanting a wallet signature changes the derived wallet address", async function () {
      const alice = newWallet();
      const alicePri = await PrivateKeyBundleV1.generate(alice);
      const alicePub = alicePri.getPublicKeyBundle();
      expect(alicePub.identityKey.walletSignatureAddress()).toEqual(
        alice.address,
      );
      const malory = newWallet();
      expect(alice.address).not.toEqual(malory.address);
      const maloryPri = await PrivateKeyBundleV1.generate(malory);
      const maloryPub = maloryPri.getPublicKeyBundle();
      expect(maloryPub.identityKey.walletSignatureAddress()).toEqual(
        malory.address,
      );
      // malory transplants alice's wallet sig onto her own key bundle
      maloryPub.identityKey.signature = alicePub.identityKey.signature;
      expect(maloryPub.identityKey.walletSignatureAddress()).not.toEqual(
        alice.address,
      );
      expect(maloryPub.identityKey.walletSignatureAddress()).not.toEqual(
        malory.address,
      );
    });

    it("returns wallet address for either ecdsaCompact or walletEcdsaCompact signatures", async function () {
      const alice = newWallet();
      const alicePri = await PrivateKeyBundleV1.generate(alice);
      const alicePub = alicePri.getPublicKeyBundle();
      expect(alicePub.identityKey.signature?.ecdsaCompact).toBeTruthy();
      expect(alicePub.identityKey.walletSignatureAddress()).toEqual(
        alice.address,
      );

      // create a malformed v1 signature
      alicePub.identityKey.signature = new Signature({
        walletEcdsaCompact: {
          bytes: alicePub.identityKey.signature!.ecdsaCompact!.bytes,
          recovery: alicePub.identityKey.signature!.ecdsaCompact!.recovery,
        },
      });
      expect(alicePub.identityKey.signature.walletEcdsaCompact).toBeTruthy();
      expect(alicePub.identityKey.signature.ecdsaCompact).toEqual(undefined);
      expect(alicePub.identityKey.walletSignatureAddress()).toEqual(
        alice.address,
      );
    });
  });
});

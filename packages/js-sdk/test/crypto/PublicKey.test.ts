import { Wallet } from "ethers";
import Long from "long";
import { hexToBytes } from "viem";
import { PrivateKey, SignedPrivateKey } from "@/crypto/PrivateKey";
import { PublicKey, SignedPublicKey } from "@/crypto/PublicKey";
import Signature, { WalletSigner } from "@/crypto/Signature";
import { equalBytes } from "@/crypto/utils";
import { newWallet } from "@test/helpers";

describe("Crypto", function () {
  describe("Signed Keys", function () {
    it("generate, verify, encode, decode", async function () {
      const wallet = newWallet();
      const keySigner = new WalletSigner(wallet);
      const idPri = await SignedPrivateKey.generate(keySigner);
      const idPub = idPri.publicKey;
      const prePri = await SignedPrivateKey.generate(idPri);
      const prePub = prePri.publicKey;
      expect(idPub.verifyKey(prePub)).toBeTruthy();
      let signer = await idPub.signerKey();
      expect(signer).toBeTruthy();
      expect(wallet.address).toEqual(signer!.getEthereumAddress());
      signer = await prePub.signerKey();
      expect(signer).toBeTruthy();
      expect(idPub.getEthereumAddress()).toEqual(signer!.getEthereumAddress());
      let bytes = idPub.toBytes();
      const idPub2 = SignedPublicKey.fromBytes(bytes);
      expect(idPub.equals(idPub2)).toBeTruthy();
      bytes = idPri.toBytes();
      const idPri2 = SignedPrivateKey.fromBytes(bytes);
      expect(idPri.equals(idPri2)).toBeTruthy();
    });
    it("legacy conversation fails for ns creation timestamps", async function () {
      const wallet = newWallet();
      const keySigner = new WalletSigner(wallet);
      const idPri = await SignedPrivateKey.generate(keySigner);
      expect(idPri.publicKey.isFromLegacyKey()).toBeFalsy();
      expect(() => idPri.publicKey.toLegacyKey()).toThrow(
        "cannot be converted to legacy key",
      );
    });
    it("public key legacy roundtrip", async function () {
      const wallet = newWallet();
      const idPri = PrivateKey.generate();
      await idPri.publicKey.signWithWallet(wallet);
      const idPub = SignedPublicKey.fromLegacyKey(idPri.publicKey, true);
      expect(idPub.isFromLegacyKey()).toBeTruthy();
      const idPubLeg = idPub.toLegacyKey();
      const idPub2 = SignedPublicKey.fromLegacyKey(idPubLeg, true);
      expect(idPub.equals(idPub2)).toBeTruthy();

      const prePri = PrivateKey.generate();
      await idPri.signKey(prePri.publicKey);
      const prePub = SignedPublicKey.fromLegacyKey(prePri.publicKey, false);
      expect(prePub.isFromLegacyKey()).toBeTruthy();
      const prePubLeg = prePub.toLegacyKey();
      const prePub2 = SignedPublicKey.fromLegacyKey(prePubLeg, false);
      expect(prePub.equals(prePub2)).toBeTruthy();
      expect(idPub2.verifyKey(prePub2)).toBeTruthy();
    });
  });
  describe("PublicKey", function () {
    it("derives address from public key", function () {
      // using the sample from https://kobl.one/blog/create-full-ethereum-keypair-and-address/
      const bytes = hexToBytes(
        "0x04836b35a026743e823a90a0ee3b91bf615c6a757e2b60b9e1dc1826fd0dd16106f7bc1e8179f665015f43c6c81f39062fc2086ed849625c06e04697698b21855e",
      );
      const pub = new PublicKey({
        secp256k1Uncompressed: { bytes },
        timestamp: Long.fromNumber(new Date().getTime()),
      });
      const address = pub.getEthereumAddress();
      expect(address).toEqual("0x0BED7ABd61247635c1973eB38474A2516eD1D884");
    });

    it("human-friendly identity key signature request", async function () {
      const alice = PrivateKey.fromBytes(
        hexToBytes(
          "0x08aaa9dad3ed2f12220a206fd789a6ee2376bb6595b4ebace57c7a79e6e4f1f12c8416d611399eda6c74cb1a4c08aaa9dad3ed2f1a430a4104e208133ea0973a9968fe5362e5ac0a8bbbe2aa16d796add31f3d027a1b894389873d7f282163bceb1fc3ca60d589d1e667956c40fed4cdaa7edc1392d2100b8a",
        ),
      );
      const actual = WalletSigner.identitySigRequestText(
        alice.publicKey.bytesToSign(),
      );
      const expected =
        "XMTP : Create Identity\n08aaa9dad3ed2f1a430a4104e208133ea0973a9968fe5362e5ac0a8bbbe2aa16d796add31f3d027a1b894389873d7f282163bceb1fc3ca60d589d1e667956c40fed4cdaa7edc1392d2100b8a\n\nFor more info: https://xmtp.org/signatures/";
      expect(actual).toEqual(expected);
    });

    it("signs keys using a wallet", async function () {
      // create a wallet using a generated key
      const alice = PrivateKey.generate();
      expect(alice.secp256k1).toBeTruthy();
      const wallet = new Wallet(alice.secp256k1.bytes);
      // sanity check that we agree with the wallet about the address
      expect(wallet.address).toEqual(alice.publicKey.getEthereumAddress());
      // sign the public key using the wallet
      await alice.publicKey.signWithWallet(wallet);
      expect(alice.publicKey.signature).toBeTruthy();
      // validate the key signature and return wallet address
      const address = alice.publicKey.walletSignatureAddress();
      expect(address).toEqual(wallet.address);
    });

    it("derives address from public key with malformed v1 signature", async function () {
      // create a wallet using a generated key
      const alice = PrivateKey.generate();
      expect(alice.secp256k1).toBeTruthy();
      const wallet = new Wallet(alice.secp256k1.bytes);
      // sanity check that we agree with the wallet about the address
      expect(wallet.address).toEqual(alice.publicKey.getEthereumAddress());
      // sign the public key using the wallet
      await alice.publicKey.signWithWallet(wallet);
      expect(alice.publicKey.signature?.ecdsaCompact).toBeTruthy();

      // distort the v1 signature to only have a walletEcdsaCompact signature
      alice.publicKey.signature = new Signature({
        walletEcdsaCompact: {
          bytes: alice.publicKey.signature!.ecdsaCompact!.bytes,
          recovery: alice.publicKey.signature!.ecdsaCompact!.recovery,
        },
      });
      // create a new public key with the malformed signature
      const publicKey = new PublicKey(alice.publicKey);
      // validate the key signature and return wallet address
      expect(publicKey.signature?.ecdsaCompact).toBeTruthy();
      const address = publicKey.walletSignatureAddress();
      expect(address).toEqual(wallet.address);
    });

    it("converts legacy keys to new keys", async function () {
      // Key signed by a wallet
      const wallet = newWallet();
      const identityKey = PrivateKey.generate();
      await identityKey.publicKey.signWithWallet(wallet);
      const iPub = identityKey.publicKey;
      expect(iPub.walletSignatureAddress(), wallet.address);
      const iPub2 = SignedPublicKey.fromLegacyKey(iPub, true);
      expect(
        equalBytes(
          iPub2.secp256k1Uncompressed.bytes,
          iPub.secp256k1Uncompressed.bytes,
        ),
      ).toBe(true);
      expect(iPub2.generated).toEqual(iPub.generated);
      expect(equalBytes(iPub2.keyBytes, iPub.bytesToSign())).toBeTruthy();
      const address = await iPub2.walletSignatureAddress();
      expect(address).toEqual(wallet.address);

      // Key signed by a key
      const preKey = PrivateKey.generate();
      await identityKey.signKey(preKey.publicKey);
      const pPub = preKey.publicKey;
      const pPub2 = SignedPublicKey.fromLegacyKey(pPub);
      expect(
        equalBytes(
          pPub2.secp256k1Uncompressed.bytes,
          pPub.secp256k1Uncompressed.bytes,
        ),
      ).toBe(true);
      expect(pPub2.generated).toEqual(pPub.generated);
      expect(equalBytes(pPub2.keyBytes, pPub.bytesToSign())).toBeTruthy();
      expect(iPub2.verifyKey(pPub2)).toBeTruthy();
    });
  });
});

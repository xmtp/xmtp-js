import { vi } from "vitest";
import ApiClient, { ApiUrls } from "@/ApiClient";
import { PrivateKeyBundleV1 } from "@/crypto/PrivateKeyBundle";
import BrowserStoragePersistence from "@/keystore/persistence/BrowserStoragePersistence";
import PrefixedPersistence from "@/keystore/persistence/PrefixedPersistence";
import TopicPersistence from "@/keystore/persistence/TopicPersistence";
import { buildPersistenceFromOptions } from "@/keystore/providers/helpers";
import NetworkKeyManager from "@/keystore/providers/NetworkKeyManager";
import type { Signer } from "@/types/Signer";
import { newWallet, pollFor, sleep, wrapAsLedgerWallet } from "@test/helpers";
import { testProviderOptions } from "./helpers";

describe("NetworkKeyManager", () => {
  let wallet: Signer;
  let persistence: TopicPersistence;

  beforeEach(async () => {
    wallet = newWallet();
    persistence = new TopicPersistence(new ApiClient(ApiUrls.local));
  });

  it("round trips", async () => {
    const manager = new NetworkKeyManager(wallet, persistence);
    const bundle = await PrivateKeyBundleV1.generate(wallet);
    await manager.storePrivateKeyBundle(bundle);
    const returnedBundle = await pollFor(
      async () => {
        const bundle = await manager.loadPrivateKeyBundle();
        if (!bundle) {
          throw new Error("No bundle yet");
        }
        return bundle;
      },
      15000,
      100,
    );

    expect(returnedBundle).toBeDefined();
    expect(bundle.identityKey.toBytes()).toEqual(bundle.identityKey.toBytes());
    expect(bundle.identityKey.publicKey.signature?.ecdsaCompact?.bytes).toEqual(
      returnedBundle?.identityKey.publicKey.signature?.ecdsaCompact?.bytes,
    );
    expect(bundle.identityKey.secp256k1).toEqual(
      returnedBundle?.identityKey.secp256k1,
    );
    expect(bundle.preKeys).toHaveLength(returnedBundle?.preKeys.length);
    expect(bundle.preKeys[0].toBytes()).toEqual(
      returnedBundle?.preKeys[0].toBytes(),
    );
  });

  it("encrypts with Ledger and decrypts with Metamask", async () => {
    const wallet = newWallet();
    const ledgerLikeWallet = wrapAsLedgerWallet(wallet);
    const secureLedgerStore = new NetworkKeyManager(
      ledgerLikeWallet,
      persistence,
    );
    const secureNormalStore = new NetworkKeyManager(wallet, persistence);
    const originalBundle = await PrivateKeyBundleV1.generate(ledgerLikeWallet);

    await secureLedgerStore.storePrivateKeyBundle(originalBundle);
    await sleep(100);
    const returnedBundle = await secureNormalStore.loadPrivateKeyBundle();
    if (!returnedBundle) {
      throw new Error("No bundle returned");
    }

    expect(returnedBundle).toBeDefined();
    expect(originalBundle.identityKey.toBytes()).toEqual(
      returnedBundle.identityKey.toBytes(),
    );
    expect(originalBundle.preKeys).toHaveLength(returnedBundle.preKeys.length);
    expect(originalBundle.preKeys[0].toBytes()).toEqual(
      returnedBundle.preKeys[0].toBytes(),
    );
  });

  it("encrypts with Metamask and decrypts with Ledger", async () => {
    const wallet = newWallet();
    const ledgerLikeWallet = wrapAsLedgerWallet(wallet);
    const ledgerManager = new NetworkKeyManager(ledgerLikeWallet, persistence);
    const normalManager = new NetworkKeyManager(wallet, persistence);
    const originalBundle = await PrivateKeyBundleV1.generate(wallet);

    await normalManager.storePrivateKeyBundle(originalBundle);
    await sleep(100);
    const returnedBundle = await ledgerManager.loadPrivateKeyBundle();
    if (!returnedBundle) {
      throw new Error("No bundle returned");
    }

    expect(returnedBundle).toBeDefined();
    expect(originalBundle.identityKey.toBytes()).toEqual(
      returnedBundle.identityKey.toBytes(),
    );
    expect(originalBundle.preKeys).toHaveLength(returnedBundle.preKeys.length);
    expect(originalBundle.preKeys[0].toBytes()).toEqual(
      returnedBundle.preKeys[0].toBytes(),
    );
  });

  it("respects the options provided", async () => {
    const bundle = await PrivateKeyBundleV1.generate(wallet);
    const shouldBePrefixed = await buildPersistenceFromOptions(
      testProviderOptions({
        disablePersistenceEncryption: true,
        persistConversations: false,
      }),
      bundle,
    );
    expect(shouldBePrefixed).toBeInstanceOf(BrowserStoragePersistence);

    const shouldBeEncrypted = await buildPersistenceFromOptions(
      testProviderOptions({
        disablePersistenceEncryption: false,
        persistConversations: true,
      }),
      bundle,
    );
    expect(shouldBeEncrypted).toBeInstanceOf(PrefixedPersistence);
  });

  it("calls notifier on store", async () => {
    const mockNotifier = vi.fn();
    const manager = new NetworkKeyManager(wallet, persistence, mockNotifier);
    const bundle = await PrivateKeyBundleV1.generate(wallet);
    await manager.storePrivateKeyBundle(bundle);
    expect(mockNotifier).toHaveBeenCalledTimes(1);
  });
});

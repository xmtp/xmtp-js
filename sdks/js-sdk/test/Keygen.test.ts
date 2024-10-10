import ApiClient, { ApiUrls } from "@/ApiClient";
import Client, { defaultOptions } from "@/Client";
import { decodePrivateKeyBundle } from "@/crypto/PrivateKeyBundle";
import type { PublicKeyBundle } from "@/crypto/PublicKeyBundle";
import TopicPersistence from "@/keystore/persistence/TopicPersistence";
import NetworkKeyManager from "@/keystore/providers/NetworkKeyManager";
import type { Signer } from "@/types/Signer";
import { newWallet } from "./helpers";

describe("Key Generation", () => {
  let wallet: Signer;
  beforeEach(async () => {
    wallet = newWallet();
  });

  test("Network store", async () => {
    const opts = {
      env: "local" as keyof typeof ApiUrls,
    };
    const keys = await Client.getKeys(wallet, opts);
    const client = await Client.create(null, {
      ...opts,
      privateKeyOverride: keys,
    });
    expect(
      (
        decodePrivateKeyBundle(keys).getPublicKeyBundle() as PublicKeyBundle
      ).equals(client.publicKeyBundle),
    ).toBeTruthy();
  });

  // Make sure that the keys are being saved to the network upon generation
  test("Ensure persistence", async () => {
    const opts = defaultOptions({
      env: "local" as keyof typeof ApiUrls,
    });
    const keys = await Client.getKeys(wallet, opts);
    const manager = new NetworkKeyManager(
      wallet,
      new TopicPersistence(new ApiClient(ApiUrls.local)),
    );

    expect(
      (await manager.loadPrivateKeyBundle())
        ?.getPublicKeyBundle()
        .equals(
          decodePrivateKeyBundle(keys).getPublicKeyBundle() as PublicKeyBundle,
        ),
    ).toBeTruthy();
  });
});

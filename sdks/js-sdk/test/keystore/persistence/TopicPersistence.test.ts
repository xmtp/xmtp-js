import ApiClient, { ApiUrls } from "@/ApiClient";
import LocalAuthenticator from "@/authn/LocalAuthenticator";
import { PrivateKeyBundleV1 } from "@/crypto/PrivateKeyBundle";
import TopicPersistence from "@/keystore/persistence/TopicPersistence";
import { newWallet } from "@test/helpers";

// We restrict publishing to topics that do not match this pattern
const buildValidKey = (walletAddress: string) => `${walletAddress}/key_bundle`;

describe("TopicPersistence", () => {
  let apiClient: ApiClient;
  let bundle: PrivateKeyBundleV1;
  beforeEach(async () => {
    apiClient = new ApiClient(ApiUrls.local);
    bundle = await PrivateKeyBundleV1.generate(newWallet());
  });
  it("round trips items from the store", async () => {
    const input = new TextEncoder().encode("hello");
    const storageKey = buildValidKey(
      bundle.identityKey.publicKey.walletSignatureAddress(),
    );
    apiClient.setAuthenticator(new LocalAuthenticator(bundle.identityKey));
    const store = new TopicPersistence(apiClient);
    try {
      await store.setItem(storageKey, input);
    } catch (e) {
      console.log("Error setting item", e);
    }

    const output = await store.getItem(storageKey);
    expect(output).toEqual(input);
  });

  it("returns null for missing items", async () => {
    const store = new TopicPersistence(apiClient);
    const storageKey = buildValidKey(
      bundle.identityKey.publicKey.walletSignatureAddress(),
    );
    expect(await store.getItem(storageKey)).toBeNull();
  });

  it("allows overwriting of values", async () => {
    const firstInput = new TextEncoder().encode("hello");
    const storageKey = buildValidKey(
      bundle.identityKey.publicKey.walletSignatureAddress(),
    );
    const store = new TopicPersistence(apiClient);
    store.setAuthenticator(new LocalAuthenticator(bundle.identityKey));
    await store.setItem(storageKey, firstInput);
    expect(await store.getItem(storageKey)).toEqual(firstInput);

    const secondInput = new TextEncoder().encode("goodbye");
    await store.setItem(storageKey, secondInput);
    expect(await store.getItem(storageKey)).toEqual(secondInput);
  });
});

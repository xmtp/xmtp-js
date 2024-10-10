import { privateKey } from "@xmtp/proto";
import { PrivateKeyBundleV1 } from "@/crypto/PrivateKeyBundle";
import { KeystoreProviderUnavailableError } from "@/keystore/providers/errors";
import StaticKeystoreProvider from "@/keystore/providers/StaticKeystoreProvider";
import { newWallet } from "@test/helpers";
import { testProviderOptions } from "./helpers";

const ENV = "local";

describe("StaticKeystoreProvider", () => {
  it("works with a valid key", async () => {
    const key = await PrivateKeyBundleV1.generate(newWallet());
    const keyBytes = privateKey.PrivateKeyBundle.encode({
      v1: key,
      v2: undefined,
    }).finish();
    const provider = new StaticKeystoreProvider();
    const keystore = await provider.newKeystore(
      testProviderOptions({
        privateKeyOverride: keyBytes,
        env: ENV,
        persistConversations: false,
      }),
    );

    expect(keystore).not.toBeNull();
  });

  it("throws with an unset key", async () => {
    expect(
      new StaticKeystoreProvider().newKeystore(
        testProviderOptions({
          env: ENV,
          persistConversations: false,
        }),
      ),
    ).rejects.toThrow(KeystoreProviderUnavailableError);
  });

  it("fails with an invalid key", async () => {
    expect(
      new StaticKeystoreProvider().newKeystore(
        testProviderOptions({
          privateKeyOverride: Uint8Array.from([1, 2, 3]),
          env: ENV,
          persistConversations: false,
        }),
      ),
    ).rejects.toThrow();
  });
});

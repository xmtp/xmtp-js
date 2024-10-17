import { PrivateKeyBundleV1, SignedPublicKeyBundle } from "@xmtp/xmtp-js";
import { Wallet } from "ethers";
import { describe, expect, it } from "vitest";
import { v1ToV2Bundle } from "./converters";

describe("converters", () => {
  it("can convert a valid public key bundle", async () => {
    const v1Bundle = await PrivateKeyBundleV1.generate(Wallet.createRandom());
    const publicKeyBundle = v1Bundle.getPublicKeyBundle();

    const v2Bundle = v1ToV2Bundle(publicKeyBundle);
    const v2BundleInstance = new SignedPublicKeyBundle(v2Bundle);
    const downgradedBundle = v2BundleInstance.toLegacyBundle();

    expect(downgradedBundle.equals(publicKeyBundle)).toBe(true);
  });
});

import { decodeContactBundle, encodeContactBundle } from "@/ContactBundle";
import {
  PrivateKeyBundleV1,
  PrivateKeyBundleV2,
} from "@/crypto/PrivateKeyBundle";
import {
  PublicKeyBundle,
  SignedPublicKeyBundle,
} from "@/crypto/PublicKeyBundle";
import { newWallet } from "./helpers";

describe("ContactBundles", function () {
  it("roundtrip", async function () {
    const priv = await PrivateKeyBundleV1.generate();
    const pub = priv.getPublicKeyBundle();
    const bytes = encodeContactBundle(pub);
    const cb = decodeContactBundle(bytes);
    expect(cb).toBeInstanceOf(PublicKeyBundle);
    expect(pub.equals(cb as PublicKeyBundle)).toBeTruthy();
  });
  it("roundtrip v2", async function () {
    const wallet = newWallet();
    const priv = await PrivateKeyBundleV2.generate(wallet);
    const pub = priv.getPublicKeyBundle();
    const bytes = encodeContactBundle(pub);
    const cb = decodeContactBundle(bytes);
    expect(cb).toBeInstanceOf(SignedPublicKeyBundle);
    expect(pub.equals(cb as SignedPublicKeyBundle)).toBeTruthy();
  });
});

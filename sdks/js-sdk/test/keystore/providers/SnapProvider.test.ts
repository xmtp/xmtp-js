import { keystore as keystoreProto } from "@xmtp/proto";
import { vi, type Mock } from "vitest";
import HttpApiClient, { ApiUrls, type ApiClient } from "@/ApiClient";
import { KeystoreProviderUnavailableError } from "@/keystore/providers/errors";
import type { KeystoreProviderOptions } from "@/keystore/providers/interfaces";
import SnapKeystoreProvider from "@/keystore/providers/SnapProvider";
import {
  connectSnap,
  getSnap,
  getWalletStatus,
  hasMetamaskWithSnaps,
  initSnap,
} from "@/keystore/snapHelpers";
import type { Signer } from "@/types/Signer";
import { newWallet } from "@test/helpers";

vi.mock("@/keystore/snapHelpers");

describe("SnapProvider", () => {
  const provider = new SnapKeystoreProvider();
  const options = { env: "local" } as KeystoreProviderOptions;
  let apiClient: ApiClient;
  let wallet: Signer;

  beforeEach(async () => {
    apiClient = new HttpApiClient(ApiUrls.local);
    wallet = newWallet();
    vi.resetAllMocks();
  });

  it("should throw an error if no wallet is provided", async () => {
    await expect(
      provider.newKeystore(options, apiClient, undefined),
    ).rejects.toThrow("No wallet provided");
  });

  it("should throw a KeystoreProviderUnavailableError if MetaMask with Snaps is not detected", async () => {
    (hasMetamaskWithSnaps as Mock).mockReturnValue(Promise.resolve(false));

    await expect(
      provider.newKeystore(options, apiClient, wallet),
    ).rejects.toThrow(
      new KeystoreProviderUnavailableError("MetaMask with Snaps not detected"),
    );
  });

  it("should attempt to connect to the snap if it is not already connected", async () => {
    (hasMetamaskWithSnaps as Mock).mockReturnValue(Promise.resolve(true));
    (getWalletStatus as Mock).mockReturnValue(
      Promise.resolve(
        keystoreProto.GetKeystoreStatusResponse_KeystoreStatus
          .KEYSTORE_STATUS_INITIALIZED,
      ),
    );
    (getSnap as Mock).mockReturnValue(Promise.resolve(undefined));

    const keystore = await provider.newKeystore(options, apiClient, wallet);

    expect(keystore).toBeDefined();
    expect(getWalletStatus as Mock).toHaveBeenCalledTimes(1);
    expect(getSnap as Mock).toHaveBeenCalledTimes(1);
    expect(connectSnap as Mock).toHaveBeenCalledTimes(1);
    expect(initSnap as Mock).not.toHaveBeenCalled();
  });

  it("does not attempt to connect to the snap if it is already connected", async () => {
    (hasMetamaskWithSnaps as Mock).mockReturnValue(Promise.resolve(true));
    (getWalletStatus as Mock).mockReturnValue(
      Promise.resolve(
        keystoreProto.GetKeystoreStatusResponse_KeystoreStatus
          .KEYSTORE_STATUS_INITIALIZED,
      ),
    );
    (getSnap as Mock).mockReturnValue(Promise.resolve({}));
    (connectSnap as Mock).mockReturnValue(Promise.resolve());

    await provider.newKeystore(options, apiClient, wallet);
    expect(connectSnap as Mock).not.toHaveBeenCalled();
    expect(initSnap as Mock).not.toHaveBeenCalled();
  });

  it("initializes the snap if it is not already initialized", async () => {
    (hasMetamaskWithSnaps as Mock).mockReturnValue(Promise.resolve(true));
    (getWalletStatus as Mock).mockReturnValue(
      Promise.resolve(
        keystoreProto.GetKeystoreStatusResponse_KeystoreStatus
          .KEYSTORE_STATUS_UNINITIALIZED,
      ),
    );
    (getSnap as Mock).mockReturnValue(Promise.resolve({}));
    (connectSnap as Mock).mockReturnValue(Promise.resolve());
    (initSnap as Mock).mockReturnValue(Promise.resolve());

    const keystore = await provider.newKeystore(options, apiClient, wallet);

    expect(keystore).toBeDefined();
    expect(initSnap as Mock).toHaveBeenCalledTimes(1);
  });
});

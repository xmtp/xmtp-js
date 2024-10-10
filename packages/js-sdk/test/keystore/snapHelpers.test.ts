import { keystore } from "@xmtp/proto";
import { vi } from "vitest";
import { SNAP_LOCAL_ORIGIN } from "@/keystore/providers/SnapProvider";
import { getWalletStatus, hasMetamaskWithSnaps } from "@/keystore/snapHelpers";
import { b64Encode } from "@/utils/bytes";

const {
  GetKeystoreStatusRequest,
  GetKeystoreStatusResponse,
  GetKeystoreStatusResponse_KeystoreStatus: KeystoreStatus,
} = keystore;

// Setup the mocks for window.ethereum
const mockRequest = vi.hoisted(() => vi.fn());
vi.mock("@/utils/ethereum", () => {
  return {
    __esModule: true,
    getEthereum: vi.fn(() => {
      const ethereum: any = {
        request: mockRequest,
      };
      ethereum.providers = [ethereum];
      ethereum.detected = [ethereum];
      return ethereum;
    }),
  };
});

describe("snapHelpers", () => {
  beforeEach(() => {
    mockRequest.mockClear();
  });

  it("can check if the user has Flask installed", async () => {
    mockRequest.mockResolvedValue(["flask"]);

    expect(await hasMetamaskWithSnaps()).toBe(true);
    expect(mockRequest).toHaveBeenCalledTimes(1);
  });

  it("returns false when the user does not have flask installed", async () => {
    mockRequest.mockRejectedValue(new Error("foo"));

    expect(await hasMetamaskWithSnaps()).toBe(false);
    expect(mockRequest).toHaveBeenCalledTimes(2);
  });

  it("can check wallet status", async () => {
    const method = "getKeystoreStatus";
    const walletAddress = "0xfoo";
    const env = "dev";
    const resBytes = GetKeystoreStatusResponse.encode({
      status: KeystoreStatus.KEYSTORE_STATUS_INITIALIZED,
    }).finish();

    mockRequest.mockResolvedValue({
      res: b64Encode(resBytes, 0, resBytes.length),
    });

    const status = await getWalletStatus(
      { walletAddress, env },
      SNAP_LOCAL_ORIGIN,
    );
    expect(status).toBe(KeystoreStatus.KEYSTORE_STATUS_INITIALIZED);
    const expectedRequest = GetKeystoreStatusRequest.encode({
      walletAddress,
    }).finish();

    expect(mockRequest).toHaveBeenCalledWith({
      method: "wallet_invokeSnap",
      params: {
        snapId: SNAP_LOCAL_ORIGIN,
        request: {
          method,
          params: {
            req: b64Encode(expectedRequest, 0, expectedRequest.length),
            meta: { walletAddress, env },
          },
        },
      },
    });
  });
});

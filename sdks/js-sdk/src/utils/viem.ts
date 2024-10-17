import type { WalletClient } from "viem";
import type { Signer } from "@/types/Signer";

export function getSigner(wallet: Signer | WalletClient | null): Signer | null {
  if (!wallet) {
    return null;
  }
  if (isWalletClient(wallet)) {
    return convertWalletClientToSigner(wallet);
  }
  if (typeof wallet.getAddress !== "function") {
    throw new Error("Unknown wallet type");
  }
  return wallet;
}

function isWalletClient(wallet: Signer | WalletClient): wallet is WalletClient {
  return (
    "type" in wallet &&
    (wallet.type === "walletClient" || wallet.type === "base")
  );
}

export function convertWalletClientToSigner(
  walletClient: WalletClient,
): Signer {
  const { account } = walletClient;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!account || !account.address) {
    throw new Error("WalletClient is not configured");
  }

  return {
    // eslint-disable-next-line @typescript-eslint/require-await
    getAddress: async () => account.address,
    signMessage: async (message: string | Uint8Array) =>
      walletClient.signMessage({
        message: typeof message === "string" ? message : { raw: message },
        account,
      }),
  };
}

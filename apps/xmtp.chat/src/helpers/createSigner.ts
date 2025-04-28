import type { Signer } from "@xmtp/browser-sdk";
import { toBytes, type Hex, type WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export const createEphemeralSigner = (privateKey: Hex): Signer => {
  const account = privateKeyToAccount(privateKey);
  return {
    type: "EOA",
    getIdentifier: () => ({
      identifier: account.address.toLowerCase(),
      identifierKind: "Ethereum",
    }),
    signMessage: async (message: string) => {
      const signature = await account.signMessage({
        message,
      });
      return toBytes(signature);
    },
  };
};

export const createEOASigner = (
  address: `0x${string}`,
  walletClient: WalletClient,
): Signer => {
  return {
    type: "EOA",
    getIdentifier: () => ({
      identifier: address.toLowerCase(),
      identifierKind: "Ethereum",
    }),
    signMessage: async (message: string) => {
      const signature = await walletClient.signMessage({
        account: address,
        message,
      });
      return toBytes(signature);
    },
  };
};

export const createSCWSigner = (
  address: `0x${string}`,
  signMessageAsync: (args: { message: string }) => Promise<`0x${string}`>,
  chainId: bigint | number = 1,
): Signer => {
  console.log("Creating Smart Contract Wallet signer for address:", address);

  return {
    // Mark this as a Smart Contract Wallet signer
    type: "SCW",
    getIdentifier: () => ({
      identifier: address.toLowerCase(),
      identifierKind: "Ethereum",
    }),
    signMessage: async (message: string) => {
      // Sign the message using the smart contract wallet
      console.log("Smart Contract Wallet signing message");
      try {
        const signature = await signMessageAsync({ message });
        console.log("Smart Contract Wallet signature received:", signature);

        const signatureBytes = toBytes(signature);
        console.log("Signature bytes length:", signatureBytes.length);

        return signatureBytes;
      } catch (error) {
        console.error("Error in Smart Contract Wallet signMessage:", error);
        throw error;
      }
    },
    // Include getChainId for SCW compatibility
    getChainId: () => {
      console.log("SCW getChainId called, value:", chainId);
      return typeof chainId === "undefined"
        ? BigInt(1)
        : BigInt(chainId.toString());
    },
  };
};

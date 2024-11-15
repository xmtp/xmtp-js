import { Client, type Signer } from "@xmtp/browser-sdk";
import { toBytes } from "viem/utils";
import { createWallet } from "./wallets";

export const createClient = async (walletKey: string) => {
  const encryptionKeyHex = import.meta.env.VITE_ENCRYPTION_KEY;
  if (!encryptionKeyHex) {
    throw new Error("VITE_ENCRYPTION_KEY must be set in the environment");
  }
  const encryptionBytes = toBytes(encryptionKeyHex);
  const wallet = createWallet(walletKey);
  const signer: Signer = {
    getAddress: () => wallet.account.address,
    signMessage: async (message: string) => {
      const signature = await wallet.signMessage({
        message,
      });
      return toBytes(signature);
    },
  };
  const client = await Client.create(signer, encryptionBytes, {
    env: "local",
  });
  return client;
};

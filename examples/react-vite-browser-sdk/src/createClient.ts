import { Client } from "@xmtp/browser-sdk";
import { createWallet } from "./wallets";

export const createClient = async (walletKey: string) => {
  const wallet = createWallet(walletKey);
  const client = await Client.create(wallet.account.address, {
    env: "local",
  });
  return client;
};

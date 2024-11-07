import { Client, SignatureRequestType } from "@xmtp/browser-sdk";
import { toBytes } from "viem/utils";
import { createWallet } from "./wallets";

type Wallet = ReturnType<typeof createWallet>;

export const getSignature = async (client: Client, wallet: Wallet) => {
  const signatureText = await client.getCreateInboxSignatureText();
  if (signatureText) {
    const signature = await wallet.signMessage({
      message: signatureText,
    });
    return toBytes(signature);
  }
  return null;
};

export const createClient = async (walletKey: string) => {
  const wallet = createWallet(walletKey);
  const client = await Client.create(wallet.account.address, {
    env: "local",
  });
  const isRegistered = await client.isRegistered();
  if (!isRegistered) {
    const signature = await getSignature(client, wallet);
    if (signature) {
      await client.addSignature(SignatureRequestType.CreateInbox, signature);
    }
    await client.registerIdentity();
  }
  return client;
};

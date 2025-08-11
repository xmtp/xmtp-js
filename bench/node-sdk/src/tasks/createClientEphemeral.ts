import { Client, HistorySyncUrls, type Signer } from "@xmtp/node-sdk";
import { generatePrivateKey } from "viem/accounts";
import { createSigner } from "@/util/xmtp";

export const setup = () => {
  const key = generatePrivateKey();
  return createSigner(key);
};

export const run = (signer: Signer) => {
  return Client.create(signer, {
    env: "local",
    dbPath: null,
    historySyncUrl: HistorySyncUrls.local,
  });
};

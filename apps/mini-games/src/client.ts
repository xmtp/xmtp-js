import { MiniAppCodec } from "@xmtp/content-type-mini-app";
import {
  Client,
  IdentifierKind,
  type Signer,
  type XmtpEnv,
} from "@xmtp/node-sdk";
import { hexToUint8Array } from "uint8array-extras";
import { createWalletClient, http, toBytes } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

interface User {
  key: `0x${string}`;
  account: ReturnType<typeof privateKeyToAccount>;
  wallet: ReturnType<typeof createWalletClient>;
}

const createUser = (key: string): User => {
  const account = privateKeyToAccount(key as `0x${string}`);
  return {
    key: key as `0x${string}`,
    account,
    wallet: createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(),
    }),
  };
};

const createSigner = (key: string): Signer => {
  const user = createUser(key);
  return {
    type: "EOA",
    getIdentifier: () => ({
      identifierKind: IdentifierKind.Ethereum,
      identifier: user.account.address.toLowerCase(),
    }),
    signMessage: async (message: string) => {
      const signature = await user.wallet.signMessage({
        message,
        account: user.account,
      });
      return toBytes(signature);
    },
  };
};

const getEncryptionKeyFromHex = (hex: string) => {
  return hexToUint8Array(hex);
};

if (!process.env.WALLET_KEY || !process.env.ENCRYPTION_KEY) {
  throw new Error("WALLET_KEY and ENCRYPTION_KEY must be set");
}

const signer = createSigner(process.env.WALLET_KEY);
const dbEncryptionKey = getEncryptionKeyFromHex(process.env.ENCRYPTION_KEY);
const env = (process.env.XMTP_ENV || "dev") as XmtpEnv;

export const client = await Client.create(signer, {
  dbEncryptionKey,
  env,
  codecs: [new MiniAppCodec()],
});

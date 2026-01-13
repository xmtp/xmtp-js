import { IdentifierKind, Signer, type HexString } from "@xmtp/node-sdk";
import {
  createWalletClient,
  http,
  toBytes,
  type Chain,
  type PrivateKeyAccount,
  type WalletClient,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

export const createUser = (key?: HexString, chain: Chain = sepolia) => {
  const accountKey = key ?? generatePrivateKey();
  const account = privateKeyToAccount(accountKey);
  return createWalletClient({
    account,
    chain,
    transport: http(),
  });
};

export const createEOASigner = (
  wallet: WalletClient & { account: PrivateKeyAccount },
): Extract<Signer, { type: "EOA" }> => {
  const identifier = {
    identifier: wallet.account.address.toLowerCase(),
    identifierKind: IdentifierKind.Ethereum,
  };
  return {
    type: "EOA",
    getIdentifier: () => identifier,
    signMessage: async (message: string) => {
      const signature = await wallet.signMessage({
        account: wallet.account,
        message,
      });
      return toBytes(signature);
    },
  };
};

import {
  IdentifierKind,
  type HexString,
  type Identifier,
  type Signer,
} from "@xmtp/node-sdk";
import {
  createWalletClient,
  http,
  toBytes,
  type Chain,
  type Hex,
  type PrivateKeyAccount,
  type WalletClient,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

export type User = {
  key: Hex;
  account: PrivateKeyAccount;
  wallet: WalletClient;
};

export const createUser = (key?: HexString, chain: Chain = sepolia): User => {
  const accountKey = key ?? generatePrivateKey();
  const account = privateKeyToAccount(accountKey);
  return {
    key: accountKey,
    account,
    wallet: createWalletClient({
      account,
      chain,
      transport: http(),
    }),
  };
};

export const createIdentifier = (user: User): Identifier => ({
  identifier: user.account.address.toLowerCase(),
  identifierKind: IdentifierKind.Ethereum,
});

export const createSigner = (user: User): Signer => {
  const identifier = createIdentifier(user);
  return {
    type: "EOA",
    getIdentifier: () => identifier,
    signMessage: async (message: string) => {
      const signature = await user.wallet.signMessage({
        account: user.account,
        message,
      });
      return toBytes(signature);
    },
  };
};

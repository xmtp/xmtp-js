import { IdentifierKind, type Identifier, type Signer } from "@xmtp/node-sdk";
import { createWalletClient, http, toBytes, type Chain } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

export type User = ReturnType<typeof createUser>;

export const createUser = (key?: `0x${string}`, chain: Chain = sepolia) => {
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
        message,
      });
      return toBytes(signature);
    },
  };
};

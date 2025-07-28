import { Client, IdentifierKind, type Signer } from "@xmtp/node-sdk";
import { createWalletClient, http, toBytes } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import {
  ContentTypeWalletSendCalls,
  WalletSendCallsCodec,
  type WalletSendCallsParams,
} from "./WalletSendCalls";

export const createSigner = (): Signer => {
  const account = privateKeyToAccount(generatePrivateKey());
  const wallet = createWalletClient({
    account,
    chain: sepolia,
    transport: http(),
  });
  return {
    type: "EOA",
    getIdentifier: () => ({
      identifierKind: IdentifierKind.Ethereum,
      identifier: account.address.toLowerCase(),
    }),
    signMessage: async (message: string) => {
      const signature = await wallet.signMessage({
        message,
      });
      return toBytes(signature);
    },
  };
};

test("content type exists", () => {
  expect(ContentTypeWalletSendCalls.authorityId).toBe("xmtp.org");
  expect(ContentTypeWalletSendCalls.typeId).toBe("walletSendCalls");
  expect(ContentTypeWalletSendCalls.versionMajor).toBe(1);
  expect(ContentTypeWalletSendCalls.versionMinor).toBe(0);
});

test("should successfully send and receive a WalletSendCalls message", async () => {
  const signer1 = createSigner();
  const client1 = await Client.create(signer1, {
    codecs: [new WalletSendCallsCodec()],
    env: "local",
  });

  const signer2 = createSigner();
  const client2 = await Client.create(signer2, {
    codecs: [new WalletSendCallsCodec()],
    env: "local",
  });

  const dm = await client1.conversations.newDm(client2.inboxId);

  const walletSendCalls: WalletSendCallsParams = {
    version: "1.0",
    from: "0x123...abc",
    chainId: "0x2105",
    calls: [
      {
        to: "0x456...def",
        value: "0x5AF3107A4000",
        metadata: {
          description: "Send 0.0001 ETH on base to 0x456...def",
          transactionType: "transfer",
          currency: "ETH",
          amount: "100000000000000",
          decimals: "18",
          toAddress: "0x456...def",
        },
      },
      {
        to: "0x789...cba",
        data: "0xdead...beef",
        metadata: {
          description: "Lend 10 USDC on base with Morpho @ 8.5% APY",
          transactionType: "lend",
          currency: "USDC",
          amount: "10000000",
          decimals: "6",
          platform: "morpho",
          apy: "8.5",
        },
      },
    ],
  };

  await dm.send(walletSendCalls, ContentTypeWalletSendCalls);

  await client2.conversations.sync();
  const dms = client2.conversations.listDms();

  expect(dms.length).toBe(1);

  await dms[0].sync();
  const messages = await dms[0].messages();
  expect(messages.length).toBe(2);

  const message = messages[1];
  const messageContent = message.content as WalletSendCallsParams;

  expect(messageContent.version).toBe(walletSendCalls.version);
  expect(messageContent.from).toBe(walletSendCalls.from);
  expect(messageContent.chainId).toBe(walletSendCalls.chainId);
});

test("has a proper shouldPush value", () => {
  const codec = new WalletSendCallsCodec();
  expect(codec.shouldPush()).toBe(true);
});

import { getRandomValues } from "node:crypto";
import { Client, IdentifierKind, type Signer } from "@xmtp/node-sdk";
import { createWalletClient, http, toBytes } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import {
  ContentTypeEthSignTypedData,
  EthSignTypedDataCodec,
  type EthSignTypedDataParams,
} from "./EthSignTypedData";

const testEncryptionKey = getRandomValues(new Uint8Array(32));

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
  expect(ContentTypeEthSignTypedData.authorityId).toBe("xmtp.org");
  expect(ContentTypeEthSignTypedData.typeId).toBe("eth_signTypedData");
  expect(ContentTypeEthSignTypedData.versionMajor).toBe(1);
  expect(ContentTypeEthSignTypedData.versionMinor).toBe(0);
});

test("should successfully send and receive a ethSignTypedData message", async () => {
  const signer1 = createSigner();
  const client1 = await Client.create(signer1, testEncryptionKey, {
    codecs: [new EthSignTypedDataCodec()],
    env: "local",
  });

  const signer2 = createSigner();
  const client2 = await Client.create(signer2, testEncryptionKey, {
    codecs: [new EthSignTypedDataCodec()],
    env: "local",
  });

  const dm = await client1.conversations.newDm(client2.inboxId);
  const nowTimestamp = Math.floor(Date.now() / 1000);
  const period = 86400;
  const ethSignTypedData: EthSignTypedDataParams = {
    account: "0x123...456",
    domain: {
      name: "Spend Permission Manager",
      version: "1",
      chainId: 8453,
      verifyingContract: "0xf85210B21cC50302F477BA56686d2019dC9b67Ad",
    },
    types: {
      SpendPermission: [
        { name: "account", type: "address" },
        { name: "spender", type: "address" },
        { name: "token", type: "address" },
        { name: "allowance", type: "uint160" },
        { name: "period", type: "uint48" },
        { name: "start", type: "uint48" },
        { name: "end", type: "uint48" },
        { name: "salt", type: "uint256" },
        { name: "extraData", type: "bytes" },
      ],
    },
    primaryType: "SpendPermission",
    message: {
      account: "0x123...456",
      spender: "0x789...abc",
      token: "0xdef...123",
      allowance: 1000000,
      period,
      start: nowTimestamp,
      end: nowTimestamp + period,
      salt: nowTimestamp.toString(),
      extraData: "0x",
    },
    metadata: {
      description: "Allow 0x789...abc to spend 1 USDC on Base",
      transactionType: "spend",
    },
  };

  await dm.send(ethSignTypedData, ContentTypeEthSignTypedData);

  await client2.conversations.sync();
  const dms = client2.conversations.listDms();

  expect(dms.length).toBe(1);

  await dms[0].sync();
  const messages = await dms[0].messages();
  expect(messages.length).toBe(1);

  const message = messages[0];
  const messageContent = message.content as EthSignTypedDataParams;

  expect(messageContent.domain?.version).toBe(ethSignTypedData.domain?.version);
  expect(messageContent.domain?.name).toBe(ethSignTypedData.domain?.name);
  expect(messageContent.domain?.chainId).toBe(ethSignTypedData.domain?.chainId);
});

test("has a proper shouldPush value", () => {
  const codec = new EthSignTypedDataCodec();
  expect(codec.shouldPush()).toBe(true);
});

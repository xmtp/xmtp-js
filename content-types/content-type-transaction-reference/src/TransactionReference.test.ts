import { Client, IdentifierKind, type Signer } from "@xmtp/node-sdk";
import { createWalletClient, http, toBytes } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import {
  ContentTypeTransactionReference,
  TransactionReferenceCodec,
  type TransactionReference,
} from "./TransactionReference";

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
  expect(ContentTypeTransactionReference.authorityId).toBe("xmtp.org");
  expect(ContentTypeTransactionReference.typeId).toBe("transactionReference");
  expect(ContentTypeTransactionReference.versionMajor).toBe(1);
  expect(ContentTypeTransactionReference.versionMinor).toBe(0);
});

test("should successfully send and receive a TransactionReference message", async () => {
  const signer1 = createSigner();
  const client1 = await Client.create(signer1, {
    codecs: [new TransactionReferenceCodec()],
    env: "local",
  });

  const signer2 = createSigner();
  const client2 = await Client.create(signer2, {
    codecs: [new TransactionReferenceCodec()],
    env: "local",
  });

  const dm = await client1.conversations.newDm(client2.inboxId);

  const transactionRefToSend: TransactionReference = {
    namespace: "eip155",
    networkId: "0x14a33",
    reference:
      "0xa7cd32b79204559e46b4ef9b519fce58cedb25246f48d0c00bd628e873a81f2f",
    metadata: {
      transactionType: "transfer",
      currency: "USDC",
      amount: 1337,
      decimals: 6,
      fromAddress: (await signer1.getIdentifier()).identifier,
      toAddress: (await signer2.getIdentifier()).identifier,
    },
  };

  await dm.send(transactionRefToSend, ContentTypeTransactionReference);

  await client2.conversations.sync();
  const dms = client2.conversations.listDms();

  expect(dms.length).toBe(1);

  await dms[0].sync();
  const messages = await dms[0].messages();
  expect(messages.length).toBe(2);

  const message = messages[1];
  const messageContent = message.content as TransactionReference;

  expect(messageContent.namespace).toBe(transactionRefToSend.namespace);
  expect(messageContent.networkId).toBe(transactionRefToSend.networkId);
  expect(messageContent.reference).toBe(transactionRefToSend.reference);
  expect(messageContent.metadata).toEqual(transactionRefToSend.metadata);
});

test("has a proper shouldPush value", () => {
  const codec = new TransactionReferenceCodec();
  expect(codec.shouldPush()).toBe(true);
});

import { Client } from "@xmtp/xmtp-js";
import { Wallet } from "ethers";
import {
  ContentTypeTransactionReference,
  TransactionReferenceCodec,
  type TransactionReference,
} from "./TransactionReference";

test("content type exists", () => {
  expect(ContentTypeTransactionReference.authorityId).toBe("xmtp.org");
  expect(ContentTypeTransactionReference.typeId).toBe("transactionReference");
  expect(ContentTypeTransactionReference.versionMajor).toBe(1);
  expect(ContentTypeTransactionReference.versionMinor).toBe(0);
});

test("should successfully send and receive a TransactionReference message", async () => {
  const aliceWallet = Wallet.createRandom();
  const aliceClient = await Client.create(aliceWallet, {
    codecs: [new TransactionReferenceCodec()],
    env: "local",
  });
  await aliceClient.publishUserContact();

  const bobWallet = Wallet.createRandom();
  const bobClient = await Client.create(bobWallet, {
    codecs: [new TransactionReferenceCodec()],
    env: "local",
  });
  await bobClient.publishUserContact();

  const conversation = await aliceClient.conversations.newConversation(
    bobWallet.address,
  );

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
      fromAddress: aliceWallet.address,
      toAddress: bobWallet.address,
    },
  };

  await conversation.send(transactionRefToSend, {
    contentType: ContentTypeTransactionReference,
  });

  const bobConversation = await bobClient.conversations.newConversation(
    aliceWallet.address,
  );

  const messages = await bobConversation.messages();

  expect(messages.length).toBe(1);

  const message = messages[0];
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

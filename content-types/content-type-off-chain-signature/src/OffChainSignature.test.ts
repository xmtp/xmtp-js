import { Client, IdentifierKind, type Signer } from "@xmtp/node-sdk";
import { createWalletClient, http, toBytes } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import {
  ContentTypeOffChainSignature,
  OffChainSignatureCodec,
  type OffChainSignature,
} from "./OffChainSignature";

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
  expect(ContentTypeOffChainSignature.authorityId).toBe("xmtp.org");
  expect(ContentTypeOffChainSignature.typeId).toBe("offChainSignature");
  expect(ContentTypeOffChainSignature.versionMajor).toBe(1);
  expect(ContentTypeOffChainSignature.versionMinor).toBe(0);
});

test("should successfully send and receive a Off Chain Signature message", async () => {
  const signer1 = createSigner();
  const client1 = await Client.create(signer1, {
    codecs: [new OffChainSignatureCodec()],
    env: "local",
  });

  const signer2 = createSigner();
  const client2 = await Client.create(signer2, {
    codecs: [new OffChainSignatureCodec()],
    env: "local",
  });

  const dm = await client1.conversations.newDm(client2.inboxId);

  const offChainSignature: OffChainSignature = {
    namespace: "eip155",
    networkId: "0x2105",
    signature:
      "0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000017000000000000000000000000000000000000000000000000000000000000000142925b0c3b1ecc4bceaf7e1597740fb71c9f264fdbc65fae57eb92a4b9e04f0b4dad06642e2e7f053b56b9706af7c41bd128a4d8482d4aa3148822c6ca47418c0000000000000000000000000000000000000000000000000000000000000025f198086b2db17256731bc456673b96bcef23f51d1fbacdd7c4379ef65465572f1d00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008a7b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a2269624877545956626d5651574e7839336c474f6b555544697063745458574633704b525761397441526945222c226f726967696e223a2268747470733a2f2f6b6579732e636f696e626173652e636f6d222c2263726f73734f726967696e223a66616c73657d00000000000000000000000000000000000000000000",
    metadata: {
      transactionType: "spend",
      fromAddress: (await signer1.getIdentifier()).identifier,
    },
  };

  await dm.send(offChainSignature, ContentTypeOffChainSignature);

  await client2.conversations.sync();
  const dms = client2.conversations.listDms();

  expect(dms.length).toBe(1);

  await dms[0].sync();
  const messages = await dms[0].messages();
  expect(messages.length).toBe(1);

  const message = messages[0];
  const messageContent = message.content as OffChainSignature;

  expect(messageContent.namespace).toBe(offChainSignature.namespace);
  expect(messageContent.networkId).toBe(offChainSignature.networkId);
  expect(messageContent.signature).toBe(offChainSignature.signature);
  expect(messageContent.metadata).toEqual(offChainSignature.metadata);
});

test("has a proper shouldPush value", () => {
  const codec = new OffChainSignatureCodec();
  expect(codec.shouldPush()).toBe(true);
});

import { Client } from "@xmtp/xmtp-js";
import { Wallet } from "ethers";
import {
  ContentTypeWalletSendCalls,
  WalletSendCallsCodec,
  type WalletSendCallsParams,
} from "./WalletSendCalls";

test("content type exists", () => {
  expect(ContentTypeWalletSendCalls.authorityId).toBe("xmtp.org");
  expect(ContentTypeWalletSendCalls.typeId).toBe("walletSendCalls");
  expect(ContentTypeWalletSendCalls.versionMajor).toBe(1);
  expect(ContentTypeWalletSendCalls.versionMinor).toBe(0);
});

test("should successfully send and receive a WalletSendCalls message", async () => {
  const aliceWallet = Wallet.createRandom();
  const aliceClient = await Client.create(aliceWallet, {
    codecs: [new WalletSendCallsCodec()],
    env: "local",
  });
  await aliceClient.publishUserContact();

  const bobWallet = Wallet.createRandom();
  const bobClient = await Client.create(bobWallet, {
    codecs: [new WalletSendCallsCodec()],
    env: "local",
  });
  await bobClient.publishUserContact();

  const conversation = await aliceClient.conversations.newConversation(
    bobWallet.address,
  );

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
          amount: 100000000000000,
          decimals: 18,
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
          amount: 10000000,
          decimals: 6,
          platform: "morpho",
          apy: "8.5",
        },
      },
    ],
  };

  await conversation.send(walletSendCalls, {
    contentType: ContentTypeWalletSendCalls,
  });

  const bobConversation = await bobClient.conversations.newConversation(
    aliceWallet.address,
  );

  const messages = await bobConversation.messages();

  expect(messages.length).toBe(1);

  const message = messages[0];
  const messageContent = message.content as WalletSendCallsParams;

  expect(messageContent.version).toBe(walletSendCalls.version);
  expect(messageContent.from).toBe(walletSendCalls.from);
  expect(messageContent.chainId).toBe(walletSendCalls.chainId);
});

test("has a proper shouldPush value", () => {
  const codec = new WalletSendCallsCodec();
  expect(codec.shouldPush()).toBe(true);
});

import {
  Client,
  DecodedMessage,
  IdentifierKind,
  type Identifier,
  type Signer as XmtpSigner,
} from "@xmtp/node-sdk";
import { base64ToUint8Array } from "uint8array-extras";
import { createWalletClient, http, toBytes } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";
import {
  buildConversationTopic,
  groupIdFromTopic,
} from "@/notifications/topics";
import { register, subscribe } from "@/utils/notifications";
import type { NotificationMessage } from "../notifications/client";

export function addressToIdentifier(address: string): Identifier {
  return {
    identifier: address,
    identifierKind: IdentifierKind.Ethereum,
  };
}

function createSigner(): XmtpSigner {
  const key = generatePrivateKey();
  const account = privateKeyToAccount(key);
  const wallet = createWalletClient({
    account,
    chain: mainnet,
    transport: http(),
  });
  return {
    type: "EOA",
    getIdentifier: () => ({
      identifier: account.address,
      identifierKind: IdentifierKind.Ethereum,
    }),
    signMessage: async (message: string) => {
      const signature = await wallet.signMessage({ message });
      return toBytes(signature);
    },
  };
}

let client: Client | undefined;
let messagesReceived: number = 0;
let messageTimestamps: number[] = [];
let startTime: number = Date.now();

const calculateMessageRates = (currentTime: number) => {
  // keep only timestamps from the last 5 seconds for highly real-time rate calculation
  const fiveSecondsAgo = currentTime - 5000;
  messageTimestamps = messageTimestamps.filter(
    (timestamp) => timestamp > fiveSecondsAgo,
  );

  // calculate rates
  const messagesLastFiveSeconds = messageTimestamps.length;
  const messagesPerSecond = messagesLastFiveSeconds / 5;
  const messagesPerMinute = messagesPerSecond * 60;

  // calculate overall rate since start
  const totalTimeSeconds = (currentTime - startTime) / 1000;
  const overallRate =
    totalTimeSeconds > 0 ? messagesReceived / totalTimeSeconds : 0;

  return {
    messagesPerSecond: Number(messagesPerSecond.toFixed(2)),
    messagesPerMinute,
    overallRate: Number(overallRate.toFixed(2)),
  };
};

export const startClient = async () => {
  const signer = createSigner();
  client = await Client.create(signer, {
    env: "local",
  });

  // reset timing when client starts
  startTime = Date.now();
  messagesReceived = 0;
  messageTimestamps = [];

  console.log("XMTP client created");
  console.log("Inbox ID: ", client.inboxId);
  console.log("Installation ID: ", client.installationId);
  console.log("Listening for new conversations...");
  await client.conversations.stream({
    onValue: (conversation) => {
      if (conversation === undefined) {
        return;
      }
      console.log(`New conversation detected`);
      console.log(`Registering installation with ID: ${conversation.id}`);
      register(conversation.id)
        .then(() => {
          const topic = buildConversationTopic(conversation.id);
          const hmacKeys = conversation.getHmacKeys();
          return subscribe(conversation.id, topic, hmacKeys[conversation.id]);
        })
        .then(() => {
          console.log("Subscribed to conversation topic");
        })
        .catch((error: unknown) => {
          console.error("Error subscribing to conversation topic: ", error);
        });
    },
  });
};

export const handleEncryptedMessage = async (message: NotificationMessage) => {
  if (!client) {
    console.error("XMTP client not initialized");
    return;
  }
  const groupId = groupIdFromTopic(message.content_topic);
  const conversation = await client.conversations.getConversationById(groupId);
  if (!conversation) {
    console.error(`Conversation not found for group ID: ${groupId}`);
    return;
  }
  const bytes = base64ToUint8Array(message.message);
  const processed = await conversation.processStreamedMessage(bytes);
  const _decodedMessage = new DecodedMessage(client, processed);

  // track message timing
  const currentTime = Date.now();
  messagesReceived++;
  messageTimestamps.push(currentTime);

  // calculate and log rates
  const rates = calculateMessageRates(currentTime);
  console.log(
    `Messages: ${messagesReceived} | Rate: ${rates.messagesPerSecond}/sec, ${rates.messagesPerMinute}/min | Overall: ${rates.overallRate}/sec`,
  );
};

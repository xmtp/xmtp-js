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

export const startClient = async () => {
  const signer = createSigner();
  client = await Client.create(signer, {
    env: "local",
  });
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
  messagesReceived++;
  console.log(`${messagesReceived}/1000`);
};

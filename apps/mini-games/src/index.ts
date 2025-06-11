import "dotenv/config";
import { ContentTypeMiniApp } from "@xmtp/content-type-mini-app";
import { ContentTypeText } from "@xmtp/content-type-text";
import { client } from "./client";
import { processConversation } from "./processConversation";
import { processMessage } from "./processMessage";

async function main() {
  console.log("Starting mini-games app...");
  console.log("Inbox ID:", client.inboxId);
  console.log("Address:", client.accountIdentifier?.identifier);
  console.log("Listening for new conversations and messages...");

  await client.conversations.streamAllMessages((error, message) => {
    if (error) {
      console.error(error);
      return;
    }

    if (
      !message ||
      !(
        message.contentType?.sameAs(ContentTypeMiniApp) ||
        message.contentType?.sameAs(ContentTypeText)
      )
    ) {
      console.log("Skipping message:", message);
      return;
    }

    void processMessage(message);
  });

  client.conversations.stream((error, conversation) => {
    if (error) {
      console.error(error);
      return;
    }

    if (!conversation) {
      return;
    }

    void processConversation(conversation);
  });
}

main().catch(console.error);

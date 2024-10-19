import type {
  ClientEventsActions,
  ClientEventsClientMessageData,
  ClientEventsErrorData,
  ClientEventsWorkerPostMessageData,
} from "@/types";
import {
  fromEncodedContent,
  fromSafeEncodedContent,
  toSafeConversation,
  toSafeMessage,
} from "@/utils/conversions";
import { WorkerClient } from "@/WorkerClient";

let client: WorkerClient;

/**
 * Type-safe postMessage
 */
const postMessage = <A extends ClientEventsActions>(
  data: ClientEventsWorkerPostMessageData<A>,
) => {
  self.postMessage(data);
};

/**
 * Type-safe postMessage for errors
 */
const postMessageError = (data: ClientEventsErrorData) => {
  self.postMessage(data);
};

self.onmessage = async (event: MessageEvent<ClientEventsClientMessageData>) => {
  const { action, id, data } = event.data;

  console.log("client worker received event data", event.data);

  // a client is required for all actions except init
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (action !== "init" && !client) {
    postMessageError({
      id,
      action,
      error: "Client not initialized",
    });
    return;
  }

  try {
    switch (action) {
      case "init":
        client = await WorkerClient.create(data.address, data.options);
        postMessage({
          id,
          action,
          result: {
            inboxId: client.inboxId,
            installationId: client.installationId,
          },
        });
        break;
      case "getSignatureText": {
        const result = await client.getSignatureText();
        postMessage({
          id,
          action,
          result,
        });
        break;
      }
      case "addSignature":
        await client.addSignature(data.bytes);
        postMessage({
          id,
          action,
          result: undefined,
        });
        break;
      case "registerIdentity":
        await client.registerIdentity();
        postMessage({
          id,
          action,
          result: undefined,
        });
        break;
      case "isRegistered": {
        const result = client.isRegistered;
        postMessage({
          id,
          action,
          result,
        });
        break;
      }
      case "canMessage": {
        const result = await client.canMessage(data.accountAddresses);
        postMessage({
          id,
          action,
          result,
        });
        break;
      }
      case "getConversations": {
        const conversations = await client.conversations.list(data.options);
        postMessage({
          id,
          action,
          result: conversations.map((conversation) =>
            toSafeConversation(conversation),
          ),
        });
        break;
      }
      case "newGroup": {
        const conversation = await client.conversations.newGroup(
          data.accountAddresses,
          // TODO: add options
        );
        postMessage({
          id,
          action,
          result: toSafeConversation(conversation),
        });
        break;
      }
      case "getConversationById": {
        const conversation = client.conversations.getConversationById(data.id);
        postMessage({
          id,
          action,
          result: conversation ? toSafeConversation(conversation) : undefined,
        });
        break;
      }
      case "getMessageById": {
        const message = client.conversations.getMessageById(data.id);
        postMessage({
          id,
          action,
          result: message,
        });
        break;
      }
      case "syncGroup": {
        const group = client.conversations.getConversationById(data.id);
        if (group) {
          await group.sync();
          postMessage({
            id,
            action,
            result: toSafeConversation(group),
          });
        } else {
          postMessageError({
            id,
            action,
            error: "Group not found",
          });
        }
        break;
      }
      case "updateGroupName": {
        const group = client.conversations.getConversationById(data.id);
        if (group) {
          await group.updateName(data.name);
          postMessage({
            id,
            action,
            result: undefined,
          });
        } else {
          postMessageError({
            id,
            action,
            error: "Group not found",
          });
        }
        break;
      }
      case "updateGroupDescription": {
        const group = client.conversations.getConversationById(data.id);
        if (group) {
          await group.updateDescription(data.description);
          postMessage({
            id,
            action,
            result: undefined,
          });
        } else {
          postMessageError({
            id,
            action,
            error: "Group not found",
          });
        }
        break;
      }
      case "sendGroupMessage": {
        const group = client.conversations.getConversationById(data.id);
        if (group) {
          const result = await group.send(
            fromEncodedContent(fromSafeEncodedContent(data.content)),
          );
          postMessage({
            id,
            action,
            result,
          });
        } else {
          postMessageError({
            id,
            action,
            error: "Group not found",
          });
        }
        break;
      }
      case "getGroupMessages": {
        const group = client.conversations.getConversationById(data.id);
        if (group) {
          const messages = group.messages(data.options);
          postMessage({
            id,
            action,
            result: messages.map((message) => toSafeMessage(message)),
          });
        } else {
          postMessageError({
            id,
            action,
            error: "Group not found",
          });
        }
        break;
      }
      case "inboxState": {
        const result = await client.inboxState(data.refreshFromNetwork);
        postMessage({
          id,
          action,
          result,
        });
        break;
      }
      // no default
    }
  } catch (e) {
    postMessageError({
      id,
      action,
      error: (e as Error).message,
    });
  }
};

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
  toSafeInboxState,
  toSafeMessage,
} from "@/utils/conversions";
import { WorkerClient } from "@/WorkerClient";

let client: WorkerClient;
let enableLogging = false;

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

  if (enableLogging) {
    console.log("client worker received event data", event.data);
  }

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
      /**
       * Client actions
       */
      case "init":
        client = await WorkerClient.create(
          data.address,
          data.encryptionKey,
          data.options,
        );
        enableLogging =
          data.options?.loggingLevel !== undefined &&
          data.options.loggingLevel !== "off";
        postMessage({
          id,
          action,
          result: {
            inboxId: client.inboxId,
            installationId: client.installationId,
          },
        });
        break;
      case "createInboxSignatureText": {
        const result = await client.createInboxSignatureText();
        postMessage({
          id,
          action,
          result,
        });
        break;
      }
      case "addAccountSignatureText": {
        const result = await client.addAccountSignatureText(
          data.newAccountAddress,
        );
        postMessage({
          id,
          action,
          result,
        });
        break;
      }
      case "removeAccountSignatureText": {
        const result = await client.removeAccountSignatureText(
          data.accountAddress,
        );
        postMessage({
          id,
          action,
          result,
        });
        break;
      }
      case "revokeInstallationsSignatureText": {
        const result = await client.revokeInstallationsSignatureText();
        postMessage({
          id,
          action,
          result,
        });
        break;
      }
      case "addSignature":
        await client.addSignature(data.type, data.bytes);
        postMessage({
          id,
          action,
          result: undefined,
        });
        break;
      case "addScwSignature":
        await client.addScwSignature(
          data.type,
          data.bytes,
          data.chainId,
          data.blockNumber,
        );
        postMessage({
          id,
          action,
          result: undefined,
        });
        break;
      case "applySignatures":
        await client.applySignatures();
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
      case "inboxState": {
        const result = await client.inboxState(data.refreshFromNetwork);
        postMessage({
          id,
          action,
          result: toSafeInboxState(result),
        });
        break;
      }
      case "getLatestInboxState": {
        const result = await client.getLatestInboxState(data.inboxId);
        postMessage({
          id,
          action,
          result: toSafeInboxState(result),
        });
        break;
      }
      case "setConsentStates": {
        await client.setConsentStates(data.records);
        postMessage({
          id,
          action,
          result: undefined,
        });
        break;
      }
      case "getConsentState": {
        const result = await client.getConsentState(
          data.entityType,
          data.entity,
        );
        postMessage({
          id,
          action,
          result,
        });
        break;
      }
      case "findInboxIdByAddress": {
        const result = await client.findInboxIdByAddress(data.address);
        postMessage({
          id,
          action,
          result,
        });
        break;
      }
      /**
       * Conversations actions
       */
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
      case "getGroups": {
        const conversations = await client.conversations.listGroups(
          data.options,
        );
        postMessage({
          id,
          action,
          result: conversations.map((conversation) =>
            toSafeConversation(conversation),
          ),
        });
        break;
      }
      case "getDms": {
        const conversations = await client.conversations.listDms(data.options);
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
          data.options,
        );
        postMessage({
          id,
          action,
          result: toSafeConversation(conversation),
        });
        break;
      }
      case "newDm": {
        const conversation = await client.conversations.newDm(
          data.accountAddress,
        );
        postMessage({
          id,
          action,
          result: toSafeConversation(conversation),
        });
        break;
      }
      case "syncConversations": {
        await client.conversations.sync();
        postMessage({
          id,
          action,
          result: undefined,
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
      case "getDmByInboxId": {
        const conversation = client.conversations.getDmByInboxId(data.inboxId);
        postMessage({
          id,
          action,
          result: conversation ? toSafeConversation(conversation) : undefined,
        });
        break;
      }
      /**
       * Group actions
       */
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
      case "updateGroupImageUrlSquare": {
        const group = client.conversations.getConversationById(data.id);
        if (group) {
          await group.updateImageUrl(data.imageUrl);
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
      case "updateGroupPinnedFrameUrl": {
        const group = client.conversations.getConversationById(data.id);
        if (group) {
          await group.updatePinnedFrameUrl(data.pinnedFrameUrl);
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
      case "sendOptimisticGroupMessage": {
        const group = client.conversations.getConversationById(data.id);
        if (group) {
          const result = group.sendOptimistic(
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
      case "publishGroupMessages": {
        const group = client.conversations.getConversationById(data.id);
        if (group) {
          await group.publishMessages();
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
      case "getGroupMembers": {
        const group = client.conversations.getConversationById(data.id);
        if (group) {
          const result = await group.members();
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
      case "getGroupAdmins": {
        const group = client.conversations.getConversationById(data.id);
        if (group) {
          postMessage({
            id,
            action,
            result: group.admins,
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
      case "getGroupSuperAdmins": {
        const group = client.conversations.getConversationById(data.id);
        if (group) {
          postMessage({
            id,
            action,
            result: group.superAdmins,
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
      case "getGroupConsentState": {
        const group = client.conversations.getConversationById(data.id);
        if (group) {
          postMessage({
            id,
            action,
            result: group.consentState,
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
      case "updateGroupConsentState": {
        const group = client.conversations.getConversationById(data.id);
        if (group) {
          group.updateConsentState(data.state);
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
      case "addGroupAdmin": {
        const group = client.conversations.getConversationById(data.id);
        if (group) {
          await group.addAdmin(data.inboxId);
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
      case "removeGroupAdmin": {
        const group = client.conversations.getConversationById(data.id);
        if (group) {
          await group.removeAdmin(data.inboxId);
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
      case "addGroupSuperAdmin": {
        const group = client.conversations.getConversationById(data.id);
        if (group) {
          await group.addSuperAdmin(data.inboxId);
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
      case "removeGroupSuperAdmin": {
        const group = client.conversations.getConversationById(data.id);
        if (group) {
          await group.removeSuperAdmin(data.inboxId);
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
      case "addGroupMembers": {
        const group = client.conversations.getConversationById(data.id);
        if (group) {
          await group.addMembers(data.accountAddresses);
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
      case "removeGroupMembers": {
        const group = client.conversations.getConversationById(data.id);
        if (group) {
          await group.removeMembers(data.accountAddresses);
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
      case "addGroupMembersByInboxId": {
        const group = client.conversations.getConversationById(data.id);
        if (group) {
          await group.addMembersByInboxId(data.inboxIds);
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
      case "removeGroupMembersByInboxId": {
        const group = client.conversations.getConversationById(data.id);
        if (group) {
          await group.removeMembersByInboxId(data.inboxIds);
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
      case "isGroupAdmin": {
        const group = client.conversations.getConversationById(data.id);
        if (group) {
          const result = group.isAdmin(data.inboxId);
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
      case "isGroupSuperAdmin": {
        const group = client.conversations.getConversationById(data.id);
        if (group) {
          const result = group.isSuperAdmin(data.inboxId);
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
      case "getDmPeerInboxId": {
        const group = client.conversations.getConversationById(data.id);
        if (group) {
          const result = group.dmPeerInboxId();
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
    }
  } catch (e) {
    postMessageError({
      id,
      action,
      error: (e as Error).message,
    });
  }
};

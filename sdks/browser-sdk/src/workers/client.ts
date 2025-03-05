import type {
  Consent,
  Conversation,
  Message,
  StreamCloser,
  UserPreference,
} from "@xmtp/wasm-bindings";
import type {
  ClientEventsActions,
  ClientEventsClientMessageData,
  ClientEventsErrorData,
  ClientEventsWorkerPostMessageData,
} from "@/types";
import type {
  ClientStreamEventsErrorData,
  ClientStreamEventsTypes,
  ClientStreamEventsWorkerPostMessageData,
} from "@/types/clientStreamEvents";
import {
  fromEncodedContent,
  fromSafeEncodedContent,
  toSafeConsent,
  toSafeConversation,
  toSafeHmacKey,
  toSafeInboxState,
  toSafeMessage,
  toSafeMessageDisappearingSettings,
} from "@/utils/conversions";
import { WorkerClient } from "@/WorkerClient";
import { WorkerConversation } from "@/WorkerConversation";

let maybeClient: WorkerClient | undefined;
let enableLogging = false;

const streamClosers = new Map<string, StreamCloser>();

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

/**
 * Type-safe postMessage for streams
 */
const postStreamMessage = <A extends ClientStreamEventsTypes>(
  data: ClientStreamEventsWorkerPostMessageData<A>,
) => {
  self.postMessage(data);
};

/**
 * Type-safe postMessage for stream errors
 */
const postStreamMessageError = (data: ClientStreamEventsErrorData) => {
  self.postMessage(data);
};

self.onmessage = async (event: MessageEvent<ClientEventsClientMessageData>) => {
  const { action, id, data } = event.data;

  if (enableLogging) {
    console.log("client worker received event data", event.data);
  }

  try {
    // init is a special action that initializes the client
    if (action === "init" && !maybeClient) {
      maybeClient = await WorkerClient.create(
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
          inboxId: maybeClient.inboxId,
          installationId: maybeClient.installationId,
          installationIdBytes: maybeClient.installationIdBytes,
        },
      });
      return;
    }

    // a client is required for all other actions
    if (!maybeClient) {
      throw new Error("Client not initialized");
    }

    // let typescript know that a client will be available for the rest
    // of this code block
    const client = maybeClient;

    // helper function that throws an error if the group is not found
    const getGroup = (groupId: string) => {
      const group = client.conversations.getConversationById(groupId);
      if (!group) {
        throw new Error(`Group "${groupId}" not found`);
      }
      return group;
    };

    switch (action) {
      /**
       * Stream actions
       */
      case "endStream": {
        const streamCloser = streamClosers.get(data.streamId);
        if (streamCloser) {
          streamCloser.end();
          streamClosers.delete(data.streamId);
          postMessage({ id, action, result: undefined });
        } else {
          throw new Error(`Stream "${data.streamId}" not found`);
        }
        break;
      }
      /**
       * Client actions
       */
      case "createInboxSignatureText": {
        const result = client.createInboxSignatureText();
        postMessage({ id, action, result });
        break;
      }
      case "addAccountSignatureText": {
        const result = await client.addAccountSignatureText(
          data.newAccountAddress,
        );
        postMessage({ id, action, result });
        break;
      }
      case "removeAccountSignatureText": {
        const result = await client.removeAccountSignatureText(
          data.accountAddress,
        );
        postMessage({ id, action, result });
        break;
      }
      case "revokeAllOtherInstallationsSignatureText": {
        const result = await client.revokeAllAOtherInstallationsSignatureText();
        postMessage({ id, action, result });
        break;
      }
      case "revokeInstallationsSignatureText": {
        const result = await client.revokeInstallationsSignatureText(
          data.installationIds,
        );
        postMessage({ id, action, result });
        break;
      }
      case "addSignature":
        await client.addSignature(data.type, data.bytes);
        postMessage({ id, action, result: undefined });
        break;
      case "addScwSignature":
        await client.addScwSignature(
          data.type,
          data.bytes,
          data.chainId,
          data.blockNumber,
        );
        postMessage({ id, action, result: undefined });
        break;
      case "applySignatures":
        await client.applySignatures();
        postMessage({ id, action, result: undefined });
        break;
      case "registerIdentity":
        await client.registerIdentity();
        postMessage({ id, action, result: undefined });
        break;
      case "isRegistered": {
        const result = client.isRegistered;
        postMessage({ id, action, result });
        break;
      }
      case "canMessage": {
        const result = await client.canMessage(data.accountAddresses);
        postMessage({ id, action, result });
        break;
      }
      case "inboxState": {
        const inboxState = await client.inboxState(data.refreshFromNetwork);
        const result = toSafeInboxState(inboxState);
        postMessage({ id, action, result });
        break;
      }
      case "getLatestInboxState": {
        const inboxState = await client.getLatestInboxState(data.inboxId);
        const result = toSafeInboxState(inboxState);
        postMessage({ id, action, result });
        break;
      }
      case "setConsentStates": {
        await client.setConsentStates(data.records);
        postMessage({ id, action, result: undefined });
        break;
      }
      case "getConsentState": {
        const result = await client.getConsentState(
          data.entityType,
          data.entity,
        );
        postMessage({ id, action, result });
        break;
      }
      case "findInboxIdByAddress": {
        const result = await client.findInboxIdByAddress(data.address);
        postMessage({ id, action, result });
        break;
      }
      case "signWithInstallationKey": {
        const result = client.signWithInstallationKey(data.signatureText);
        postMessage({ id, action, result });
        break;
      }
      case "verifySignedWithInstallationKey": {
        const result = client.verifySignedWithInstallationKey(
          data.signatureText,
          data.signatureBytes,
        );
        postMessage({ id, action, result });
        break;
      }
      case "verifySignedWithPublicKey": {
        const result = client.verifySignedWithPublicKey(
          data.signatureText,
          data.signatureBytes,
          data.publicKey,
        );
        postMessage({ id, action, result });
        break;
      }
      /**
       * Conversations actions
       */
      case "streamAllGroups": {
        const streamCallback = async (
          error: Error | null,
          value: Conversation | undefined,
        ) => {
          if (error) {
            postStreamMessageError({
              type: "group",
              streamId: data.streamId,
              error: error.message,
            });
          } else {
            postStreamMessage({
              type: "group",
              streamId: data.streamId,
              result: value
                ? await toSafeConversation(
                    new WorkerConversation(client, value),
                  )
                : undefined,
            });
          }
        };
        const streamCloser = client.conversations.stream(
          streamCallback,
          data.conversationType,
        );
        streamClosers.set(data.streamId, streamCloser);
        postMessage({ id, action, result: undefined });
        break;
      }
      case "streamAllMessages": {
        const streamCallback = (
          error: Error | null,
          value: Message | undefined,
        ) => {
          if (error) {
            postStreamMessageError({
              type: "message",
              streamId: data.streamId,
              error: error.message,
            });
          } else {
            postStreamMessage({
              type: "message",
              streamId: data.streamId,
              result: value ? toSafeMessage(value) : undefined,
            });
          }
        };
        const streamCloser = client.conversations.streamAllMessages(
          streamCallback,
          data.conversationType,
        );
        streamClosers.set(data.streamId, streamCloser);
        postMessage({ id, action, result: undefined });
        break;
      }
      case "streamConsent": {
        const streamCallback = (
          error: Error | null,
          value: Consent[] | undefined,
        ) => {
          if (error) {
            postStreamMessageError({
              type: "consent",
              streamId: data.streamId,
              error: error.message,
            });
          } else {
            postStreamMessage({
              type: "consent",
              streamId: data.streamId,
              result: value?.map(toSafeConsent) ?? [],
            });
          }
        };
        const streamCloser = client.conversations.streamConsent(streamCallback);
        streamClosers.set(data.streamId, streamCloser);
        postMessage({
          id,
          action,
          result: undefined,
        });
        break;
      }
      case "streamPreferences": {
        const streamCallback = (
          error: Error | null,
          value: UserPreference[] | undefined,
        ) => {
          if (error) {
            postStreamMessageError({
              type: "preferences",
              streamId: data.streamId,
              error: error.message,
            });
          } else {
            postStreamMessage({
              type: "preferences",
              streamId: data.streamId,
              result: value ?? undefined,
            });
          }
        };
        const streamCloser =
          client.conversations.streamPreferences(streamCallback);
        streamClosers.set(data.streamId, streamCloser);
        postMessage({
          id,
          action,
          result: undefined,
        });
        break;
      }
      case "getConversations": {
        const conversations = client.conversations.list(data.options);
        const result = await Promise.all(
          conversations.map((conversation) => toSafeConversation(conversation)),
        );
        postMessage({ id, action, result });
        break;
      }
      case "getGroups": {
        const conversations = client.conversations.listGroups(data.options);
        const result = await Promise.all(
          conversations.map((conversation) => toSafeConversation(conversation)),
        );
        postMessage({ id, action, result });
        break;
      }
      case "getDms": {
        const conversations = client.conversations.listDms(data.options);
        const result = await Promise.all(
          conversations.map((conversation) => toSafeConversation(conversation)),
        );
        postMessage({ id, action, result });
        break;
      }
      case "newGroup": {
        const conversation = await client.conversations.newGroup(
          data.accountAddresses,
          data.options,
        );
        const result = await toSafeConversation(conversation);
        postMessage({ id, action, result });
        break;
      }
      case "newGroupByInboxIds": {
        const conversation = await client.conversations.newGroupByInboxIds(
          data.inboxIds,
          data.options,
        );
        const result = await toSafeConversation(conversation);
        postMessage({ id, action, result });
        break;
      }
      case "newDm": {
        const conversation = await client.conversations.newDm(
          data.accountAddress,
          data.options,
        );
        const result = await toSafeConversation(conversation);
        postMessage({ id, action, result });
        break;
      }
      case "newDmByInboxId": {
        const conversation = await client.conversations.newDmByInboxId(
          data.inboxId,
          data.options,
        );
        const result = await toSafeConversation(conversation);
        postMessage({ id, action, result });
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
      case "syncAllConversations": {
        await client.conversations.syncAll(data.consentStates);
        postMessage({
          id,
          action,
          result: undefined,
        });
        break;
      }
      case "getConversationById": {
        const conversation = client.conversations.getConversationById(data.id);
        const result = conversation
          ? await toSafeConversation(conversation)
          : undefined;
        postMessage({ id, action, result });
        break;
      }
      case "getMessageById": {
        const message = client.conversations.getMessageById(data.id);
        const result = message ? toSafeMessage(message) : undefined;
        postMessage({ id, action, result });
        break;
      }
      case "getDmByInboxId": {
        const conversation = client.conversations.getDmByInboxId(data.inboxId);
        const result = conversation
          ? await toSafeConversation(conversation)
          : undefined;
        postMessage({ id, action, result });
        break;
      }
      case "getHmacKeys": {
        const hmacKeys = client.conversations.getHmacKeys();
        const result = Object.fromEntries(
          Array.from(hmacKeys.entries()).map(([groupId, hmacKeys]) => [
            groupId,
            hmacKeys.map(toSafeHmacKey),
          ]),
        );
        postMessage({ id, action, result });
        break;
      }
      /**
       * Group actions
       */
      case "syncGroup": {
        const group = getGroup(data.id);
        await group.sync();
        const result = await toSafeConversation(group);
        postMessage({ id, action, result });
        break;
      }
      case "updateGroupName": {
        const group = getGroup(data.id);
        await group.updateName(data.name);
        postMessage({ id, action, result: undefined });
        break;
      }
      case "updateGroupDescription": {
        const group = getGroup(data.id);
        await group.updateDescription(data.description);
        postMessage({ id, action, result: undefined });
        break;
      }
      case "updateGroupImageUrlSquare": {
        const group = getGroup(data.id);
        await group.updateImageUrl(data.imageUrl);
        postMessage({ id, action, result: undefined });
        break;
      }
      case "sendGroupMessage": {
        const group = getGroup(data.id);
        const result = await group.send(
          fromEncodedContent(fromSafeEncodedContent(data.content)),
        );
        postMessage({ id, action, result });
        break;
      }
      case "sendOptimisticGroupMessage": {
        const group = getGroup(data.id);
        const result = group.sendOptimistic(
          fromEncodedContent(fromSafeEncodedContent(data.content)),
        );
        postMessage({ id, action, result });
        break;
      }
      case "publishGroupMessages": {
        const group = getGroup(data.id);
        await group.publishMessages();
        postMessage({ id, action, result: undefined });
        break;
      }
      case "getGroupMessages": {
        const group = getGroup(data.id);
        const messages = await group.messages(data.options);
        const result = messages.map((message) => toSafeMessage(message));
        postMessage({ id, action, result });
        break;
      }
      case "getGroupMembers": {
        const group = getGroup(data.id);
        const result = await group.members();
        postMessage({ id, action, result });
        break;
      }
      case "getGroupAdmins": {
        const group = getGroup(data.id);
        const result = group.admins;
        postMessage({ id, action, result });
        break;
      }
      case "getGroupSuperAdmins": {
        const group = getGroup(data.id);
        const result = group.superAdmins;
        postMessage({ id, action, result });
        break;
      }
      case "getGroupConsentState": {
        const group = getGroup(data.id);
        const result = group.consentState;
        postMessage({ id, action, result });
        break;
      }
      case "updateGroupConsentState": {
        const group = getGroup(data.id);
        group.updateConsentState(data.state);
        postMessage({ id, action, result: undefined });
        break;
      }
      case "addGroupAdmin": {
        const group = getGroup(data.id);
        await group.addAdmin(data.inboxId);
        postMessage({ id, action, result: undefined });
        break;
      }
      case "removeGroupAdmin": {
        const group = getGroup(data.id);
        await group.removeAdmin(data.inboxId);
        postMessage({ id, action, result: undefined });
        break;
      }
      case "addGroupSuperAdmin": {
        const group = getGroup(data.id);
        await group.addSuperAdmin(data.inboxId);
        postMessage({ id, action, result: undefined });
        break;
      }
      case "removeGroupSuperAdmin": {
        const group = getGroup(data.id);
        await group.removeSuperAdmin(data.inboxId);
        postMessage({ id, action, result: undefined });
        break;
      }
      case "addGroupMembers": {
        const group = getGroup(data.id);
        await group.addMembers(data.accountAddresses);
        postMessage({ id, action, result: undefined });
        break;
      }
      case "removeGroupMembers": {
        const group = getGroup(data.id);
        await group.removeMembers(data.accountAddresses);
        postMessage({ id, action, result: undefined });
        break;
      }
      case "addGroupMembersByInboxId": {
        const group = getGroup(data.id);
        await group.addMembersByInboxId(data.inboxIds);
        postMessage({ id, action, result: undefined });
        break;
      }
      case "removeGroupMembersByInboxId": {
        const group = getGroup(data.id);
        await group.removeMembersByInboxId(data.inboxIds);
        postMessage({ id, action, result: undefined });
        break;
      }
      case "isGroupAdmin": {
        const group = getGroup(data.id);
        const result = group.isAdmin(data.inboxId);
        postMessage({ id, action, result });
        break;
      }
      case "isGroupSuperAdmin": {
        const group = getGroup(data.id);
        const result = group.isSuperAdmin(data.inboxId);
        postMessage({ id, action, result });
        break;
      }
      case "getDmPeerInboxId": {
        const group = getGroup(data.id);
        const result = group.dmPeerInboxId();
        postMessage({ id, action, result });
        break;
      }
      case "updateGroupPermissionPolicy": {
        const group = getGroup(data.id);
        await group.updatePermission(
          data.permissionType,
          data.policy,
          data.metadataField,
        );
        postMessage({ id, action, result: undefined });
        break;
      }
      case "getGroupPermissions": {
        const group = getGroup(data.id);
        const safeConversation = await toSafeConversation(group);
        const result = safeConversation.permissions;
        postMessage({ id, action, result });
        break;
      }
      case "getGroupMessageDisappearingSettings": {
        const group = getGroup(data.id);
        const settings = group.messageDisappearingSettings();
        const result = settings
          ? toSafeMessageDisappearingSettings(settings)
          : undefined;
        postMessage({ id, action, result });
        break;
      }
      case "updateGroupMessageDisappearingSettings": {
        const group = getGroup(data.id);
        await group.updateMessageDisappearingSettings(data.fromNs, data.inNs);
        postMessage({ id, action, result: undefined });
        break;
      }
      case "removeGroupMessageDisappearingSettings": {
        const group = getGroup(data.id);
        await group.removeMessageDisappearingSettings();
        postMessage({ id, action, result: undefined });
        break;
      }
      case "isGroupMessageDisappearingEnabled": {
        const group = getGroup(data.id);
        const result = group.isMessageDisappearingEnabled();
        postMessage({ id, action, result });
        break;
      }
      case "streamGroupMessages": {
        const group = getGroup(data.groupId);
        const streamCallback = (
          error: Error | null,
          value: Message | undefined,
        ) => {
          if (error) {
            postStreamMessageError({
              type: "message",
              streamId: data.streamId,
              error: error.message,
            });
          } else {
            postStreamMessage({
              type: "message",
              streamId: data.streamId,
              result: value ? toSafeMessage(value) : undefined,
            });
          }
        };
        const streamCloser = group.stream(streamCallback);
        streamClosers.set(data.streamId, streamCloser);
        postMessage({ id, action, result: undefined });
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

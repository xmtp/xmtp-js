import init, {
  type Consent,
  type Conversation,
  type Message,
  type StreamCloser,
  type UserPreference,
} from "@xmtp/wasm-bindings";
import type {
  ActionErrorData,
  ActionName,
  ActionWithoutResult,
  ClientWorkerAction,
  ExtractActionWithoutData,
} from "@/types/actions";
import type {
  ExtractStreamAction,
  StreamActionErrorData,
  StreamActionName,
} from "@/types/actions/streams";
import {
  fromEncodedContent,
  fromSafeEncodedContent,
  toSafeApiStats,
  toSafeConsent,
  toSafeConversation,
  toSafeConversationDebugInfo,
  toSafeHmacKey,
  toSafeIdentityStats,
  toSafeInboxState,
  toSafeKeyPackageStatus,
  toSafeMessage,
  toSafeMessageDisappearingSettings,
} from "@/utils/conversions";
import {
  ClientNotInitializedError,
  GroupNotFoundError,
  StreamNotFoundError,
} from "@/utils/errors";
import { WorkerClient } from "@/WorkerClient";
import { WorkerConversation } from "@/WorkerConversation";

let maybeClient: WorkerClient | undefined;
let enableLogging = false;

const streamClosers = new Map<string, StreamCloser>();

/**
 * Type-safe postMessage
 */
const postMessage = <A extends ActionName<ClientWorkerAction>>(
  data: ExtractActionWithoutData<ClientWorkerAction, A>,
) => {
  self.postMessage(data);
};

/**
 * Type-safe postMessage for errors
 */
const postMessageError = (data: ActionErrorData<ClientWorkerAction>) => {
  self.postMessage(data);
};

/**
 * Type-safe postMessage for streams
 */
const postStreamMessage = <A extends StreamActionName>(
  data: ExtractStreamAction<A>,
) => {
  self.postMessage(data);
};

/**
 * Type-safe postMessage for stream errors
 */
const postStreamMessageError = (data: StreamActionErrorData) => {
  self.postMessage(data);
};

self.onmessage = async (
  event: MessageEvent<ActionWithoutResult<ClientWorkerAction>>,
) => {
  const { action, id, data } = event.data;

  if (enableLogging) {
    console.log("client worker received event data", event.data);
  }

  // initialize WASM module
  await init();

  try {
    // init is a special action that initializes the client
    if (action === "client.init" && !maybeClient) {
      maybeClient = await WorkerClient.create(data.identifier, data.options);
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
      throw new ClientNotInitializedError();
    }

    // let typescript know that a client will be available for the rest
    // of this code block
    const client = maybeClient;

    // helper function that throws an error if the group is not found
    const getGroup = (groupId: string) => {
      const group = client.conversations.getConversationById(groupId);
      if (!group) {
        throw new GroupNotFoundError(groupId);
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
          throw new StreamNotFoundError(data.streamId);
        }
        break;
      }
      /**
       * Client actions
       */
      case "client.createInboxSignatureText": {
        const result = client.createInboxSignatureText();
        postMessage({ id, action, result });
        break;
      }
      case "client.addAccountSignatureText": {
        const result = await client.addAccountSignatureText(data.newIdentifier);
        postMessage({ id, action, result });
        break;
      }
      case "client.removeAccountSignatureText": {
        const result = await client.removeAccountSignatureText(data.identifier);
        postMessage({ id, action, result });
        break;
      }
      case "client.revokeAllOtherInstallationsSignatureText": {
        const result = await client.revokeAllAOtherInstallationsSignatureText();
        postMessage({ id, action, result });
        break;
      }
      case "client.revokeInstallationsSignatureText": {
        const result = await client.revokeInstallationsSignatureText(
          data.installationIds,
        );
        postMessage({ id, action, result });
        break;
      }
      case "client.changeRecoveryIdentifierSignatureText": {
        const result = await client.changeRecoveryIdentifierSignatureText(
          data.identifier,
        );
        postMessage({ id, action, result });
        break;
      }
      case "client.addEcdsaSignature":
        await client.addEcdsaSignature(data.type, data.bytes);
        postMessage({ id, action, result: undefined });
        break;
      case "client.addScwSignature":
        await client.addScwSignature(
          data.type,
          data.bytes,
          data.chainId,
          data.blockNumber,
        );
        postMessage({ id, action, result: undefined });
        break;
      case "client.applySignatures":
        await client.applySignatures();
        postMessage({ id, action, result: undefined });
        break;
      case "client.registerIdentity":
        await client.registerIdentity();
        postMessage({ id, action, result: undefined });
        break;
      case "client.isRegistered": {
        const result = client.isRegistered;
        postMessage({ id, action, result });
        break;
      }
      case "client.canMessage": {
        const result = await client.canMessage(data.identifiers);
        postMessage({ id, action, result });
        break;
      }
      case "client.findInboxIdByIdentifier": {
        const result = await client.findInboxIdByIdentifier(data.identifier);
        postMessage({ id, action, result });
        break;
      }
      case "client.signWithInstallationKey": {
        const result = client.signWithInstallationKey(data.signatureText);
        postMessage({ id, action, result });
        break;
      }
      case "client.verifySignedWithInstallationKey": {
        const result = client.verifySignedWithInstallationKey(
          data.signatureText,
          data.signatureBytes,
        );
        postMessage({ id, action, result });
        break;
      }
      case "client.verifySignedWithPublicKey": {
        const result = client.verifySignedWithPublicKey(
          data.signatureText,
          data.signatureBytes,
          data.publicKey,
        );
        postMessage({ id, action, result });
        break;
      }
      case "client.getKeyPackageStatusesForInstallationIds": {
        const result = await client.getKeyPackageStatusesForInstallationIds(
          data.installationIds,
        );
        const safeResult = new Map(
          Array.from(result.entries()).map(([installationId, status]) => [
            installationId,
            toSafeKeyPackageStatus(status),
          ]),
        );
        postMessage({
          id,
          action,
          result: safeResult,
        });
        break;
      }
      case "client.apiStatistics": {
        const apiStats = client.apiStatistics();
        const result = toSafeApiStats(apiStats);
        postMessage({ id, action, result });
        break;
      }
      case "client.apiIdentityStatistics": {
        const apiIdentityStats = client.apiIdentityStatistics();
        const result = toSafeIdentityStats(apiIdentityStats);
        postMessage({ id, action, result });
        break;
      }
      case "client.apiAggregateStatistics": {
        const result = client.apiAggregateStatistics();
        postMessage({ id, action, result });
        break;
      }
      /**
       * Preferences actions
       */
      case "preferences.inboxState": {
        const inboxState = await client.preferences.inboxState(
          data.refreshFromNetwork,
        );
        const result = toSafeInboxState(inboxState);
        postMessage({ id, action, result });
        break;
      }
      case "preferences.inboxStateFromInboxIds": {
        const inboxStates = await client.preferences.inboxStateFromInboxIds(
          data.inboxIds,
          data.refreshFromNetwork,
        );
        const result = inboxStates.map(toSafeInboxState);
        postMessage({ id, action, result });
        break;
      }
      case "preferences.getLatestInboxState": {
        const inboxState = await client.preferences.getLatestInboxState(
          data.inboxId,
        );
        const result = toSafeInboxState(inboxState);
        postMessage({ id, action, result });
        break;
      }
      case "preferences.setConsentStates": {
        await client.preferences.setConsentStates(data.records);
        postMessage({ id, action, result: undefined });
        break;
      }
      case "preferences.getConsentState": {
        const result = await client.preferences.getConsentState(
          data.entityType,
          data.entity,
        );
        postMessage({ id, action, result });
        break;
      }
      case "preferences.sync": {
        const result = await client.preferences.sync();
        postMessage({ id, action, result });
        break;
      }
      case "preferences.streamConsent": {
        const streamCallback = (
          error: Error | null,
          value: Consent[] | undefined,
        ) => {
          if (error) {
            postStreamMessageError({
              action: "stream.consent",
              streamId: data.streamId,
              error,
            });
          } else {
            postStreamMessage({
              action: "stream.consent",
              streamId: data.streamId,
              result: value?.map(toSafeConsent) ?? [],
            });
          }
        };
        const streamCloser = client.preferences.streamConsent(streamCallback);
        streamClosers.set(data.streamId, streamCloser);
        postMessage({
          id,
          action,
          result: undefined,
        });
        break;
      }
      case "preferences.streamPreferences": {
        const streamCallback = (
          error: Error | null,
          value: UserPreference[] | undefined,
        ) => {
          if (error) {
            postStreamMessageError({
              action: "stream.preferences",
              streamId: data.streamId,
              error,
            });
          } else {
            postStreamMessage({
              action: "stream.preferences",
              streamId: data.streamId,
              result: value ?? undefined,
            });
          }
        };
        const streamCloser =
          client.preferences.streamPreferences(streamCallback);
        streamClosers.set(data.streamId, streamCloser);
        postMessage({
          id,
          action,
          result: undefined,
        });
        break;
      }
      /**
       * Conversations actions
       */
      case "conversations.stream": {
        const streamCallback = async (
          error: Error | null,
          value: Conversation | undefined,
        ) => {
          if (error) {
            postStreamMessageError({
              action: "stream.conversation",
              streamId: data.streamId,
              error,
            });
          } else {
            postStreamMessage({
              action: "stream.conversation",
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
      case "conversations.streamAllMessages": {
        const streamCallback = (
          error: Error | null,
          value: Message | undefined,
        ) => {
          if (error) {
            postStreamMessageError({
              action: "stream.message",
              streamId: data.streamId,
              error,
            });
          } else {
            postStreamMessage({
              action: "stream.message",
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
      case "conversations.list": {
        const conversations = client.conversations.list(data.options);
        const result = await Promise.all(
          conversations.map((conversation) => toSafeConversation(conversation)),
        );
        postMessage({ id, action, result });
        break;
      }
      case "conversations.listGroups": {
        const conversations = client.conversations.listGroups(data.options);
        const result = await Promise.all(
          conversations.map((conversation) => toSafeConversation(conversation)),
        );
        postMessage({ id, action, result });
        break;
      }
      case "conversations.listDms": {
        const conversations = client.conversations.listDms(data.options);
        const result = await Promise.all(
          conversations.map((conversation) => toSafeConversation(conversation)),
        );
        postMessage({ id, action, result });
        break;
      }
      case "conversations.newGroupOptimistic": {
        const conversation = client.conversations.newGroupOptimistic(
          data.options,
        );
        const result = await toSafeConversation(conversation);
        postMessage({ id, action, result });
        break;
      }
      case "conversations.newGroupWithIdentifiers": {
        const conversation = await client.conversations.newGroupWithIdentifiers(
          data.identifiers,
          data.options,
        );
        const result = await toSafeConversation(conversation);
        postMessage({ id, action, result });
        break;
      }
      case "conversations.newGroup": {
        const conversation = await client.conversations.newGroup(
          data.inboxIds,
          data.options,
        );
        const result = await toSafeConversation(conversation);
        postMessage({ id, action, result });
        break;
      }
      case "conversations.newDmWithIdentifier": {
        const conversation = await client.conversations.newDmWithIdentifier(
          data.identifier,
          data.options,
        );
        const result = await toSafeConversation(conversation);
        postMessage({ id, action, result });
        break;
      }
      case "conversations.newDm": {
        const conversation = await client.conversations.newDm(
          data.inboxId,
          data.options,
        );
        const result = await toSafeConversation(conversation);
        postMessage({ id, action, result });
        break;
      }
      case "conversations.sync": {
        await client.conversations.sync();
        postMessage({ id, action, result: undefined });
        break;
      }
      case "conversations.syncAll": {
        await client.conversations.syncAll(data.consentStates);
        postMessage({ id, action, result: undefined });
        break;
      }
      case "conversations.getConversationById": {
        const conversation = client.conversations.getConversationById(data.id);
        const result = conversation
          ? await toSafeConversation(conversation)
          : undefined;
        postMessage({ id, action, result });
        break;
      }
      case "conversations.getMessageById": {
        const message = client.conversations.getMessageById(data.id);
        const result = message ? toSafeMessage(message) : undefined;
        postMessage({ id, action, result });
        break;
      }
      case "conversations.getDmByInboxId": {
        const conversation = client.conversations.getDmByInboxId(data.inboxId);
        const result = conversation
          ? await toSafeConversation(conversation)
          : undefined;
        postMessage({ id, action, result });
        break;
      }
      case "conversations.getHmacKeys": {
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
      case "conversation.sync": {
        const group = getGroup(data.id);
        await group.sync();
        const result = await toSafeConversation(group);
        postMessage({ id, action, result });
        break;
      }
      case "conversation.consentState": {
        const group = getGroup(data.id);
        const result = group.consentState;
        postMessage({ id, action, result });
        break;
      }
      case "conversation.updateConsentState": {
        const group = getGroup(data.id);
        group.updateConsentState(data.state);
        postMessage({ id, action, result: undefined });
        break;
      }
      case "group.updateName": {
        const group = getGroup(data.id);
        await group.updateName(data.name);
        postMessage({ id, action, result: undefined });
        break;
      }
      case "group.updateDescription": {
        const group = getGroup(data.id);
        await group.updateDescription(data.description);
        postMessage({ id, action, result: undefined });
        break;
      }
      case "group.updateImageUrl": {
        const group = getGroup(data.id);
        await group.updateImageUrl(data.imageUrl);
        postMessage({ id, action, result: undefined });
        break;
      }
      case "conversation.send": {
        const group = getGroup(data.id);
        const result = await group.send(
          fromEncodedContent(fromSafeEncodedContent(data.content)),
        );
        postMessage({ id, action, result });
        break;
      }
      case "conversation.sendOptimistic": {
        const group = getGroup(data.id);
        const result = group.sendOptimistic(
          fromEncodedContent(fromSafeEncodedContent(data.content)),
        );
        postMessage({ id, action, result });
        break;
      }
      case "conversation.publishMessages": {
        const group = getGroup(data.id);
        await group.publishMessages();
        postMessage({ id, action, result: undefined });
        break;
      }
      case "conversation.messages": {
        const group = getGroup(data.id);
        const messages = await group.messages(data.options);
        const result = messages.map((message) => toSafeMessage(message));
        postMessage({ id, action, result });
        break;
      }
      case "conversation.members": {
        const group = getGroup(data.id);
        const result = await group.members();
        postMessage({ id, action, result });
        break;
      }
      case "group.listAdmins": {
        const group = getGroup(data.id);
        const result = group.admins;
        postMessage({ id, action, result });
        break;
      }
      case "group.listSuperAdmins": {
        const group = getGroup(data.id);
        const result = group.superAdmins;
        postMessage({ id, action, result });
        break;
      }
      case "group.addAdmin": {
        const group = getGroup(data.id);
        await group.addAdmin(data.inboxId);
        postMessage({ id, action, result: undefined });
        break;
      }
      case "group.removeAdmin": {
        const group = getGroup(data.id);
        await group.removeAdmin(data.inboxId);
        postMessage({ id, action, result: undefined });
        break;
      }
      case "group.addSuperAdmin": {
        const group = getGroup(data.id);
        await group.addSuperAdmin(data.inboxId);
        postMessage({ id, action, result: undefined });
        break;
      }
      case "group.removeSuperAdmin": {
        const group = getGroup(data.id);
        await group.removeSuperAdmin(data.inboxId);
        postMessage({ id, action, result: undefined });
        break;
      }
      case "group.addMembersByIdentifiers": {
        const group = getGroup(data.id);
        await group.addMembersByIdentifiers(data.identifiers);
        postMessage({ id, action, result: undefined });
        break;
      }
      case "group.removeMembersByIdentifiers": {
        const group = getGroup(data.id);
        await group.removeMembersByIdentifiers(data.identifiers);
        postMessage({ id, action, result: undefined });
        break;
      }
      case "group.addMembers": {
        const group = getGroup(data.id);
        await group.addMembers(data.inboxIds);
        postMessage({ id, action, result: undefined });
        break;
      }
      case "group.removeMembers": {
        const group = getGroup(data.id);
        await group.removeMembers(data.inboxIds);
        postMessage({ id, action, result: undefined });
        break;
      }
      case "group.isAdmin": {
        const group = getGroup(data.id);
        const result = group.isAdmin(data.inboxId);
        postMessage({ id, action, result });
        break;
      }
      case "group.isSuperAdmin": {
        const group = getGroup(data.id);
        const result = group.isSuperAdmin(data.inboxId);
        postMessage({ id, action, result });
        break;
      }
      case "dm.peerInboxId": {
        const group = getGroup(data.id);
        const result = group.dmPeerInboxId();
        postMessage({ id, action, result });
        break;
      }
      case "group.updatePermission": {
        const group = getGroup(data.id);
        await group.updatePermission(
          data.permissionType,
          data.policy,
          data.metadataField,
        );
        postMessage({ id, action, result: undefined });
        break;
      }
      case "group.permissions": {
        const group = getGroup(data.id);
        const safeConversation = await toSafeConversation(group);
        const result = safeConversation.permissions;
        postMessage({ id, action, result });
        break;
      }
      case "conversation.messageDisappearingSettings": {
        const group = getGroup(data.id);
        const settings = group.messageDisappearingSettings();
        const result = settings
          ? toSafeMessageDisappearingSettings(settings)
          : undefined;
        postMessage({ id, action, result });
        break;
      }
      case "conversation.updateMessageDisappearingSettings": {
        const group = getGroup(data.id);
        await group.updateMessageDisappearingSettings(data.fromNs, data.inNs);
        postMessage({ id, action, result: undefined });
        break;
      }
      case "conversation.removeMessageDisappearingSettings": {
        const group = getGroup(data.id);
        await group.removeMessageDisappearingSettings();
        postMessage({ id, action, result: undefined });
        break;
      }
      case "conversation.isMessageDisappearingEnabled": {
        const group = getGroup(data.id);
        const result = group.isMessageDisappearingEnabled();
        postMessage({ id, action, result });
        break;
      }
      case "conversation.stream": {
        const group = getGroup(data.groupId);
        const streamCallback = (
          error: Error | null,
          value: Message | undefined,
        ) => {
          if (error) {
            postStreamMessageError({
              action: "stream.message",
              streamId: data.streamId,
              error,
            });
          } else {
            postStreamMessage({
              action: "stream.message",
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
      case "conversation.pausedForVersion": {
        const group = getGroup(data.id);
        const result = group.pausedForVersion();
        postMessage({ id, action, result });
        break;
      }
      case "conversation.getHmacKeys": {
        const group = getGroup(data.id);
        const result = group.getHmacKeys();
        postMessage({ id, action, result });
        break;
      }
      case "dm.getDuplicateDms": {
        const group = getGroup(data.id);
        const dms = await group.getDuplicateDms();
        const result = await Promise.all(
          dms.map((dm) => toSafeConversation(dm)),
        );
        postMessage({ id, action, result });
        break;
      }
      case "conversation.debugInfo": {
        const group = getGroup(data.id);
        const debugInfo = await group.debugInfo();
        const result = toSafeConversationDebugInfo(debugInfo);
        postMessage({ id, action, result });
        break;
      }
    }
  } catch (e) {
    postMessageError({
      id,
      action,
      error: e as Error,
    });
  }
};

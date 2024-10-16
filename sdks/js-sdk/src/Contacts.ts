import { createConsentMessage } from "@xmtp/consent-proof-signature";
import { messageApi, privatePreferences, type invitation } from "@xmtp/proto";
import type { DecryptResponse_Response } from "@xmtp/proto/ts/dist/types/keystore_api/v1/keystore.pb";
import { hashMessage, hexToBytes } from "viem";
import { ecdsaSignerKey } from "@/crypto/Signature";
import { splitSignature } from "@/crypto/utils";
import type { ActionsMap } from "@/keystore/privatePreferencesStore";
import type { EnvelopeWithMessage } from "@/utils/async";
import type { OnConnectionLostCallback } from "./ApiClient";
import type Client from "./Client";
import JobRunner from "./conversations/JobRunner";
import Stream from "./Stream";

export type ConsentState = "allowed" | "denied" | "unknown";

export type ConsentListEntryType = "address" | "groupId" | "inboxId";

export type PrivatePreferencesAction =
  privatePreferences.PrivatePreferencesAction;

type PrivatePreferencesActionKey = keyof PrivatePreferencesAction;

type PrivatePreferencesActionValueKey = {
  [K in PrivatePreferencesActionKey]: keyof NonNullable<
    PrivatePreferencesAction[K]
  >;
}[PrivatePreferencesActionKey];

export class ConsentListEntry {
  value: string;
  entryType: ConsentListEntryType;
  permissionType: ConsentState;

  constructor(
    value: string,
    entryType: ConsentListEntryType,
    permissionType: ConsentState,
  ) {
    this.value = value;
    this.entryType = entryType;
    this.permissionType = permissionType;
  }

  get key(): string {
    return `${this.entryType}-${this.value}`;
  }

  static fromAddress(
    address: string,
    permissionType: ConsentState = "unknown",
  ): ConsentListEntry {
    return new ConsentListEntry(address, "address", permissionType);
  }

  static fromGroupId(
    groupId: string,
    permissionType: ConsentState = "unknown",
  ): ConsentListEntry {
    return new ConsentListEntry(groupId, "groupId", permissionType);
  }

  static fromInboxId(
    inboxId: string,
    permissionType: ConsentState = "unknown",
  ): ConsentListEntry {
    return new ConsentListEntry(inboxId, "inboxId", permissionType);
  }
}

export class ConsentList {
  client: Client;
  entries: Map<string, ConsentState>;

  constructor(client: Client) {
    this.entries = new Map<string, ConsentState>();
    this.client = client;
  }

  allow(address: string) {
    const entry = ConsentListEntry.fromAddress(address, "allowed");
    this.entries.set(entry.key, "allowed");
    return entry;
  }

  deny(address: string) {
    const entry = ConsentListEntry.fromAddress(address, "denied");
    this.entries.set(entry.key, "denied");
    return entry;
  }

  allowGroup(groupId: string) {
    const entry = ConsentListEntry.fromGroupId(groupId, "allowed");
    this.entries.set(entry.key, "allowed");
    return entry;
  }

  denyGroup(groupId: string) {
    const entry = ConsentListEntry.fromGroupId(groupId, "denied");
    this.entries.set(entry.key, "denied");
    return entry;
  }

  allowInboxId(inboxId: string) {
    const entry = ConsentListEntry.fromInboxId(inboxId, "allowed");
    this.entries.set(entry.key, "allowed");
    return entry;
  }

  denyInboxId(inboxId: string) {
    const entry = ConsentListEntry.fromInboxId(inboxId, "denied");
    this.entries.set(entry.key, "denied");
    return entry;
  }

  state(address: string) {
    const entry = ConsentListEntry.fromAddress(address);
    return this.entries.get(entry.key) ?? "unknown";
  }

  groupState(groupId: string) {
    const entry = ConsentListEntry.fromGroupId(groupId);
    return this.entries.get(entry.key) ?? "unknown";
  }

  inboxIdState(inboxId: string) {
    const entry = ConsentListEntry.fromInboxId(inboxId);
    return this.entries.get(entry.key) ?? "unknown";
  }

  /**
   * Decode messages and save them to the keystore
   */
  async decodeMessages(messageMap: Map<string, Uint8Array>) {
    const messages = Array.from(messageMap.values());
    // decrypt messages
    const { responses } = await this.client.keystore.selfDecrypt({
      requests: messages.map((message) => ({ payload: message })),
    });

    const decryptedMessageEntries = Array.from(messageMap.keys()).map(
      (key, index) =>
        [key, responses[index]] as [string, DecryptResponse_Response],
    );

    // decode decrypted messages into actions, convert to map
    const actionsMap = decryptedMessageEntries.reduce(
      (result, [key, response]) => {
        if (response.result?.decrypted) {
          const action = privatePreferences.PrivatePreferencesAction.decode(
            response.result.decrypted,
          );
          result.set(key, action);
        }
        return result;
      },
      new Map<string, privatePreferences.PrivatePreferencesAction>(),
    );

    // save actions to keystore
    await this.client.keystore.savePrivatePreferences(actionsMap);

    return actionsMap;
  }

  /*
   * Process actions and update internal consent list
   */
  processActions(actionsMap: ActionsMap) {
    // actions to process
    const actions = Array.from(actionsMap.values());

    // update the consent list
    actions.forEach((action) => {
      action.allowAddress?.walletAddresses.forEach((address) => {
        this.allow(address);
      });
      action.denyAddress?.walletAddresses.forEach((address) => {
        this.deny(address);
      });
      action.allowGroup?.groupIds.forEach((groupId) => {
        this.allowGroup(groupId);
      });
      action.denyGroup?.groupIds.forEach((groupId) => {
        this.denyGroup(groupId);
      });
      action.allowInboxId?.inboxIds.forEach((inboxId) => {
        this.allowInboxId(inboxId);
      });
      action.denyInboxId?.inboxIds.forEach((inboxId) => {
        this.denyInboxId(inboxId);
      });
    });
  }

  async stream(onConnectionLost?: OnConnectionLostCallback) {
    const contentTopic =
      await this.client.keystore.getPrivatePreferencesTopic();

    return Stream.create<privatePreferences.PrivatePreferencesAction>(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      this.client,
      [contentTopic],
      async (envelope) => {
        // ignore envelopes without message or timestamp
        if (!envelope.message || !envelope.timestampNs) {
          return undefined;
        }

        // decode message and save to keystore
        const actionsMap = await this.decodeMessages(
          new Map([[envelope.timestampNs, envelope.message]]),
        );

        // update consent list
        this.processActions(actionsMap);

        // return the action
        return actionsMap.get(envelope.timestampNs);
      },
      undefined,
      onConnectionLost,
    );
  }

  reset() {
    // clear existing entries
    this.entries.clear();
  }

  async load(startTime?: Date) {
    const contentTopic =
      await this.client.keystore.getPrivatePreferencesTopic();

    // get private preferences from the network
    const messageEntries = (
      await this.client.listEnvelopes(
        contentTopic,
        // eslint-disable-next-line @typescript-eslint/require-await
        async ({ message, timestampNs }: EnvelopeWithMessage) =>
          [timestampNs, message] as [string | undefined, Uint8Array],
        {
          // special exception for private preferences topic
          pageSize: 500,
          // ensure messages are in ascending order
          direction: messageApi.SortDirection.SORT_DIRECTION_ASCENDING,
          startTime,
        },
      )
    )
      // filter out messages with no timestamp
      .filter(([timestampNs]) => Boolean(timestampNs)) as [
      string,
      Uint8Array,
    ][];

    // decode messages and save them to keystore
    await this.decodeMessages(new Map(messageEntries));

    // get all actions from keystore
    const actionsMap = this.client.keystore.getPrivatePreferences();

    // reset consent list
    this.reset();

    // process actions and update consent list
    this.processActions(actionsMap);

    return this.entries;
  }

  async publish(entries: ConsentListEntry[]) {
    // this reduce is purposefully verbose for type safety
    const action = entries.reduce((result, entry) => {
      let actionKey: PrivatePreferencesActionKey;
      let valueKey: PrivatePreferencesActionValueKey;
      let values: string[];
      // ignore unknown permission types
      if (entry.permissionType === "unknown") {
        return result;
      }
      switch (entry.entryType) {
        case "address": {
          actionKey =
            entry.permissionType === "allowed" ? "allowAddress" : "denyAddress";
          valueKey = "walletAddresses";
          values = result[actionKey]?.[valueKey] ?? [];
          break;
        }
        case "groupId": {
          actionKey =
            entry.permissionType === "allowed" ? "allowGroup" : "denyGroup";
          valueKey = "groupIds";
          values = result[actionKey]?.[valueKey] ?? [];
          break;
        }
        case "inboxId": {
          actionKey =
            entry.permissionType === "allowed" ? "allowInboxId" : "denyInboxId";
          valueKey = "inboxIds";
          values = result[actionKey]?.[valueKey] ?? [];
          break;
        }
        default:
          return result;
      }
      return {
        ...result,
        [actionKey]: {
          [valueKey]: [...values, entry.value],
        },
      };
      // eslint-disable-next-line @typescript-eslint/prefer-reduce-type-parameter
    }, {} as PrivatePreferencesAction);

    // get envelopes to publish (there should only be one)
    const envelopes =
      await this.client.keystore.createPrivatePreference(action);

    // publish private preferences update
    await this.client.publishEnvelopes(envelopes);

    // persist newly published private preference to keystore
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.client.keystore.savePrivatePreferences(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      new Map([[envelopes[0].timestamp!.getTime().toString(), action]]),
    );

    // update local entries after publishing
    entries.forEach((entry) => {
      this.entries.set(entry.key, entry.permissionType);
    });
  }
}

export class Contacts {
  /**
   * Addresses that the client has connected to
   */
  addresses: Set<string>;
  /**
   * XMTP client
   */
  client: Client;
  #consentList: ConsentList;
  #jobRunner: JobRunner;

  constructor(client: Client) {
    this.addresses = new Set<string>();
    this.client = client;
    this.#consentList = new ConsentList(client);
    this.#jobRunner = new JobRunner("user-preferences", client.keystore);
  }

  /**
   * Validate the signature and timestamp of a consent proof
   */
  #validateConsentSignature(
    { signature, timestamp }: invitation.ConsentProofPayload,
    peerAddress: string,
  ): boolean {
    const timestampMs = Number(timestamp);
    if (!signature || !timestampMs) {
      return false;
    }
    // timestamp should be in the past
    if (timestampMs > Date.now()) {
      return false;
    }
    // timestamp should be within the last 30 days
    if (timestampMs < Date.now() - 1000 * 60 * 60 * 24 * 30) {
      return false;
    }
    const signatureData = splitSignature(signature as `0x${string}`);
    const message = createConsentMessage(peerAddress, timestampMs);
    const digest = hexToBytes(hashMessage(message));
    // Recover public key
    const publicKey = ecdsaSignerKey(digest, signatureData);
    return publicKey?.getEthereumAddress() === this.client.address;
  }

  async loadConsentList(startTime?: Date) {
    return this.#jobRunner.run(async (lastRun) => {
      // allow for override of startTime
      const entries = await this.#consentList.load(startTime ?? lastRun);
      try {
        const conversations = await this.client.conversations.list();
        const validConsentProofAddresses: string[] = conversations.reduce(
          (result, conversation) => {
            if (
              conversation.consentProof &&
              this.consentState(conversation.peerAddress) === "unknown" &&
              this.#validateConsentSignature(
                conversation.consentProof,
                conversation.peerAddress,
              )
            ) {
              return result.concat(conversation.peerAddress);
            } else {
              return result;
            }
          },
          // eslint-disable-next-line @typescript-eslint/prefer-reduce-type-parameter
          [] as string[],
        );
        if (validConsentProofAddresses.length) {
          await this.client.contacts.allow(validConsentProofAddresses);
        }
      } catch (err) {
        console.log(err);
      }
      return entries;
    });
  }

  async refreshConsentList() {
    // clear existing consent list
    this.#consentList.reset();
    // reset last run time to the epoch
    await this.#jobRunner.resetLastRunTime();
    // reload the consent list
    return this.loadConsentList();
  }

  async streamConsentList(onConnectionLost?: OnConnectionLostCallback) {
    return this.#consentList.stream(onConnectionLost);
  }

  setConsentListEntries(entries: ConsentListEntry[]) {
    if (!entries.length) {
      return;
    }
    this.#consentList.reset();
    entries.forEach((entry) => {
      if (entry.permissionType === "allowed") {
        this.#consentList.allow(entry.value);
      }
      if (entry.permissionType === "denied") {
        this.#consentList.deny(entry.value);
      }
    });
  }

  isAllowed(address: string) {
    return this.#consentList.state(address) === "allowed";
  }

  isDenied(address: string) {
    return this.#consentList.state(address) === "denied";
  }

  isGroupAllowed(groupId: string) {
    return this.#consentList.groupState(groupId) === "allowed";
  }

  isGroupDenied(groupId: string) {
    return this.#consentList.groupState(groupId) === "denied";
  }

  isInboxAllowed(inboxId: string) {
    return this.#consentList.inboxIdState(inboxId) === "allowed";
  }

  isInboxDenied(inboxId: string) {
    return this.#consentList.inboxIdState(inboxId) === "denied";
  }

  consentState(address: string) {
    return this.#consentList.state(address);
  }

  groupConsentState(groupId: string) {
    return this.#consentList.groupState(groupId);
  }

  inboxConsentState(inboxId: string) {
    return this.#consentList.inboxIdState(inboxId);
  }

  async allow(addresses: string[]) {
    await this.#consentList.publish(
      addresses.map((address) =>
        ConsentListEntry.fromAddress(address, "allowed"),
      ),
    );
  }

  async deny(addresses: string[]) {
    await this.#consentList.publish(
      addresses.map((address) =>
        ConsentListEntry.fromAddress(address, "denied"),
      ),
    );
  }

  async allowGroups(groupIds: string[]) {
    await this.#consentList.publish(
      groupIds.map((groupId) =>
        ConsentListEntry.fromGroupId(groupId, "allowed"),
      ),
    );
  }

  async denyGroups(groupIds: string[]) {
    await this.#consentList.publish(
      groupIds.map((groupId) =>
        ConsentListEntry.fromGroupId(groupId, "denied"),
      ),
    );
  }

  async allowInboxes(inboxIds: string[]) {
    await this.#consentList.publish(
      inboxIds.map((inboxId) =>
        ConsentListEntry.fromInboxId(inboxId, "allowed"),
      ),
    );
  }

  async denyInboxes(inboxIds: string[]) {
    await this.#consentList.publish(
      inboxIds.map((inboxId) =>
        ConsentListEntry.fromInboxId(inboxId, "denied"),
      ),
    );
  }
}

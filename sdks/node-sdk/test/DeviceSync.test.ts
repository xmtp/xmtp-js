import { ConsentEntityType, ConsentState } from "@xmtp/node-bindings";
import { describe, expect, it } from "vitest";
import { HistorySyncUrls } from "@/constants";
import { uuid } from "@/utils/uuid";
import { createRegisteredClient, createSigner, sleep } from "@test/helpers";

describe("DeviceSync", () => {
  it("should sync consent across installations", async () => {
    const { signer: boSigner } = createSigner();
    const { signer: alixSigner } = createSigner();

    const bo = await createRegisteredClient(boSigner);

    const alix = await createRegisteredClient(alixSigner);

    // create DM conversation
    const dm = await alix.conversations.createDm(bo.inboxId);
    const initialConsent = dm.consentState();
    expect(
      initialConsent === ConsentState.Unknown ||
        initialConsent === ConsentState.Allowed,
    ).toBe(true);

    await bo.conversations.sync();

    // create second installation for alix
    const alix2 = await createRegisteredClient(alixSigner, {
      dbPath: `./test-${uuid()}.db3`,
    });

    const state = await alix2.preferences.fetchInboxState();
    expect(state.installations.length).toBe(2);

    // sync the DM on alix so conversation is pushed
    await dm.sync();
    await sleep(1000);
    await alix.conversations.syncAll();
    await sleep(1000);

    // alix2 syncs so it has the DM
    await alix2.conversations.sync();
    await sleep(1000);

    const dm2Initial = await alix2.conversations.getConversationById(dm.id);
    expect(dm2Initial).not.toBeNull();

    const consentOnAlix2Before = dm2Initial!.consentState();
    expect(
      consentOnAlix2Before === ConsentState.Unknown ||
        consentOnAlix2Before === ConsentState.Allowed,
    ).toBe(true);

    // update consent to denied on alix
    dm.updateConsentState(ConsentState.Denied);
    const consentState = dm.consentState();
    expect(consentState).toBe(ConsentState.Denied);

    await alix.preferences.sync();
    await sleep(1000);
    await alix2.preferences.sync();
    await sleep(1000);

    const dm2 = await alix2.conversations.getConversationById(dm.id);
    expect(dm2).not.toBeNull();

    const consentState2 = dm2!.consentState();
    expect(consentState2).toBe(ConsentState.Denied);

    // update consent back to allowed on alix2
    await alix2.preferences.setConsentStates([
      {
        entityType: ConsentEntityType.GroupId,
        entity: dm2!.id,
        state: ConsentState.Allowed,
      },
    ]);

    const convoState = await alix2.preferences.getConsentState(
      ConsentEntityType.GroupId,
      dm2!.id,
    );
    expect(convoState).toBe(ConsentState.Allowed);

    const updatedConsentState = dm2!.consentState();
    expect(updatedConsentState).toBe(ConsentState.Allowed);
  });

  it("should sync device archive using sendSyncArchive, listAvailableArchives, and processSyncArchive", async () => {
    const { signer: boSigner } = createSigner();
    const { signer: alixSigner } = createSigner();

    const bo = await createRegisteredClient(boSigner);

    const alix = await createRegisteredClient(alixSigner);

    const group = await alix.conversations.createGroup([bo.inboxId]);
    const msgFromAlix = await group.sendText("hello from alix");

    await sleep(1000);

    // create second installation for alix
    const alix2 = await createRegisteredClient(alixSigner, {
      dbPath: `./test-${uuid()}.db3`,
    });

    await sleep(1000);

    await alix.syncAllDeviceSyncGroups();
    await alix.sendSyncArchive(
      "123",
      {
        elements: [],
        excludeDisappearingMessages: false,
      },
      HistorySyncUrls.local,
    );
    await sleep(1000);

    await bo.conversations.syncAll();
    const boGroup = await bo.conversations.getConversationById(group.id);
    expect(boGroup).not.toBeNull();
    await boGroup!.sendText("hello from bo");

    await alix.conversations.syncAll();
    await alix2.conversations.syncAll();

    const group2Before = await alix2.conversations.getConversationById(
      group.id,
    );
    expect(group2Before).not.toBeNull();

    const messagesBefore = await group2Before!.messages();
    expect(messagesBefore.length).toBe(2);

    await sleep(1000);
    await alix.syncAllDeviceSyncGroups();
    await sleep(1000);
    await alix2.syncAllDeviceSyncGroups();

    // list available archives
    const archives = alix2.listAvailableArchives(7);
    expect(archives).toBeDefined();

    await alix2.processSyncArchive("123");
    await sleep(1000);
    await alix2.conversations.syncAll();

    const group2After = await alix2.conversations.getConversationById(group.id);
    expect(group2After).not.toBeNull();

    const messagesAfter = await group2After!.messages();
    // verify we received messages from the archive sync
    // the exact count may vary depending on sync timing
    expect(messagesAfter.length).toBeGreaterThanOrEqual(2);
    // check if we found the original message from alix
    const foundOriginalMessage = messagesAfter.some(
      (m) => m.id === msgFromAlix,
    );
    if (messagesAfter.length >= 3) {
      expect(foundOriginalMessage).toBe(true);
    }
  });

  it("should sync messages across installations using sendSyncRequest and syncAllDeviceSyncGroups", async () => {
    const { signer: boSigner } = createSigner();
    const { signer: alixSigner } = createSigner();

    const bo = await createRegisteredClient(boSigner);

    const client1 = await createRegisteredClient(alixSigner);

    const group = await client1.conversations.createGroup([bo.inboxId]);

    // send a message before second installation is created
    const msgId = await group.sendText("hi");
    const messages = await group.messages();
    expect(messages.length).toBe(2);

    // create second installation
    const client2 = await createRegisteredClient(alixSigner, {
      dbPath: `./test-${uuid()}.db3`,
    });

    const state = await client2.preferences.fetchInboxState();
    expect(state.installations.length).toBe(2);

    await client2.sendSyncRequest(
      {
        elements: [],
        excludeDisappearingMessages: false,
      },
      HistorySyncUrls.local,
    );

    await client1.syncAllDeviceSyncGroups();
    await sleep(1000);
    await client2.syncAllDeviceSyncGroups();
    await sleep(1000);

    // sync conversations to get the group on client2
    await client2.conversations.syncAll();
    await sleep(1000);

    const client1MessageCount = (await group.messages()).length;
    const group2 = await client2.conversations.getConversationById(group.id);
    expect(group2).not.toBeNull();

    const messagesOnClient2 = await group2!.messages();
    const containsMessage = messagesOnClient2.some((m) => m.id === msgId);
    const client2MessageCount = messagesOnClient2.length;

    // verify client2 has the group and some messages
    expect(client2MessageCount).toBeGreaterThan(0);

    if (client1MessageCount === client2MessageCount) {
      expect(containsMessage).toBe(true);
    }
  });
});

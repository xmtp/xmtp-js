import {
  ConversationType,
  ListConversationsOrderBy,
} from "@xmtp/wasm-bindings";
import { describe, expect, it } from "vitest";
import { uuid } from "@/utils/uuid";
import { createRegisteredClient, createSigner, sleep } from "@test/helpers";

describe("Conversations", () => {
  it("should have a topic", async () => {
    const { signer } = createSigner();
    const client = await createRegisteredClient(signer);
    expect(client.conversations.topic).toBe(
      `/xmtp/mls/1/w-${client.installationId}/proto`,
    );
  });

  it("should not have initial conversations", async () => {
    const { signer } = createSigner();
    const client = await createRegisteredClient(signer);
    expect((await client.conversations.list()).length).toBe(0);
    expect((await client.conversations.listDms()).length).toBe(0);
    expect((await client.conversations.listGroups()).length).toBe(0);
  });

  it("should get a group or DM by ID", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);

    const group = await client1.conversations.createGroup([client2.inboxId!]);
    expect(group).toBeDefined();
    expect(group.id).toBeDefined();
    const foundGroup = await client1.conversations.getConversationById(
      group.id,
    );
    expect(foundGroup).toBeDefined();
    expect(foundGroup!.id).toBe(group.id);

    const dm = await client1.conversations.createDm(client2.inboxId!);
    expect(dm).toBeDefined();
    expect(dm.id).toBeDefined();
    const foundDm = await client1.conversations.getConversationById(dm.id);
    expect(foundDm).toBeDefined();
    expect(foundDm!.id).toBe(dm.id);
  });

  it("should get a DM by inbox ID", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const dm = await client1.conversations.createDm(client2.inboxId!);
    const foundDm = await client1.conversations.getDmByInboxId(
      client2.inboxId!,
    );
    expect(foundDm).toBeDefined();
    expect(foundDm!.id).toBe(dm.id);
  });

  it("should get a DM by identifier", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2, identifier: identifier2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const dm = await client1.conversations.createDm(client2.inboxId!);
    const foundDm =
      await client1.conversations.fetchDmByIdentifier(identifier2);
    expect(foundDm).toBeDefined();
    expect(foundDm!.id).toBe(dm.id);
  });

  it("should get a message by ID", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.createGroup([client2.inboxId!]);
    const messageId = await group.sendText("gm!");
    expect(messageId).toBeDefined();

    const message = await client1.conversations.getMessageById(messageId);
    expect(message).toBeDefined();
    expect(message!.id).toBe(messageId);
  });

  it("should list conversations with options", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const { signer: signer3 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const client3 = await createRegisteredClient(signer3);
    const group1 = await client1.conversations.createGroup([client2.inboxId!]);
    const group2 = await client1.conversations.createGroup([client3.inboxId!]);
    const dm1 = await client1.conversations.createDm(client2.inboxId!);
    const dm2 = await client1.conversations.createDm(client3.inboxId!);

    // conversations by type (group)
    const groups = await client1.conversations.list({
      conversationType: ConversationType.Group,
    });
    expect(groups.length).toBe(2);
    expect(groups[0].id).toBe(group2.id);
    expect(groups[1].id).toBe(group1.id);

    // conversations by type (dm)
    const dms = await client1.conversations.list({
      conversationType: ConversationType.Dm,
    });
    expect(dms.length).toBe(2);
    expect(dms[0].id).toBe(dm2.id);
    expect(dms[1].id).toBe(dm1.id);

    // conversations by created before timestamp
    const convos = await client1.conversations.list({
      createdBeforeNs: dm2.createdAtNs,
    });
    expect(convos.length).toBe(3);
    expect(convos[0].id).toBe(dm1.id);
    expect(convos[1].id).toBe(group2.id);
    expect(convos[2].id).toBe(group1.id);

    // conversations by created after timestamp
    const convos2 = await client1.conversations.list({
      createdAfterNs: group1.createdAtNs,
    });
    expect(convos2.length).toBe(3);
    expect(convos2[0].id).toBe(dm2.id);
    expect(convos2[1].id).toBe(dm1.id);
    expect(convos2[2].id).toBe(group2.id);

    // conversations by created after timestamp and before timestamp
    const convos3 = await client1.conversations.list({
      createdBeforeNs: dm2.createdAtNs,
      createdAfterNs: group1.createdAtNs,
    });
    expect(convos3.length).toBe(2);
    expect(convos3[0].id).toBe(dm1.id);
    expect(convos3[1].id).toBe(group2.id);

    // conversations by limit
    const convos4 = await client1.conversations.list({
      limit: 1n,
      orderBy: ListConversationsOrderBy.CreatedAt,
    });
    expect(convos4.length).toBe(1);
    expect(convos4[0].id).toBe(dm2.id);

    // conversations by order by (created at)
    const convos5 = await client1.conversations.list({
      limit: 1n,
      orderBy: ListConversationsOrderBy.LastActivity,
    });
    expect(convos5.length).toBe(1);
    expect(convos5[0].id).toBe(dm2.id);
  });

  it("should stream new conversations", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const { signer: signer3 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const client3 = await createRegisteredClient(signer3);
    const stream = await client3.conversations.stream();
    const conversation1 = await client1.conversations.createGroup([
      client3.inboxId!,
    ]);
    const conversation2 = await client2.conversations.createDm(
      client3.inboxId!,
    );

    const expectedIds = [conversation1.id, conversation2.id];
    const receivedIds: string[] = [];

    setTimeout(() => {
      void stream.end();
    }, 1000);

    for await (const convo of stream) {
      expect(convo).toBeDefined();
      receivedIds.push(convo.id);
    }

    expect(receivedIds.length).toBe(2);
    expect(receivedIds.sort()).toEqual(expectedIds.sort());
    expect(
      (await client3.conversations.getConversationById(conversation1.id))?.id,
    ).toBe(conversation1.id);
    expect(
      (await client3.conversations.getConversationById(conversation2.id))?.id,
    ).toBe(conversation2.id);
  });

  it("should only stream group conversations", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const { signer: signer3 } = createSigner();
    const { signer: signer4 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const client3 = await createRegisteredClient(signer3);
    const client4 = await createRegisteredClient(signer4);
    const stream = await client3.conversations.streamGroups();
    await client4.conversations.createDm(client3.inboxId!);
    const group1 = await client1.conversations.createGroup([client3.inboxId!]);
    const group2 = await client2.conversations.createGroup([client3.inboxId!]);

    const expectedIds = [group1.id, group2.id];
    const receivedIds: string[] = [];

    setTimeout(() => {
      void stream.end();
    }, 2000);

    for await (const convo of stream) {
      expect(convo).toBeDefined();
      receivedIds.push(convo.id);
    }
    expect(receivedIds.length).toBe(2);
    expect(receivedIds.sort()).toEqual(expectedIds.sort());
  });

  it("should only stream dm conversations", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const { signer: signer3 } = createSigner();
    const { signer: signer4 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const client3 = await createRegisteredClient(signer3);
    const client4 = await createRegisteredClient(signer4);
    const stream = await client3.conversations.streamDms();
    await client1.conversations.createGroup([client3.inboxId!]);
    await client2.conversations.createGroup([client3.inboxId!]);
    const group3 = await client4.conversations.createDm(client3.inboxId!);

    setTimeout(() => {
      void stream.end();
    }, 2000);

    let count = 0;
    for await (const convo of stream) {
      count++;
      expect(convo).toBeDefined();
      if (count === 1) {
        expect(convo.id).toBe(group3.id);
      }
    }
    expect(count).toBe(1);
  });

  it("should stream all messages", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const { signer: signer3 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const client3 = await createRegisteredClient(signer3);
    await client1.conversations.createGroup([client2.inboxId!]);
    await client1.conversations.createDm(client3.inboxId!);

    await sleep(2000);

    const stream = await client1.conversations.streamAllMessages();

    await client2.conversations.sync();
    const groups2 = await client2.conversations.listGroups();

    await client3.conversations.sync();
    const groups3 = await client3.conversations.listDms();

    await groups2[0].sendText("gm!");
    await groups3[0].sendText("gm2!");

    setTimeout(() => {
      void stream.end();
    }, 2000);

    let count = 0;
    for await (const message of stream) {
      count++;
      expect(message).toBeDefined();
      if (count === 1) {
        expect(message.senderInboxId).toBe(client2.inboxId);
      }
      if (count === 2) {
        expect(message.senderInboxId).toBe(client3.inboxId);
      }
    }
    expect(count).toBe(2);
  });

  it("should only stream group conversation messages", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const { signer: signer3 } = createSigner();
    const { signer: signer4 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const client3 = await createRegisteredClient(signer3);
    const client4 = await createRegisteredClient(signer4);
    await client1.conversations.createGroup([client2.inboxId!]);
    await client1.conversations.createGroup([client3.inboxId!]);
    await client1.conversations.createDm(client4.inboxId!);

    await sleep(2000);

    const stream = await client1.conversations.streamAllGroupMessages();

    const groups2 = client2.conversations;
    await groups2.sync();
    const groupsList2 = await groups2.list();

    const groups3 = client3.conversations;
    await groups3.sync();
    const groupsList3 = await groups3.list();

    const groups4 = client4.conversations;
    await groups4.sync();
    const groupsList4 = await groups4.list();

    await groupsList4[0].sendText("gm3!");
    await groupsList2[0].sendText("gm!");
    await groupsList3[0].sendText("gm2!");

    setTimeout(() => {
      void stream.end();
    }, 2000);

    let count = 0;
    for await (const message of stream) {
      count++;
      expect(message).toBeDefined();
      if (count === 1) {
        expect(message.senderInboxId).toBe(client2.inboxId);
      }
      if (count === 2) {
        expect(message.senderInboxId).toBe(client3.inboxId);
      }
    }
    expect(count).toBe(2);
  });

  it("should only stream dm messages", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const { signer: signer3 } = createSigner();
    const { signer: signer4 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const client3 = await createRegisteredClient(signer3);
    const client4 = await createRegisteredClient(signer4);
    await client1.conversations.createGroup([client2.inboxId!]);
    await client1.conversations.createGroup([client3.inboxId!]);
    await client1.conversations.createDm(client4.inboxId!);

    await sleep(2000);

    const stream = await client1.conversations.streamAllDmMessages();

    const groups2 = client2.conversations;
    await groups2.sync();
    const groupsList2 = await groups2.list();

    const groups3 = client3.conversations;
    await groups3.sync();
    const groupsList3 = await groups3.list();

    const groups4 = client4.conversations;
    await groups4.sync();
    const groupsList4 = await groups4.list();

    await groupsList2[0].sendText("gm!");
    await groupsList3[0].sendText("gm2!");
    await groupsList4[0].sendText("gm3!");

    setTimeout(() => {
      void stream.end();
    }, 2000);

    let count = 0;
    for await (const message of stream) {
      count++;
      expect(message).toBeDefined();
      if (count === 1) {
        expect(message.senderInboxId).toBe(client4.inboxId);
      }
      expect(count).toBe(1);
    }
  });

  it("should get hmac keys", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.createGroup([client2.inboxId!]);
    const dm = await client1.conversations.createDm(client2.inboxId!);
    const hmacKeys = await client1.conversations.hmacKeys();
    expect(hmacKeys).toBeDefined();
    const keys = [...hmacKeys.keys()];
    expect(keys.length).toBe(2);
    expect(keys).toContain(group.id);
    expect(keys).toContain(dm.id);
    for (const values of hmacKeys.values()) {
      expect(values.length).toBe(3);
      for (const value of values) {
        expect(value.key).toBeDefined();
        expect(value.key.length).toBe(42);
        expect(value.epoch).toBeDefined();
        expect(typeof value.epoch).toBe("bigint");
      }
    }
  });

  it("should sync groups across installations", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2, {
      dbPath: `./test-${uuid()}.db3`,
    });
    await createRegisteredClient(signer2);

    const group = await client.conversations.createGroup([client2.inboxId!]);
    await client2.conversations.sync();
    const convos = await client2.conversations.listGroups();
    expect(convos.length).toBe(1);
    expect(convos[0].id).toBe(group.id);

    const group2 = await client.conversations.createDm(client2.inboxId!);
    await client2.conversations.sync();
    const convos2 = await client2.conversations.list();
    expect(convos2.length).toBe(2);
    const convos2Ids = convos2.map((c) => c.id);
    expect(convos2Ids).toContain(group.id);
    expect(convos2Ids).toContain(group2.id);
  });

  it("should stitch DM groups together", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const dm1 = await client1.conversations.createDm(client2.inboxId!);
    const dm2 = await client2.conversations.createDm(client1.inboxId!);

    await dm1.sendText("hi");
    // since this is the last message sent, the stitched group ID will be
    // this group ID
    await dm2.sendText("hi");

    await client1.conversations.sync();
    await client2.conversations.sync();
    await dm1.sync();
    await dm2.sync();

    const dm1_2 = await client1.conversations.getConversationById(dm1.id);
    const dm2_2 = await client2.conversations.getConversationById(dm2.id);
    expect(dm1_2?.id).toBe(dm2.id);
    expect(dm2_2?.id).toBe(dm2.id);

    const dms1 = await client1.conversations.listDms();
    const dms2 = await client2.conversations.listDms();
    expect(dms1[0].id).toBe(dm2.id);
    expect(dms2[0].id).toBe(dm2.id);

    const dupeDms1 = await dms1[0].duplicateDms();
    const dupeDms2 = await dms2[0].duplicateDms();
    expect(dupeDms1.length).toBe(1);
    expect(dupeDms2.length).toBe(1);
    expect(dupeDms1[0].id).toBe(dm1.id);
    expect(dupeDms2[0].id).toBe(dm1.id);
  });
});

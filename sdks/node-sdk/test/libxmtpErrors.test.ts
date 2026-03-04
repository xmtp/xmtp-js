import { GroupPermissionsOptions } from "@xmtp/node-bindings";
import { describe, expect, it } from "vitest";
import { Group } from "@/Group";
import { createRegisteredClient, createSigner } from "@test/helpers";

describe("LibXMTP errors", () => {
  it("should throw when a non-admin tries to add members", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const { signer: signer3 } = createSigner();

    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const client3 = await createRegisteredClient(signer3);

    // client1 creates an admin-only group and adds client2 as a regular member
    const group = await client1.conversations.createGroup([client2.inboxId], {
      permissions: GroupPermissionsOptions.AdminOnly,
    });

    // Sync client2 so they have the group
    await client2.conversations.sync();
    const group2 = await client2.conversations.getConversationById(group.id);

    // client2 (non-admin) tries to add client3 - this should fail
    if (!(group2 instanceof Group)) {
      throw new Error("Expected a Group conversation");
    }

    try {
      await group2.addMembers([client3.inboxId]);
      expect.fail("Expected an error to be thrown");
    } catch (error) {
      assert(error instanceof Error);
      expect(
        error.message.startsWith("[GroupError::Sync] synced 1 messages"),
      ).toBe(true);
    }
  });

  it("should throw when adding a non-existent inbox ID", async () => {
    const { signer } = createSigner();
    const client = await createRegisteredClient(signer);

    const group = await client.conversations.createGroup([]);

    const fakeInboxId =
      "0000000000000000000000000000000000000000000000000000000000000000";

    try {
      await group.addMembers([fakeInboxId]);
      expect.fail("Expected an error to be thrown");
    } catch (error) {
      assert(error instanceof Error);
      console.log(error.message);
      expect(error.message).toBe(
        "[GroupError::MissingSequenceId] SequenceId not found in local db",
      );
    }
  });
});

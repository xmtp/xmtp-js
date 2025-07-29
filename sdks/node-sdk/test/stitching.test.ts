import { v4 } from "uuid";
import { describe, expect, it } from "vitest";
import {
  createRegisteredClient,
  createSigner,
  createUser,
  sleep,
} from "@test/helpers";

describe.skip("DM stitching", () => {
  it("will stitch DM groups across installations", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const dm1 = await client1.conversations.newDm(client2.inboxId);
    const dm2 = await client2.conversations.newDm(client1.inboxId);

    console.log("DM group 1 ID", dm1.id);
    console.log("DM group 2 ID", dm2.id);

    expect(dm1.id).not.toBe(dm2.id);

    await dm1.send("hi");
    // since this is the last message sent, the stitched group ID will be
    // this group ID
    await dm2.send("hi");

    // create new installation for client1
    const client3 = await createRegisteredClient(signer1, {
      dbPath: `./test-${v4()}.db3`,
    });

    // sync everything (order is important here)
    await client2.conversations.syncAll();
    await client1.conversations.syncAll();
    await client3.conversations.syncAll();

    const dm1_2 = await client1.conversations.getConversationById(dm2.id);
    const dm2_2 = await client2.conversations.getConversationById(dm2.id);
    const dm3_2 = await client3.conversations.getConversationById(dm2.id);

    console.log(
      `client1 getConversationById("${dm2.id}") = group with ID ${dm1_2?.id}`,
    );
    console.log(
      `client2 getConversationById("${dm2.id}") = group with ID ${dm2_2?.id}`,
    );
    console.log(
      `client3 getConversationById("${dm2.id}") = group with ID ${dm3_2?.id}`,
    );

    expect(dm1_2?.id).toBe(dm2.id);
    expect(dm2_2?.id).toBe(dm2.id);
    expect(dm3_2?.id).toBe(dm2.id);

    const dms1 = client1.conversations.listDms();
    const dms2 = client2.conversations.listDms();
    const dms3 = client3.conversations.listDms();
    expect(dms1[0].id).toBe(dm2.id);
    expect(dms2[0].id).toBe(dm2.id);
    expect(dms3[0].id).toBe(dm2.id);

    const dupeDms1 = await dms1[0]?.getDuplicateDms();
    const dupeDms2 = await dms2[0]?.getDuplicateDms();
    const dupeDms3 = await dms3[0]?.getDuplicateDms();

    expect(dupeDms1.length).toBe(1);
    expect(dupeDms2.length).toBe(1);
    expect(dupeDms3.length).toBe(1);

    await sleep(2000);

    console.log(
      `client1 Dm.getDuplicateDms() = 1 group with ID ${dupeDms1[0]?.id}`,
    );
    console.log(
      `client2 Dm.getDuplicateDms() = 1 group with ID ${dupeDms2[0]?.id}`,
    );
    console.log(
      `client3 Dm.getDuplicateDms() = 1 group with ID ${dupeDms3[0]?.id}`,
    );

    expect(dupeDms1[0].id).toBe(dm1.id);
    expect(dupeDms2[0].id).toBe(dm1.id);
    expect(dupeDms3[0].id).toBe(dm1.id);
  });

  it("will not stitch DM groups across installations", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const dm1 = await client1.conversations.newDm(client2.inboxId);
    const dm2 = await client2.conversations.newDm(client1.inboxId);

    console.log(`DM group 1 ID: ${dm1.id}`);
    console.log(`DM group 2 ID: ${dm2.id})`);

    expect(dm1.id).not.toBe(dm2.id);

    await dm1.send("hi");
    // since this is the last message sent, the stitched group ID will be
    // this group ID
    await dm2.send("hi");

    // create new installation for client1
    const client3 = await createRegisteredClient(signer1, {
      dbPath: `./test-${v4()}.db3`,
    });

    // sync everything (order is important here)
    await client1.conversations.syncAll();
    await client2.conversations.syncAll();
    await client3.conversations.syncAll();

    const dm1_2 = await client1.conversations.getConversationById(dm2.id);
    const dm2_2 = await client2.conversations.getConversationById(dm2.id);
    const dm3_2 = await client3.conversations.getConversationById(dm2.id);

    console.log(
      `client1 getConversationById("${dm2.id}") = group with ID ${dm1_2?.id}`,
    );
    console.log(
      `client2 getConversationById("${dm2.id}") = group with ID ${dm2_2?.id}`,
    );
    console.log(
      `client3 getConversationById("${dm2.id}") = group with ID ${dm3_2?.id}`,
    );

    expect(dm1_2?.id).toBe(dm2.id);
    expect(dm2_2?.id).toBe(dm2.id);
    expect(dm3_2?.id).toBe(dm2.id);

    const dms1 = client1.conversations.listDms();
    const dms2 = client2.conversations.listDms();
    const dms3 = client3.conversations.listDms();
    expect(dms1[0].id).toBe(dm2.id);
    expect(dms2[0].id).toBe(dm2.id);
    expect(dms3[0].id).toBe(dm2.id);

    const dupeDms1 = await dms1[0]?.getDuplicateDms();
    const dupeDms2 = await dms2[0]?.getDuplicateDms();
    const dupeDms3 = await dms3[0]?.getDuplicateDms();

    expect(dupeDms1.length).toBe(1);
    expect(dupeDms2.length).toBe(1);
    expect(dupeDms3.length).toBe(1);

    await sleep(2000);

    console.log(
      `client1 Dm.getDuplicateDms() = 1 group with ID ${dupeDms1[0]?.id}`,
    );
    console.log(
      `client2 Dm.getDuplicateDms() = 1 group with ID ${dupeDms2[0]?.id}`,
    );
    console.log(
      `client3 Dm.getDuplicateDms() = 1 group with ID ${dupeDms3[0]?.id}`,
    );

    expect(dupeDms1[0].id).toBe(dm1.id);
    expect(dupeDms2[0].id).toBe(dm1.id);
    expect(dupeDms3[0].id).toBe(dm1.id);
  });
});

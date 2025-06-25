import { v4 } from "uuid";
import { describe, expect, it } from "vitest";
import { Utils } from "@/Utils";
import {
  createRegisteredClient,
  createSigner,
  createUser,
} from "@test/helpers";

describe("Utils", () => {
  it("should generate inbox id", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const utils = new Utils();
    const inboxId = await utils.generateInboxId(await signer.getIdentifier());
    expect(inboxId).toBeDefined();
  });

  it("should get inbox id for address", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const client = await createRegisteredClient(signer);
    const utils = new Utils();
    const inboxId = await utils.getInboxIdForIdentifier(
      await signer.getIdentifier(),
      "local",
    );
    expect(inboxId).toBe(client.inboxId);
  });

  it("should revoke installations", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const client = await createRegisteredClient(signer);
    const client2 = await createRegisteredClient(signer, {
      dbPath: `./test-${v4()}.db3`,
    });
    const client3 = await createRegisteredClient(signer, {
      dbPath: `./test-${v4()}.db3`,
    });

    const inboxState = await client3.preferences.inboxState(true);
    expect(inboxState.installations.length).toBe(3);

    const installationIds = inboxState.installations.map((i) => i.id);
    expect(installationIds).toContain(client.installationId);
    expect(installationIds).toContain(client2.installationId);
    expect(installationIds).toContain(client3.installationId);

    const utils = new Utils();
    await utils.revokeInstallations(
      signer,
      client.inboxId!,
      [client2.installationIdBytes!, client3.installationIdBytes!],
      "local",
    );

    const inboxState2 = await client.preferences.inboxState(true);
    expect(inboxState2.installations.length).toBe(1);
    expect(inboxState2.installations[0].id).toBe(client.installationId);
  });

  it("should get inbox state from inbox ids", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const client = await createRegisteredClient(signer);
    const utils = new Utils();
    const inboxState = await utils.inboxStateFromInboxIds(
      [client.inboxId!],
      "local",
    );
    expect(inboxState.length).toBe(1);
    expect(inboxState[0].inboxId).toBe(client.inboxId);
    expect(inboxState[0].identifiers).toEqual([await signer.getIdentifier()]);
  });
});

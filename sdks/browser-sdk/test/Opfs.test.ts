import { describe, expect, it } from "vitest";
import { createClient, createSigner, createUser } from "@test/helpers";

describe("Opfs", () => {
  it("should exist", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const client = await createClient(signer);
    const exists = await client.opfs.exists();
    expect(exists).toBe(true);
  });

  it("should not have an error", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const client = await createClient(signer);
    const error = await client.opfs.error();
    expect(error).toBeUndefined();
  });

  it("should have files", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const client = await createClient(signer);
    const fileNames = await client.opfs.getFileNames();
    expect(fileNames).toContain(
      `/test-${user.account.address.toLowerCase()}.db3`,
    );
    const fileCount = await client.opfs.getFileCount();
    expect(fileCount).toEqual(1);
  });

  it("should have capacity", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const client = await createClient(signer);
    const capacity = await client.opfs.getCapacity();
    expect(capacity).toBe(6);
  });

  it("should manage capacity", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const client = await createClient(signer);
    await client.opfs.initSqlite();
    await client.opfs.addCapacity(1);
    const capacity = await client.opfs.getCapacity();
    expect(capacity).toBe(7);
    await client.opfs.reduceCapacity(2);
    const capacity2 = await client.opfs.getCapacity();
    expect(capacity2).toBe(5);
  });

  it("should get file names", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const client = await createClient(signer);
    const fileNames = await client.opfs.getFileNames();
    expect(fileNames).toEqual([]);
    const fileCount = await client.opfs.getFileCount();
    expect(fileCount).toEqual(0);
  });
});

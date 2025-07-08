import { describe, expect, it } from "vitest";
import {
  createRegisteredClient,
  createSigner,
  createUser,
} from "@test/helpers";

describe("Opfs", () => {
  it("should list files", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const client = await createRegisteredClient(signer);
    const files = await client.opfs.listFiles();
    console.log(files);
    expect(files.length).toBe(1);
    await client.opfs.wipeFiles();
    // await client.opfs.rm(files[0]);
    const files2 = await client.opfs.listFiles();
    console.log(files2);
    expect(files2.length).toBe(0);
    const capacity = await client.opfs.getCapacity();
    console.log(capacity);
    expect(capacity).toBeGreaterThan(0);
    await client.opfs.addCapacity(1);
    const capacity2 = await client.opfs.getCapacity();
    console.log(capacity2);
    expect(capacity2).toBeGreaterThan(capacity);
    await client.opfs.reduceCapacity(1);
    const capacity3 = await client.opfs.getCapacity();
    console.log(capacity3);
  });

  it("should remove a file", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const client = await createRegisteredClient(signer);
    const files = await client.opfs.listFiles();
    await client.opfs.rm(files[0]);
    const files2 = await client.opfs.listFiles();
    expect(files2.length).toBe(0);
  });

  it.skip("should wipe files", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const client = await createRegisteredClient(signer);
    await client.opfs.wipeFiles();
    const files = await client.opfs.listFiles();
    expect(files.length).toBe(0);
  });

  it.skip("should get capacity", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const client = await createRegisteredClient(signer);
    const capacity = await client.opfs.getCapacity();
    console.log(capacity);
    expect(capacity).toBeGreaterThan(0);
  });
});

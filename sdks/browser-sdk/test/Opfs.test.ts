import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Opfs } from "@/Opfs";
import { uuid } from "@/utils/uuid";
import { createRegisteredClient, createSigner } from "./helpers";

describe.sequential("Opfs", () => {
  describe.sequential("with no files", () => {
    let opfs: Opfs;

    beforeEach(async () => {
      opfs = await Opfs.create();
    });

    afterEach(() => {
      opfs.close();
    });

    it("should list files", async () => {
      const files = await opfs.listFiles();
      expect(files).toHaveLength(0);
    });

    it("should get file count", async () => {
      const count = await opfs.fileCount();
      expect(count).toBe(0);
    });

    it("should get pool capacity", async () => {
      const capacity = await opfs.poolCapacity();
      expect(capacity).toBe(6);
    });

    it("should check if file exists", async () => {
      const exists = await opfs.fileExists("test.db3");
      expect(exists).toBe(false);
    });

    it("should return false when deleting a non-existent file", async () => {
      const deleted = await opfs.deleteFile("test.db3");
      expect(deleted).toBe(false);
    });

    it("should throw an error when exporting a non-existent file", async () => {
      await expect(opfs.exportDb("test.db3")).rejects.toThrow();
    });
  });

  describe.sequential("with a client database", () => {
    const dbPaths: string[] = [];

    it("should list files and get file count", async () => {
      const { signer } = createSigner();
      const dbPath = `./test-${uuid()}.db3`;
      dbPaths.push(dbPath);
      const client = await createRegisteredClient(signer, {
        dbPath,
      });
      client.close();
      const opfs = await Opfs.create();
      const files = await opfs.listFiles();
      const fileCount = await opfs.fileCount();
      opfs.close();
      expect(files).toHaveLength(1);
      expect(files[0]).toBe(dbPath);
      expect(fileCount).toBe(1);
    });

    it("should check if file exists", async () => {
      const { signer } = createSigner();
      const dbPath = `./test-${uuid()}.db3`;
      dbPaths.push(dbPath);
      const client = await createRegisteredClient(signer, {
        dbPath,
      });
      client.close();
      const opfs = await Opfs.create();
      const exists = await opfs.fileExists(dbPath);
      opfs.close();
      expect(exists).toBe(true);
    });

    it("should delete an existing file", async () => {
      const opfs = await Opfs.create();
      const dbPath = dbPaths.pop() as string;
      expect(dbPaths).toHaveLength(1);
      const deleted = await opfs.deleteFile(dbPath);
      opfs.close();
      expect(deleted).toBe(true);
    });

    it("should export and import an existing database", async () => {
      const opfs = await Opfs.create();
      const dbPath = dbPaths.pop() as string;
      expect(dbPaths).toHaveLength(0);
      const exportedData = await opfs.exportDb(dbPath);
      expect(exportedData).toBeDefined();
      const newDbPath = `./test-${uuid()}.db3`;
      dbPaths.push(newDbPath);
      await opfs.importDb(newDbPath, exportedData);
      const files = await opfs.listFiles();
      expect(files).toHaveLength(2);
      expect(files).toContain(dbPath);
      expect(files).toContain(newDbPath);
      await opfs.deleteFile(dbPath);
      const exportedData2 = await opfs.exportDb(newDbPath);
      expect(exportedData2).toEqual(exportedData);
      opfs.close();
    });

    it("should throw an error when importing an invalid database", async () => {
      const opfs = await Opfs.create();
      const dbPath = `./test-${uuid()}.db3`;
      await expect(
        opfs.importDb(dbPath, new Uint8Array([1, 2, 3])),
      ).rejects.toThrow();
      opfs.close();
    });

    it("should clear all files", async () => {
      const { signer } = createSigner();
      const dbPath = `./test-${uuid()}.db3`;
      const existingDbPath = dbPaths.pop() as string;
      expect(dbPaths).toHaveLength(0);
      const client = await createRegisteredClient(signer, {
        dbPath,
      });
      client.close();
      const opfs = await Opfs.create();
      const files = await opfs.listFiles();
      expect(files).toHaveLength(2);
      expect(files).toContain(existingDbPath);
      expect(files).toContain(dbPath);
      await opfs.clearAll();
      const files2 = await opfs.listFiles();
      expect(files2).toHaveLength(0);
      opfs.close();
    });
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createRemoteAttachment,
  downloadRemoteAttachment,
  encryptAttachment,
} from "./AttachmentUtil.js";
import { makeAgent } from "./TestUtil.js";

describe("AttachmentUtil", () => {
  describe("Round-trip test", () => {
    const testUrl = "https://localhost/test_file";
    let mockFetch: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockFetch = vi.fn();
      global.fetch = mockFetch;
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("encrypts and decrypts a file", async () => {
      const fileContent = "Hello, World!";
      const fileName = "hello.txt";
      const mimeType = "text/plain";
      const unencryptedFile = new File([fileContent], fileName, {
        type: mimeType,
      });
      const arrayBuffer = await unencryptedFile.arrayBuffer();
      const attachment = new Uint8Array(arrayBuffer);

      const encryptedAttachment = await encryptAttachment({
        filename: unencryptedFile.name,
        data: attachment,
        mimeType: unencryptedFile.type,
      });

      // Mock fetch to return the encrypted payload
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () =>
          Promise.resolve(encryptedAttachment.content.payload.buffer),
      });

      const remoteAttachment = createRemoteAttachment(
        encryptedAttachment,
        testUrl,
      );

      expect(remoteAttachment).not.toBeUndefined();
      expect(remoteAttachment.url).toBe(testUrl);
      expect(remoteAttachment.filename).toBe(fileName);

      // Create agent with the mock client
      const { agent } = makeAgent();

      const receivedAttachment = await downloadRemoteAttachment(
        remoteAttachment,
        agent,
      );

      // Verify fetch was called with the correct URL
      expect(mockFetch).toHaveBeenCalledWith(testUrl);

      // Verify the decrypted attachment matches the original
      expect(receivedAttachment.filename).toBe(fileName);
      expect(receivedAttachment.mimeType).toBe(mimeType);
      expect(receivedAttachment.data).toEqual(attachment);

      // Verify the content matches
      const decryptedContent = new TextDecoder().decode(
        receivedAttachment.data,
      );
      expect(decryptedContent).toBe(fileContent);
    });
  });
});

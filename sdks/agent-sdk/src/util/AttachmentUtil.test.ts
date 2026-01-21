import { encryptAttachment } from "@xmtp/node-sdk";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";
import {
  createRemoteAttachment,
  createRemoteAttachmentFromFile,
  downloadRemoteAttachment,
} from "@/util/AttachmentUtil";

describe("AttachmentUtil", () => {
  const testUrl = "https://localhost/test_file";
  let mockFetch: Mock;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createRemoteAttachmentFromFile", () => {
    it("creates a remote attachment", async () => {
      const fileContent = "createRemoteAttachmentFromFile";
      const fileName = "hello.txt";
      const mimeType = "text/plain";
      const unencryptedFile = new File([fileContent], fileName, {
        type: mimeType,
      });
      const uploadCallback = () => {
        return Promise.resolve(testUrl);
      };
      const remoteAttachment = await createRemoteAttachmentFromFile(
        unencryptedFile,
        uploadCallback,
      );
      expect(remoteAttachment.url).toBe(testUrl);
      expect(remoteAttachment.filename).toBe(fileName);
    });
  });

  describe("Round-trip test", () => {
    it("encrypts and decrypts a file", async () => {
      const fileContent = "Hello, World!";
      const fileName = "hello.txt";
      const mimeType = "text/plain";
      const unencryptedFile = new File([fileContent], fileName, {
        type: mimeType,
      });
      const arrayBuffer = await unencryptedFile.arrayBuffer();
      const attachment = new Uint8Array(arrayBuffer);

      const encryptedAttachment = encryptAttachment({
        filename: unencryptedFile.name,
        content: attachment,
        mimeType: unencryptedFile.type,
      });

      // Mock fetch to return the encrypted payload
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () =>
          Promise.resolve(encryptedAttachment.payload.buffer),
      });

      const remoteAttachment = createRemoteAttachment(
        encryptedAttachment,
        testUrl,
      );

      expect(remoteAttachment.url).toBe(testUrl);
      expect(remoteAttachment.filename).toBe(fileName);

      const receivedAttachment =
        await downloadRemoteAttachment(remoteAttachment);

      // Verify fetch was called with the correct URL
      expect(mockFetch).toHaveBeenCalledWith(testUrl);

      // Verify the decrypted attachment matches the original
      expect(receivedAttachment.filename).toBe(fileName);
      expect(receivedAttachment.mimeType).toBe(mimeType);
      expect(receivedAttachment.content).toEqual(attachment);

      // Verify the content matches
      const decryptedContent = new TextDecoder().decode(
        receivedAttachment.content,
      );
      expect(decryptedContent).toBe(fileContent);
    });
  });
});

import { expect, test } from "vitest";
import {
  RemoteAttachmentCodec,
  type RemoteAttachment,
} from "./RemoteAttachment";

const createRemoteAttachment = (url: string): RemoteAttachment => ({
  url,
  contentDigest: "00".repeat(32),
  salt: new Uint8Array(32),
  nonce: new Uint8Array(12),
  secret: new Uint8Array(32),
  scheme: "https",
  contentLength: 0,
  filename: "test.txt",
});

test.each([
  "http://attachments.example/test.txt",
  "httpsnot://attachments.example/test.txt",
  "httpswhatever",
  "https://",
])("rejects a URL without a valid HTTPS protocol: %s", (url) => {
  const codec = new RemoteAttachmentCodec();

  expect(() => codec.encode(createRemoteAttachment(url))).toThrow(
    "scheme must be https",
  );
});

test.each([
  "https://attachments.example/test.txt",
  "HTTPS://attachments.example/test.txt",
])("accepts a valid HTTPS URL: %s", (url) => {
  const codec = new RemoteAttachmentCodec();

  expect(() => codec.encode(createRemoteAttachment(url))).not.toThrow();
});

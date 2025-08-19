import { ContentTypeId } from "@xmtp/content-type-primitives";
import {
  ContentTypeReaction,
  type Reaction,
} from "@xmtp/content-type-reaction";
import { ContentTypeReply, type Reply } from "@xmtp/content-type-reply";
import { ContentTypeText } from "@xmtp/content-type-text";
import { describe, expect, it } from "vitest";
import { stringify } from "./messages";

describe("stringify", () => {
  it("returns plain text for ContentTypeText", async () => {
    const content = "Hello, World!";
    expect(
      stringify({
        content,
        contentType: ContentTypeText,
      }),
    ).toBe(content);
  });

  it("returns plain text for ContentTypeReply", async () => {
    const content: Reply = {
      reference: "id",
      referenceInboxId: "inbox",
      content: "hi",
      contentType: ContentTypeText,
    };
    expect(
      stringify({
        content,
        contentType: ContentTypeReply,
      }),
    ).toBe("hi");
  });

  it("returns plain text for ContentTypeReaction", async () => {
    const content: Reaction = {
      action: "added",
      reference: "id",
      referenceInboxId: "inbox",
      content: "👍",
      schema: "unicode",
    };
    expect(
      stringify({
        content,
        contentType: ContentTypeReaction,
      }),
    ).toBe("👍");
  });

  it("falls back to fallback string when content type is unknown", () => {
    const content = {};
    expect(
      stringify({
        content,
        contentType: new ContentTypeId({
          authorityId: "com.test",
          typeId: "abc",
          versionMajor: 3,
          versionMinor: 0,
        }),
        fallback: "test",
      }),
    ).toBe("test");
  });
});

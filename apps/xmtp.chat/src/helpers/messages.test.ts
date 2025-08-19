import { ContentTypeId } from "@xmtp/content-type-primitives";
import {
  ContentTypeReaction,
  type Reaction,
} from "@xmtp/content-type-reaction";
import { ContentTypeReply, type Reply } from "@xmtp/content-type-reply";
import { ContentTypeText } from "@xmtp/content-type-text";
import { describe, expect, it } from "vitest";
import { stringify } from "./messages";

const wrapInReply = (content: Reply | string, depth = 1): Reply => {
  if (depth < 1) throw new Error("Depth must be at least 1.");
  let current: Reply | string = content;
  for (let i = 0; i < depth; i++) {
    const wrapped: Reply = {
      reference: "id",
      referenceInboxId: "inbox",
      content: current,
      contentType:
        typeof current === "string" ? ContentTypeText : ContentTypeReply,
    };
    current = wrapped;
  }
  return current as Reply;
};

describe("stringify", () => {
  it("returns plain text for ContentTypeText", () => {
    const content = "Hello, World!";
    expect(
      stringify({
        content,
        contentType: ContentTypeText,
      }),
    ).toBe(content);
  });

  it("returns plain text for ContentTypeReply", () => {
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

  it("returns fallback text for a wrapped reply", () => {
    const content: Reply = {
      reference: "id",
      referenceInboxId: "inbox",
      content: "hi",
      contentType: ContentTypeText,
    };

    const wrappedReply = wrapInReply(content, 5);
    const fallback = "Not a direct reply text";

    expect(
      stringify({
        content: wrappedReply,
        contentType: ContentTypeReply,
        fallback,
      }),
    ).toBe(fallback);
  });

  it("returns plain text for ContentTypeReaction", () => {
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

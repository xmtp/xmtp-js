import { describe, expect, it } from "vitest";
import { ContentTypeMarkdown, Encoding, MarkdownCodec } from "./Markdown";

describe("ContentTypeMarkdown", () => {
  it("can encode/decode markdown", () => {
    const markdown = "*italic*";
    const codec = new MarkdownCodec();
    const ec = codec.encode(markdown);
    expect(ec.type.sameAs(ContentTypeMarkdown)).toBe(true);
    expect(ec.parameters.encoding).toEqual(Encoding.utf8);
    const markdown2 = codec.decode(ec);
    expect(markdown2).toEqual(markdown);
  });

  it("defaults to utf-8", () => {
    const markdown = "**bold**";
    const codec = new MarkdownCodec();
    const ec = codec.encode(markdown);
    expect(ec.type.sameAs(ContentTypeMarkdown)).toBe(true);
    expect(ec.parameters.encoding).toEqual(Encoding.utf8);
    const markdown2 = codec.decode(ec);
    expect(markdown2).toEqual(markdown);
  });

  it("throws on invalid input", () => {
    const codec = new MarkdownCodec();
    const ec = {
      type: ContentTypeMarkdown,
      parameters: {
        encoding: Encoding.utf8,
      },
      content: {} as Uint8Array,
    };
    expect(() => codec.decode(ec)).toThrow();
  });

  it("throws on unknown encoding", () => {
    const codec = new MarkdownCodec();
    const ec = {
      type: ContentTypeMarkdown,
      parameters: { encoding: "UTF-16" } as unknown as { encoding: Encoding },
      content: new Uint8Array(0),
    };
    expect(() => codec.decode(ec)).toThrow("unrecognized encoding UTF-16");
  });
});

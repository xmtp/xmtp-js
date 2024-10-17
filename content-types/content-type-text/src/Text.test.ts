import { describe, expect, it } from "vitest";
import { ContentTypeText, Encoding, TextCodec } from "./Text";

describe("ContentTypeText", () => {
  it("can encode/decode text", () => {
    const text = "Hey";
    const codec = new TextCodec();
    const ec = codec.encode(text);
    expect(ec.type.sameAs(ContentTypeText)).toBe(true);
    expect(ec.parameters.encoding).toEqual(Encoding.utf8);
    const text2 = codec.decode(ec);
    expect(text2).toEqual(text);
  });

  it("defaults to utf-8", () => {
    const text = "Hey";
    const codec = new TextCodec();
    const ec = codec.encode(text);
    expect(ec.type.sameAs(ContentTypeText)).toBe(true);
    expect(ec.parameters.encoding).toEqual(Encoding.utf8);
    const text2 = codec.decode(ec);
    expect(text2).toEqual(text);
  });

  it("throws on invalid input", () => {
    const codec = new TextCodec();
    const ec = {
      type: ContentTypeText,
      parameters: {
        encoding: Encoding.utf8,
      },
      content: {} as Uint8Array,
    };
    expect(() => codec.decode(ec)).toThrow();
  });

  it("throws on unknown encoding", () => {
    const codec = new TextCodec();
    const ec = {
      type: ContentTypeText,
      parameters: { encoding: "UTF-16" } as unknown as { encoding: Encoding },
      content: new Uint8Array(0),
    };
    expect(() => codec.decode(ec)).toThrow("unrecognized encoding UTF-16");
  });
});

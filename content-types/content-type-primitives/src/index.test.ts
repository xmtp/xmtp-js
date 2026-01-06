import { describe, expect, it } from "vitest";
import {
  contentTypeFromString,
  contentTypesAreEqual,
  contentTypeToString,
  type ContentTypeId,
} from ".";

describe("contentTypesAreEqual", () => {
  it("returns true if the content type IDs are equal", () => {
    const contentType1: ContentTypeId = {
      authorityId: "foo",
      typeId: "bar",
      versionMajor: 1,
      versionMinor: 0,
    };
    const contentType2: ContentTypeId = {
      authorityId: "foo",
      typeId: "bar",
      versionMajor: 1,
      versionMinor: 0,
    };
    expect(contentTypesAreEqual(contentType1, contentType2)).toBe(true);
  });

  it("returns false if the content type IDs are not equal", () => {
    const contentType1: ContentTypeId = {
      authorityId: "foo",
      typeId: "bar",
      versionMajor: 1,
      versionMinor: 0,
    };
    const contentType2: ContentTypeId = {
      authorityId: "foo",
      typeId: "baz",
      versionMajor: 1,
      versionMinor: 0,
    };
    expect(contentTypesAreEqual(contentType1, contentType2)).toBe(false);
  });
});

describe("contentTypeToString", () => {
  it("returns the string representation of the content type", () => {
    const contentType: ContentTypeId = {
      authorityId: "foo",
      typeId: "bar",
      versionMajor: 1,
      versionMinor: 0,
    };
    expect(contentTypeToString(contentType)).toBe("foo/bar:1.0");
  });
});

describe("contentTypeFromString", () => {
  it("returns the content type ID from the string", () => {
    const contentType: ContentTypeId = {
      authorityId: "foo",
      typeId: "bar",
      versionMajor: 1,
      versionMinor: 0,
    };
    expect(contentTypeFromString("foo/bar:1.0")).toEqual(contentType);
  });

  it("parses content types with dots in authorityId", () => {
    const contentType: ContentTypeId = {
      authorityId: "xmtp.org",
      typeId: "text",
      versionMajor: 1,
      versionMinor: 0,
    };
    expect(contentTypeFromString("xmtp.org/text:1.0")).toEqual(contentType);
  });

  it("throws an error for missing version", () => {
    expect(() => contentTypeFromString("foo/bar")).toThrow(
      'Invalid content type string: "foo/bar"',
    );
  });

  it("throws an error for missing typeId", () => {
    expect(() => contentTypeFromString("foo:1.0")).toThrow(
      'Invalid content type string: "foo:1.0"',
    );
  });

  it("throws an error for non-numeric version", () => {
    expect(() => contentTypeFromString("foo/bar:a.b")).toThrow(
      'Invalid content type string: "foo/bar:a.b"',
    );
  });

  it("throws an error for empty string", () => {
    expect(() => contentTypeFromString("")).toThrow(
      'Invalid content type string: ""',
    );
  });
});

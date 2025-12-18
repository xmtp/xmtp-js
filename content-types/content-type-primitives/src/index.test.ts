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
});

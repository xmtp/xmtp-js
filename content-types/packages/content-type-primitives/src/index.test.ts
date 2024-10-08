import { describe, expect, it } from "vitest";
import { ContentTypeId } from ".";

describe("ContentTypeId", () => {
  it("creates a new content type", () => {
    const contentType = new ContentTypeId({
      authorityId: "foo",
      typeId: "bar",
      versionMajor: 1,
      versionMinor: 0,
    });
    expect(contentType.authorityId).toEqual("foo");
    expect(contentType.typeId).toEqual("bar");
    expect(contentType.versionMajor).toEqual(1);
    expect(contentType.versionMinor).toEqual(0);
  });

  it("creates a string from a content type", () => {
    const contentType = new ContentTypeId({
      authorityId: "foo",
      typeId: "bar",
      versionMajor: 1,
      versionMinor: 0,
    });
    expect(contentType.toString()).toEqual("foo/bar:1.0");
  });

  it("creates a content type from a string", () => {
    const contentType = ContentTypeId.fromString("foo/bar:1.0");
    expect(contentType.authorityId).toEqual("foo");
    expect(contentType.typeId).toEqual("bar");
    expect(contentType.versionMajor).toEqual(1);
    expect(contentType.versionMinor).toEqual(0);
  });

  it("compares two content types", () => {
    const contentType1 = new ContentTypeId({
      authorityId: "foo",
      typeId: "bar",
      versionMajor: 1,
      versionMinor: 0,
    });
    const contentType2 = new ContentTypeId({
      authorityId: "baz",
      typeId: "qux",
      versionMajor: 1,
      versionMinor: 0,
    });
    expect(contentType1.sameAs(contentType2)).toBe(false);
    expect(contentType1.sameAs(contentType1)).toBe(true);
  });
});

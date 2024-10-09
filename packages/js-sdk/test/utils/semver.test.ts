import { isSameMajorVersion, semverGreaterThan } from "@/utils/semver";

describe("semver", () => {
  describe("isSameMajorVersion", () => {
    it("can parse major versions correctly", () => {
      expect(isSameMajorVersion("1.0.0", "1.1.0")).toBe(true);
      expect(isSameMajorVersion("1.0.0", "2.0.0")).toBe(false);
      expect(isSameMajorVersion("1.1.0-beta.1", "1.1.0")).toBe(true);
      expect(isSameMajorVersion("2.0.0", "1.5.0")).toBe(false);
    });

    it("handles undefined versions", () => {
      expect(isSameMajorVersion(undefined, "1.0.0")).toBe(true);
      expect(isSameMajorVersion("1.0.0", undefined)).toBe(true);
      expect(isSameMajorVersion(undefined, undefined)).toBe(true);
    });
  });

  describe("semverGreaterThan", () => {
    it("can compare major and minor versions", () => {
      expect(semverGreaterThan("1.0.0", "1.1.0")).toBe(false);
      expect(semverGreaterThan("1.0.0", "2.0.0")).toBe(false);
      expect(semverGreaterThan("1.10.0", "1.2.0")).toBe(true);
      expect(semverGreaterThan("2.0.0", "1.0.0")).toBe(true);
      expect(semverGreaterThan("10.0.0", "2.0.0")).toBe(true);
    });

    it("can compare patch versions", () => {
      expect(semverGreaterThan("1.0.0", "1.0.1")).toBe(false);
      expect(semverGreaterThan("1.0.5", "1.0.1")).toBe(true);
      expect(semverGreaterThan("1.0.0", "1.0.0-beta.1")).toBe(false);
      expect(semverGreaterThan("1.0.0-beta.1", "1.0.0")).toBe(false);
      expect(semverGreaterThan("1.1.1-beta.2", "1.1.1-beta.1")).toBe(true);
      expect(semverGreaterThan("1.1.1-beta.1", "1.1.1-beta.1")).toBe(false);
      // Handles versions > 10
      expect(semverGreaterThan("1.1.1-beta.10", "1.1.1-beta.2")).toBe(true);
    });
  });
});

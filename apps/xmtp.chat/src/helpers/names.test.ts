import { describe, expect, it, vi } from "vitest";
import { isValidName, normalizeName } from "./names";

vi.mock("@xmtp/browser-sdk", () => ({
  Utils: {},
}));

vi.mock("@/helpers/queries", () => ({
  queryClient: {},
}));

vi.mock("@/stores/profiles", () => ({
  profilesStore: {},
}));

describe("isValidName", () => {
  it("accepts valid ETH names", () => {
    expect(isValidName("example.eth")).toBe(true);
    expect(isValidName("my-name.eth")).toBe(true);
  });

  it("accepts valid Base names", () => {
    expect(isValidName("example.base.eth")).toBe(true);
    expect(isValidName("my-name.base.eth")).toBe(true);
  });

  it("accepts names with underscore prefix", () => {
    expect(isValidName("_example.eth")).toBe(true);
    expect(isValidName("_test.base.eth")).toBe(true);
  });

  it("accepts numbers and hyphens in names", () => {
    expect(isValidName("test-123-abc.eth")).toBe(true);
    expect(isValidName("abc123xyz.base.eth")).toBe(true);
  });

  it("accepts case-insensitive names", () => {
    expect(isValidName("eXaMPle.EtH")).toBe(true);
    expect(isValidName("Example.Eth")).toBe(true);
    expect(isValidName("example.BaSE.eth")).toBe(true);
    expect(isValidName("test.BasE.Eth")).toBe(true);
  });

  it("rejects names without ETH or Base extension", () => {
    expect(isValidName("example")).toBe(false);
    expect(isValidName("example.com")).toBe(false);
    expect(isValidName("test.ens")).toBe(false);
  });

  it("rejects spaces", () => {
    expect(isValidName("")).toBe(false);
    expect(isValidName("test name.eth")).toBe(false);
    expect(isValidName(" test.eth")).toBe(false);
    expect(isValidName("test.eth ")).toBe(false);
  });

  it("rejects names with special characters", () => {
    expect(isValidName("test@example.eth")).toBe(false);
    expect(isValidName("test$name.eth")).toBe(false);
    expect(isValidName("test.name.eth"), "dots in the name part").toBe(false);
    expect(isValidName("test_name.eth"), "underscore not at start").toBe(false);
  });
});

describe("normalizeName", () => {
  it("converts names to lowercase", () => {
    expect(normalizeName("TEST.BASE.ETH")).toBe("test.base.eth");
    expect(normalizeName(" example.eth")).toBe("example.eth");
    expect(normalizeName("example.eth ")).toBe("example.eth");
    expect(normalizeName("  example.eth  ")).toBe("example.eth");
    expect(normalizeName("_test.eth")).toBe("_test.eth");
    expect(normalizeName("my-name.eth")).toBe("my-name.eth");
    expect(normalizeName("TeSt.BaSE.ETh")).toBe("test.base.eth");
  });

  it("removes all whitespace from names", () => {
    expect(normalizeName("my name.eth")).toBe("myname.eth");
    expect(normalizeName(" myname.eth ")).toBe("myname.eth");
    expect(normalizeName("The General Store.eth")).toBe("thegeneralstore.eth");
  });
});

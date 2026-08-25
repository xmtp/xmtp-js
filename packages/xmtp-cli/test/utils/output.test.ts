import { describe, expect, it } from "vitest";
import { formatHuman } from "../../src/utils/output.js";

describe("formatHuman", () => {
  it("includes columns that only appear in later rows", () => {
    const output = formatHuman([
      {
        id: "dm-1",
        peerInboxId: "peer-1",
      },
      {
        id: "group-1",
        name: "Test Group",
        description: "Group description",
      },
    ]);

    expect(output).toContain("id");
    expect(output).toContain("peerInboxId");
    expect(output).toContain("name");
    expect(output).toContain("description");
    expect(output).toContain("Test Group");
    expect(output).toContain("Group description");
  });
});

import { describe, expect, it } from "vitest";
import {
  ContentTypeGroupUpdated,
  GroupUpdatedCodec,
  type GroupUpdated,
} from "./GroupUpdated";

describe("ContentTypeGroupUpdated", () => {
  it("can encode/decode group updated data", () => {
    const groupUpdated: GroupUpdated = {
      initiatedByInboxId: "inbox-id",
      addedInboxes: [],
      removedInboxes: [],
      metadataFieldChanges: [],
    };
    const codec = new GroupUpdatedCodec();
    const ec = codec.encode(groupUpdated);
    expect(ec.type.sameAs(ContentTypeGroupUpdated)).toBe(true);
    const groupUpdated2 = codec.decode(ec);
    expect(groupUpdated2).toEqual(groupUpdated);
  });
});

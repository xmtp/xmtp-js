import type { GroupMember } from "@xmtp/browser-sdk";
import { afterEach, describe, expect, it } from "vitest";
import { getDmConversationName } from "@/stores/inbox/store";
import { profilesStore } from "@/stores/profiles";

const createMember = (address: string): GroupMember =>
  ({
    accountIdentifiers: [
      {
        identifier: address,
        identifierKind: "Ethereum",
      },
    ],
    inboxId: "peer-inbox-id",
  }) as unknown as GroupMember;

describe("getDmConversationName", () => {
  afterEach(() => {
    profilesStore.getState().reset();
  });

  it("uses the member wallet address when no display name is available", () => {
    const address = "0x1234567890123456789012345678901234567890";

    expect(getDmConversationName(createMember(address))).toBe(address);
  });

  it("uses the profile display name when one is available", () => {
    const address = "0x1234567890123456789012345678901234567890";
    profilesStore.getState().addProfile({
      address,
      avatar: null,
      description: null,
      displayName: "vitalik.eth",
      identity: "vitalik.eth",
      platform: "ens",
    });

    expect(getDmConversationName(createMember(address))).toBe("vitalik.eth");
  });
});

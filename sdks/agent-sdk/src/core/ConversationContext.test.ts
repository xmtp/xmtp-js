import { Dm, Group, IdentifierKind, type Client } from "@xmtp/node-sdk";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConversationContext } from "./ConversationContext.js";

describe("ConversationContext", () => {
  let mockClient: Client;
  let mockGroup: Group;
  let context: ConversationContext<unknown, Group>;

  beforeEach(() => {
    mockClient = {
      inboxId: "test-inbox-id",
    } as unknown as Client;

    // Mock Group instance
    mockGroup = Object.create(Group.prototype);
    mockGroup.addMembersByIdentifiers = vi.fn().mockResolvedValue(undefined);

    context = new ConversationContext({
      conversation: mockGroup,
      client: mockClient,
    });
  });

  describe("addMembersWithAddresses", () => {
    it("should add members to a group conversation using Ethereum addresses", async () => {
      const addresses = [
        "0x1234567890123456789012345678901234567890" as `0x${string}`,
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as `0x${string}`,
      ];
      const addMembersSpy = vi.spyOn(mockGroup, "addMembersByIdentifiers");

      await context.addMembersWithAddresses(addresses);

      expect(addMembersSpy).toHaveBeenCalledWith([
        {
          identifier: addresses[0],
          identifierKind: IdentifierKind.Ethereum,
        },
        {
          identifier: addresses[1],
          identifierKind: IdentifierKind.Ethereum,
        },
      ]);
    });

    it("should throw an error when called on a non-group conversation", async () => {
      // Mock Dm instance
      const mockDm = Object.create(Dm.prototype);

      const dmContext = new ConversationContext({
        conversation: mockDm,
        client: mockClient,
      });

      const addresses = [
        "0x1234567890123456789012345678901234567890" as `0x${string}`,
      ];

      await expect(
        dmContext.addMembersWithAddresses(addresses),
      ).rejects.toThrow("Can only add members to group conversations");
    });

    it("should handle empty address array", async () => {
      const addMembersSpy = vi.spyOn(mockGroup, "addMembersByIdentifiers");
      await context.addMembersWithAddresses([]);

      expect(addMembersSpy).toHaveBeenCalledWith([]);
    });
  });
});

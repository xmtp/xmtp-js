import { Group, Stack, Text } from "@mantine/core";
import { Dm } from "@xmtp/browser-sdk";
import type { GroupUpdated } from "@xmtp/content-type-group-updated";
import { useMemo } from "react";
import { DateLabel } from "@/components/DateLabel";
import { Identity } from "@/components/Identity";
import { IdentityBadge } from "@/components/IdentityBadge";
import { useConversationContext } from "@/contexts/ConversationContext";
import { nsToDate } from "@/helpers/date";
import { MEMBER_NO_LONGER_IN_GROUP, shortAddress } from "@/helpers/strings";
import { getMemberAddress } from "@/helpers/xmtp";
import { useConversation } from "@/hooks/useConversation";
import { combineProfiles, useAllProfiles } from "@/stores/profiles";

type GroupMembersAddedContentProps = {
  type: "added" | "removed";
  updatedMembers: string[];
  initiatedBy: string;
};

const GroupMembersUpdatedContent: React.FC<GroupMembersAddedContentProps> = ({
  type,
  updatedMembers,
  initiatedBy,
}) => {
  const { conversationId } = useConversationContext();
  const { members, conversation } = useConversation(conversationId);
  const profiles = useAllProfiles();
  const initiatedByMember = members.get(initiatedBy);
  return (
    <Group gap="4" wrap="wrap" justify="center">
      {initiatedByMember ? (
        <Identity
          {...combineProfiles(
            getMemberAddress(initiatedByMember),
            profiles.get(getMemberAddress(initiatedByMember)) ?? [],
          )}
          permissionLevel={initiatedByMember.permissionLevel}
          conversationId={conversationId}
          inboxId={initiatedBy}
          showDm={!(conversation instanceof Dm)}
          position="top"
        />
      ) : (
        <IdentityBadge
          address=""
          displayName={shortAddress(initiatedBy)}
          tooltip={MEMBER_NO_LONGER_IN_GROUP}
        />
      )}
      <Text size="sm">{type === "added" ? "added" : "removed"}</Text>
      {updatedMembers.map((member) => {
        const memberMember = members.get(member);
        if (!memberMember) {
          return (
            <IdentityBadge
              key={member}
              address=""
              displayName={shortAddress(member)}
              tooltip={MEMBER_NO_LONGER_IN_GROUP}
            />
          );
        }
        const address = getMemberAddress(memberMember);
        const profile = combineProfiles(address, profiles.get(address) ?? []);
        return (
          <Identity
            key={member}
            address={address}
            avatar={profile.avatar}
            description={profile.description}
            displayName={profile.displayName}
            conversationId={conversationId}
            permissionLevel={memberMember.permissionLevel}
            inboxId={member}
            showDm={!(conversation instanceof Dm)}
            position="top"
          />
        );
      })}
      <Text size="sm">{type === "added" ? "to" : "from"} the group</Text>
    </Group>
  );
};

type GroupMetadataUpdatedContentProps = {
  metadataFieldChange: GroupUpdated["metadataFieldChanges"][number];
  initiatedBy: string;
};

const GroupMetadataUpdatedContent: React.FC<
  GroupMetadataUpdatedContentProps
> = ({ metadataFieldChange, initiatedBy }) => {
  const { conversationId } = useConversationContext();
  const { members, conversation } = useConversation(conversationId);
  const profiles = useAllProfiles();
  const initiatedByMember = members.get(initiatedBy);
  const field = useMemo(() => {
    switch (metadataFieldChange.fieldName) {
      case "group_name":
        return "name";
      case "description":
        return "description";
      case "group_image_url_square":
        return "image URL";
      case "_commit_log_signer":
        return "commit log signer";
      default:
        return metadataFieldChange.fieldName;
    }
  }, [metadataFieldChange.fieldName]);

  return (
    <Group gap="4" wrap="wrap" justify="center">
      {initiatedByMember ? (
        <Identity
          {...combineProfiles(
            getMemberAddress(initiatedByMember),
            profiles.get(getMemberAddress(initiatedByMember)) ?? [],
          )}
          permissionLevel={initiatedByMember.permissionLevel}
          conversationId={conversationId}
          inboxId={initiatedBy}
          showDm={!(conversation instanceof Dm)}
          position="top"
        />
      ) : (
        <IdentityBadge
          address=""
          displayName={shortAddress(initiatedBy)}
          tooltip={MEMBER_NO_LONGER_IN_GROUP}
        />
      )}
      <Text size="sm">
        {metadataFieldChange.newValue ? "changed" : "removed"} the group
      </Text>
      <Text size="sm">{field}</Text>
      {metadataFieldChange.newValue !== "" && (
        <>
          <Text size="sm">to</Text>
          <Text size="sm" fw={700} truncate>
            {metadataFieldChange.newValue}
          </Text>
        </>
      )}
    </Group>
  );
};

export type GroupUpdatedContentProps = {
  content: GroupUpdated;
  sentAtNs: bigint;
};

export const GroupUpdatedContent: React.FC<GroupUpdatedContentProps> = ({
  content,
  sentAtNs,
}) => {
  if (content.addedInboxes.length > 0) {
    return (
      <Stack gap="xxxs" align="center">
        <DateLabel date={nsToDate(sentAtNs)} align="center" padding="sm" />
        <GroupMembersUpdatedContent
          type="added"
          updatedMembers={content.addedInboxes.map((inbox) => inbox.inboxId)}
          initiatedBy={content.initiatedByInboxId}
        />
      </Stack>
    );
  }

  if (content.removedInboxes.length > 0) {
    return (
      <Stack gap="xxxs" align="center">
        <DateLabel date={nsToDate(sentAtNs)} align="center" padding="sm" />
        <GroupMembersUpdatedContent
          type="removed"
          updatedMembers={content.removedInboxes.map((inbox) => inbox.inboxId)}
          initiatedBy={content.initiatedByInboxId}
        />
      </Stack>
    );
  }

  if (content.metadataFieldChanges.length > 0) {
    return (
      <Stack gap="xxxs" align="center">
        <DateLabel date={nsToDate(sentAtNs)} align="center" padding="sm" />
        {content.metadataFieldChanges.map((change) => (
          <GroupMetadataUpdatedContent
            key={change.fieldName}
            metadataFieldChange={change}
            initiatedBy={content.initiatedByInboxId}
          />
        ))}
      </Stack>
    );
  }

  return (
    <Stack gap="xxxs" align="center">
      <DateLabel date={nsToDate(sentAtNs)} align="center" padding="sm" />
      <Text>Unknown permissions update</Text>
    </Stack>
  );
};

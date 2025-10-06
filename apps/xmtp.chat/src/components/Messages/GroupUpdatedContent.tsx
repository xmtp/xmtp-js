import { Group, Text } from "@mantine/core";
import type { GroupUpdated } from "@xmtp/content-type-group-updated";
import { useMemo } from "react";
import { DateLabel } from "@/components/DateLabel";
import { Identity } from "@/components/Identity";
import { useConversationContext } from "@/contexts/ConversationContext";
import { nsToDate } from "@/helpers/date";
import { getMemberAddress } from "@/helpers/xmtp";
import { useConversation } from "@/hooks/useConversation";

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
  const { members } = useConversation(conversationId);
  const initiatedByMember = members.get(initiatedBy);
  return (
    <Group gap="4" wrap="wrap" justify="center">
      <Identity
        address={initiatedByMember ? getMemberAddress(initiatedByMember) : ""}
        inboxId={initiatedBy}
      />
      <Text size="sm">{type === "added" ? "added" : "removed"}</Text>
      {updatedMembers.map((member) => {
        const memberMember = members.get(member);
        return (
          <Identity
            key={member}
            address={memberMember ? getMemberAddress(memberMember) : ""}
            inboxId={member}
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
  const { members } = useConversation(conversationId);
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
      <Identity
        address={initiatedByMember ? getMemberAddress(initiatedByMember) : ""}
        inboxId={initiatedBy}
      />
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
      <>
        <DateLabel date={nsToDate(sentAtNs)} align="center" padding="sm" />
        <GroupMembersUpdatedContent
          type="added"
          updatedMembers={content.addedInboxes.map((inbox) => inbox.inboxId)}
          initiatedBy={content.initiatedByInboxId}
        />
      </>
    );
  }

  if (content.removedInboxes.length > 0) {
    return (
      <>
        <DateLabel date={nsToDate(sentAtNs)} align="center" padding="sm" />
        <GroupMembersUpdatedContent
          type="removed"
          updatedMembers={content.removedInboxes.map((inbox) => inbox.inboxId)}
          initiatedBy={content.initiatedByInboxId}
        />
      </>
    );
  }

  if (content.metadataFieldChanges.length > 0) {
    return (
      <>
        <DateLabel date={nsToDate(sentAtNs)} align="center" padding="sm" />
        {content.metadataFieldChanges.map((change) => (
          <GroupMetadataUpdatedContent
            key={change.fieldName}
            metadataFieldChange={change}
            initiatedBy={content.initiatedByInboxId}
          />
        ))}
      </>
    );
  }

  return null;
};

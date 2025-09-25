import { Group, Text } from "@mantine/core";
import type { GroupUpdated } from "@xmtp/content-type-group-updated";
import { useMemo } from "react";
import { DateLabel } from "@/components/DateLabel";
import { Identity } from "@/components/Identity";
import { useConversationContext } from "@/contexts/ConversationContext";
import { nsToDate } from "@/helpers/date";

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
  const { members } = useConversationContext();
  return (
    <Group gap="4" wrap="wrap" justify="center">
      <Identity
        address={members.get(initiatedBy) ?? ""}
        inboxId={initiatedBy}
      />
      <Text size="sm">{type === "added" ? "added" : "removed"}</Text>
      {updatedMembers.map((member) => (
        <Identity
          key={member}
          address={members.get(member) ?? ""}
          inboxId={member}
        />
      ))}
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
  const { members } = useConversationContext();
  const field = useMemo(() => {
    switch (metadataFieldChange.fieldName) {
      case "group_name":
        return "name";
      case "description":
        return "description";
      case "group_image_url_square":
        return "image URL";
    }
  }, [metadataFieldChange.fieldName]);

  return (
    <Group gap="4" wrap="wrap" justify="center">
      <Identity
        address={members.get(initiatedBy) ?? ""}
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

import { Group, Text } from "@mantine/core";
import type { GroupUpdated } from "@xmtp/content-type-group-updated";
import { useMemo } from "react";
import { AddressBadge } from "@/components/AddressBadge";
import { DateLabel } from "@/components/DateLabel";
import { nsToDate } from "@/helpers/date";

type GroupMembersAddedContentProps = {
  type: "added" | "removed";
  members: string[];
  initiatedBy: string;
};

const GroupMembersUpdatedContent: React.FC<GroupMembersAddedContentProps> = ({
  type,
  members,
  initiatedBy,
}) => {
  return (
    <Group gap="4" wrap="wrap" justify="center">
      <AddressBadge address={initiatedBy} size="lg" />
      <Text size="sm">{type === "added" ? "added" : "removed"}</Text>
      {members.map((member) => (
        <AddressBadge key={member} address={member} size="lg" />
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
      <AddressBadge address={initiatedBy} />
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
          members={content.addedInboxes.map((inbox) => inbox.inboxId)}
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
          members={content.removedInboxes.map((inbox) => inbox.inboxId)}
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

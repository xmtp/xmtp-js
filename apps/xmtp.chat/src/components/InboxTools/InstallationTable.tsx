import { Checkbox, Table, Text, Tooltip, useMatches } from "@mantine/core";
import type { SafeInstallation } from "@xmtp/browser-sdk";
import { formatDistanceToNow } from "date-fns";
import { BadgeWithCopy } from "@/components/BadgeWithCopy";
import { nsToDate } from "@/helpers/date";

type InstallationTableRowProps = {
  installation: SafeInstallation;
  selectedInstallationIds: string[];
  setSelectedInstallationIds: React.Dispatch<React.SetStateAction<string[]>>;
};

const InstallationTableRow: React.FC<InstallationTableRowProps> = ({
  installation,
  selectedInstallationIds,
  setSelectedInstallationIds,
}) => {
  const maw = useMatches({
    base: "6rem",
    sm: "10rem",
  });

  const createdAt = nsToDate(installation.clientTimestampNs ?? 0n);
  const checked = selectedInstallationIds.includes(installation.id);

  return (
    <Table.Tr>
      <Table.Td maw="2rem">
        <Checkbox
          checked={checked}
          onChange={(event) => {
            if (event.currentTarget.checked) {
              setSelectedInstallationIds([
                ...selectedInstallationIds,
                installation.id,
              ]);
            } else {
              setSelectedInstallationIds(
                selectedInstallationIds.filter((id) => id !== installation.id),
              );
            }
          }}
        />
      </Table.Td>
      <Table.Td>
        <BadgeWithCopy value={installation.id} />
      </Table.Td>
      <Table.Td maw={maw}>
        <Tooltip label={createdAt.toISOString()}>
          <Text size="sm" style={{ whiteSpace: "nowrap" }}>
            {formatDistanceToNow(createdAt, {
              addSuffix: true,
            })}
          </Text>
        </Tooltip>
      </Table.Td>
    </Table.Tr>
  );
};

type InstallationTableProps = {
  installations: SafeInstallation[];
  selectedInstallationIds: string[];
  setSelectedInstallationIds: React.Dispatch<React.SetStateAction<string[]>>;
};

export const InstallationTable: React.FC<InstallationTableProps> = ({
  installations,
  selectedInstallationIds,
  setSelectedInstallationIds,
}) => {
  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th></Table.Th>
          <Table.Th>Installation ID</Table.Th>
          <Table.Th>Created</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {installations.map((installation) => (
          <InstallationTableRow
            key={installation.id}
            installation={installation}
            selectedInstallationIds={selectedInstallationIds}
            setSelectedInstallationIds={setSelectedInstallationIds}
          />
        ))}
      </Table.Tbody>
    </Table>
  );
};

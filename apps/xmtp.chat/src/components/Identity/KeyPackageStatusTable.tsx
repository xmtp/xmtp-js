import { Table, Text, Tooltip, useMatches } from "@mantine/core";
import type { SafeKeyPackageStatus } from "@xmtp/browser-sdk";
import { formatDistanceToNow } from "date-fns";
import { BadgeWithCopy } from "@/components/BadgeWithCopy";

type KeyPackageStatusTableRowProps = {
  keyPackageStatus: [string, SafeKeyPackageStatus];
};

const KeyPackageStatusTableRow: React.FC<KeyPackageStatusTableRowProps> = ({
  keyPackageStatus,
}) => {
  const maw = useMatches({
    base: "12rem",
    sm: "20rem",
  });

  const notAfter = new Date(
    Number(keyPackageStatus[1].lifetime?.notAfter ?? 0n) * 1000,
  );

  return (
    <Table.Tr>
      <Table.Td maw={maw}>
        <BadgeWithCopy value={keyPackageStatus[0]} />
      </Table.Td>
      <Table.Td>
        <Tooltip label={notAfter.toISOString()}>
          <Text style={{ whiteSpace: "nowrap" }}>
            {formatDistanceToNow(notAfter, {
              addSuffix: true,
            })}
          </Text>
        </Tooltip>
      </Table.Td>
      <Table.Td>
        {keyPackageStatus[1].validationError ? (
          <BadgeWithCopy value={keyPackageStatus[1].validationError} />
        ) : (
          "None"
        )}
      </Table.Td>
    </Table.Tr>
  );
};

type KeyPackageStatusTableProps = {
  keyPackageStatuses: [string, SafeKeyPackageStatus][];
};

export const KeyPackageStatusTable: React.FC<KeyPackageStatusTableProps> = ({
  keyPackageStatuses,
}) => {
  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Installation ID</Table.Th>
          <Table.Th>Expires</Table.Th>
          <Table.Th>Error</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {keyPackageStatuses.map((keyPackageStatus) => (
          <KeyPackageStatusTableRow
            key={keyPackageStatus[0]}
            keyPackageStatus={keyPackageStatus}
          />
        ))}
      </Table.Tbody>
    </Table>
  );
};

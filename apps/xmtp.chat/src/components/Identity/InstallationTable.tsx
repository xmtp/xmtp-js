import { Button, Table, Text, useMatches } from "@mantine/core";
import type { SafeInstallation } from "@xmtp/browser-sdk";
import { formatDistanceToNow } from "date-fns";
import { BadgeWithCopy } from "@/components/BadgeWithCopy";
import { nsToDate } from "@/helpers/date";
import { useIdentity } from "@/hooks/useIdentity";

type InstallationTableRowProps = {
  installation: SafeInstallation;
  refreshInstallations: () => Promise<void>;
  setRevokeInstallationError: React.Dispatch<
    React.SetStateAction<string | null>
  >;
};

const InstallationTableRow: React.FC<InstallationTableRowProps> = ({
  installation,
  refreshInstallations,
  setRevokeInstallationError,
}) => {
  const { revokeInstallation, revoking } = useIdentity();

  const handleRevokeInstallation = async (installationIdBytes: Uint8Array) => {
    try {
      await revokeInstallation(installationIdBytes);
      await refreshInstallations();
    } catch (error) {
      setRevokeInstallationError((error as Error).message || "Unknown error");
    }
  };

  const maw = useMatches({
    base: "12rem",
    sm: "20rem",
  });

  return (
    <Table.Tr>
      <Table.Td maw={maw}>
        <BadgeWithCopy value={installation.id} />
      </Table.Td>
      <Table.Td>
        <Text style={{ whiteSpace: "nowrap" }}>
          {formatDistanceToNow(nsToDate(installation.clientTimestampNs ?? 0n), {
            addSuffix: true,
          })}
        </Text>
      </Table.Td>
      <Table.Td w="100">
        <Button
          size="xs"
          loading={revoking}
          onClick={() => void handleRevokeInstallation(installation.bytes)}>
          Revoke
        </Button>
      </Table.Td>
    </Table.Tr>
  );
};

type InstallationTableProps = {
  installations: SafeInstallation[];
  refreshInstallations: () => Promise<void>;
  setRevokeInstallationError: React.Dispatch<
    React.SetStateAction<string | null>
  >;
};

export const InstallationTable: React.FC<InstallationTableProps> = ({
  installations,
  refreshInstallations,
  setRevokeInstallationError,
}) => {
  return (
    <Table striped>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Installation ID</Table.Th>
          <Table.Th>Created</Table.Th>
          <Table.Th></Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {installations.map((installation) => (
          <InstallationTableRow
            key={installation.id}
            installation={installation}
            refreshInstallations={refreshInstallations}
            setRevokeInstallationError={setRevokeInstallationError}
          />
        ))}
      </Table.Tbody>
    </Table>
  );
};

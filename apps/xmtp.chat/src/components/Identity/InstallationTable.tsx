import {
  Box,
  Button,
  Popover,
  Table,
  Text,
  Tooltip,
  useMatches,
} from "@mantine/core";
import { formatDistanceToNow } from "date-fns";
import { BadgeWithCopy } from "@/components/BadgeWithCopy";
import { CodeWithCopy } from "@/components/CodeWithCopy";
import { nsToDate } from "@/helpers/date";
import { useIdentity, type Installation } from "@/hooks/useIdentity";

type InstallationTableRowProps = {
  clientInstallationId: string;
  installation: Installation;
  refreshInstallations: () => Promise<void>;
};

const InstallationTableRow: React.FC<InstallationTableRowProps> = ({
  clientInstallationId,
  installation,
  refreshInstallations,
}) => {
  const { revokeInstallation, revoking } = useIdentity();

  const handleRevokeInstallation = async (installationIdBytes: Uint8Array) => {
    await revokeInstallation(installationIdBytes);
    await refreshInstallations();
  };

  const maw = useMatches({
    base: "12rem",
    sm: "20rem",
  });

  const createdAt = nsToDate(installation.clientTimestampNs ?? 0n);
  const notAfter = installation.keyPackageStatus?.lifetime?.notAfter
    ? new Date(Number(installation.keyPackageStatus.lifetime.notAfter) * 1000)
    : undefined;

  return (
    <Table.Tr>
      <Table.Td maw={maw}>
        <BadgeWithCopy value={installation.id} />
      </Table.Td>
      <Table.Td>
        <Tooltip label={createdAt.toISOString()}>
          <Text size="sm" style={{ whiteSpace: "nowrap" }}>
            {formatDistanceToNow(createdAt, {
              addSuffix: true,
            })}
          </Text>
        </Tooltip>
      </Table.Td>
      <Table.Td>
        {notAfter ? (
          <Tooltip label={notAfter.toISOString()}>
            <Text size="sm" style={{ whiteSpace: "nowrap" }}>
              {formatDistanceToNow(notAfter, {
                addSuffix: true,
              })}
            </Text>
          </Tooltip>
        ) : (
          <Text size="sm">Error</Text>
        )}
      </Table.Td>
      <Table.Td w="100">
        {installation.keyPackageStatus?.validationError ? (
          <Popover width={200} position="bottom" withArrow shadow="md">
            <Popover.Target>
              <Button color="red" size="xs">
                Details
              </Button>
            </Popover.Target>
            <Popover.Dropdown>
              <Box maw="300">
                <CodeWithCopy
                  code={installation.keyPackageStatus.validationError}
                />
              </Box>
            </Popover.Dropdown>
          </Popover>
        ) : (
          <Text size="sm">None</Text>
        )}
      </Table.Td>
      <Table.Td w="100">
        {installation.id !== clientInstallationId && (
          <Button
            size="xs"
            loading={revoking}
            onClick={() => void handleRevokeInstallation(installation.bytes)}>
            Revoke
          </Button>
        )}
      </Table.Td>
    </Table.Tr>
  );
};

type InstallationTableProps = {
  clientInstallationId: string;
  installations: Installation[];
  refreshInstallations: () => Promise<void>;
};

export const InstallationTable: React.FC<InstallationTableProps> = ({
  clientInstallationId,
  installations,
  refreshInstallations,
}) => {
  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Installation ID</Table.Th>
          <Table.Th>Created</Table.Th>
          <Table.Th>Expires</Table.Th>
          <Table.Th>Error</Table.Th>
          <Table.Th></Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {installations.map((installation) => (
          <InstallationTableRow
            key={installation.id}
            clientInstallationId={clientInstallationId}
            installation={installation}
            refreshInstallations={refreshInstallations}
          />
        ))}
      </Table.Tbody>
    </Table>
  );
};

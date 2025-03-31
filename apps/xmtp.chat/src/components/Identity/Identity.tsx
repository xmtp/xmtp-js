import { Button, Group, Modal, Paper, Stack, Text, Title } from "@mantine/core";
import type { Client } from "@xmtp/browser-sdk";
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import { BadgeWithCopy } from "@/components/BadgeWithCopy";
import { useIdentity } from "@/hooks/useIdentity";
import { ContentLayout } from "@/layouts/ContentLayout";
import { InstallationTable } from "./InstallationTable";

export const Identity: React.FC = () => {
  const navigate = useNavigate();
  const client = useOutletContext<Client>();
  const {
    installations,
    revokeAllOtherInstallations,
    revoking,
    sync,
    syncing,
  } = useIdentity(true);

  const [revokeInstallationError, setRevokeInstallationError] = useState<
    string | null
  >(null);

  // Add state for account identifier
  const [accountIdentifier, setAccountIdentifier] = useState<string | null>(
    null,
  );
  const [isLoadingIdentifier, setIsLoadingIdentifier] = useState(false);

  // Fetch account identifier when client is available
  useEffect(() => {
    const fetchAccountIdentifier = async () => {
      setIsLoadingIdentifier(true);
      try {
        const identifier = await client.accountIdentifier();
        setAccountIdentifier(identifier.identifier.toLowerCase());
      } catch (error) {
        console.error("Failed to fetch account identifier:", error);
      } finally {
        setIsLoadingIdentifier(false);
      }
    };

    void fetchAccountIdentifier();
  }, []);

  const handleRevokeAllOtherInstallations = async () => {
    try {
      await revokeAllOtherInstallations();
      await sync();
    } catch (error) {
      setRevokeInstallationError((error as Error).message || "Unknown error");
    }
  };

  return (
    <>
      {revokeInstallationError && (
        <Modal
          opened={!!revokeInstallationError}
          onClose={() => {
            setRevokeInstallationError(null);
          }}
          withCloseButton={false}
          centered>
          <Stack gap="md">
            <Title order={4}>Revoke installation error</Title>
            <Text>{revokeInstallationError}</Text>
            <Group justify="flex-end">
              <Button
                onClick={() => {
                  setRevokeInstallationError(null);
                }}>
                OK
              </Button>
            </Group>
          </Stack>
        </Modal>
      )}
      <ContentLayout
        title="Identity"
        loading={revoking || syncing}
        headerActions={
          <Button size="sm" variant="default" onClick={() => void navigate(-1)}>
            Back
          </Button>
        }>
        <Stack gap="lg" py="md">
          <Paper p="md" radius="md" withBorder>
            <Stack gap="md">
              <Group gap="md" wrap="nowrap">
                <Text flex="0 0 25%" style={{ whiteSpace: "nowrap" }}>
                  Address
                </Text>
                {isLoadingIdentifier ? (
                  <Text size="sm" c="dimmed">
                    Loading...
                  </Text>
                ) : (
                  <BadgeWithCopy value={accountIdentifier || ""} />
                )}
              </Group>
              <Group gap="md" wrap="nowrap">
                <Text flex="0 0 25%" style={{ whiteSpace: "nowrap" }}>
                  Inbox ID
                </Text>
                {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                <BadgeWithCopy value={client.inboxId!} />
              </Group>
              <Group gap="md" wrap="nowrap">
                <Text flex="0 0 25%" style={{ whiteSpace: "nowrap" }}>
                  Installation ID
                </Text>
                {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                <BadgeWithCopy value={client.installationId!} />
              </Group>
            </Stack>
          </Paper>
          <Title order={4}>Installations</Title>
          <Paper p="md" radius="md" withBorder>
            <Stack gap="md">
              {installations.length === 0 && (
                <Text>No other installations found</Text>
              )}
              {installations.length > 0 && (
                <>
                  <InstallationTable
                    installations={installations}
                    refreshInstallations={sync}
                    setRevokeInstallationError={setRevokeInstallationError}
                  />
                  <Group justify="flex-end">
                    <Button
                      variant="outline"
                      color="red"
                      onClick={() => void handleRevokeAllOtherInstallations()}>
                      Revoke all other installations
                    </Button>
                  </Group>
                </>
              )}
            </Stack>
          </Paper>
        </Stack>
      </ContentLayout>
    </>
  );
};

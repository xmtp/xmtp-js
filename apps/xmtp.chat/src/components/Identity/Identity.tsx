import {
  Button,
  FocusTrap,
  Group,
  LoadingOverlay,
  Modal,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { BadgeWithCopy } from "@/components/BadgeWithCopy";
import { useAppState } from "@/contexts/AppState";
import { useBodyClass } from "@/hooks/useBodyClass";
import { useClient } from "@/hooks/useClient";
import { useIdentity } from "@/hooks/useIdentity";
import { InstallationTable } from "./InstallationTable";

export const Identity: React.FC = () => {
  useBodyClass("main-flex-layout");
  const { setNavbar } = useAppState();
  const { client } = useClient();
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
  const [accountIdentifier, setAccountIdentifier] = useState<string | null>(null);
  const [isLoadingIdentifier, setIsLoadingIdentifier] = useState(false);

  useEffect(() => {
    setNavbar(true);
  }, []);

  // Fetch account identifier when client is available
  useEffect(() => {
    const fetchAccountIdentifier = async () => {
      if (!client) return;
      
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
  }, [client]);

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
      <FocusTrap>
        <Stack
          gap="lg"
          p="md"
          pos="relative"
          flex={1}
          style={{
            overflow: "hidden",
            margin: "calc(var(--mantine-spacing-md) * -1)",
          }}>
          <LoadingOverlay visible={revoking || syncing} />
          <Title order={3}>Identity</Title>
          <ScrollArea type="scroll" className="scrollfade">
            {client && (
              <Stack gap="lg" py="md">
                <Paper p="md" radius="md" withBorder>
                  <Stack gap="md">
                    <Group gap="md" wrap="nowrap">
                      <Text flex="0 0 25%" style={{ whiteSpace: "nowrap" }}>
                        Address
                      </Text>
                      {isLoadingIdentifier ? (
                        <Text size="sm" c="dimmed">Loading...</Text>
                      ) : (
                        <BadgeWithCopy value={accountIdentifier || ''} />
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
                          setRevokeInstallationError={
                            setRevokeInstallationError
                          }
                        />
                        <Group justify="flex-end">
                          <Button
                            variant="outline"
                            color="red"
                            onClick={() =>
                              void handleRevokeAllOtherInstallations()
                            }>
                            Revoke all other installations
                          </Button>
                        </Group>
                      </>
                    )}
                  </Stack>
                </Paper>
              </Stack>
            )}
          </ScrollArea>
        </Stack>
      </FocusTrap>
    </>
  );
};

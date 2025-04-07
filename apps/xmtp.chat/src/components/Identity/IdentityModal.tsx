import {
  Button,
  CloseButton,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import type { Client } from "@xmtp/browser-sdk";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import { BadgeWithCopy } from "@/components/BadgeWithCopy";
import { InstallationTable } from "@/components/Identity/InstallationTable";
import { useCollapsedMediaQuery } from "@/hooks/useCollapsedMediaQuery";
import { useIdentity } from "@/hooks/useIdentity";
import { ContentLayout } from "@/layouts/ContentLayout";

export const IdentityModal: React.FC = () => {
  const navigate = useNavigate();
  const { client } = useOutletContext<{ client: Client }>();
  const {
    installations,
    revokeAllOtherInstallations,
    revoking,
    sync,
    syncing,
  } = useIdentity(true);
  const [accountIdentifier, setAccountIdentifier] = useState<string | null>(
    null,
  );

  const fullScreen = useCollapsedMediaQuery();
  const contentHeight = fullScreen ? "auto" : 600;

  useEffect(() => {
    setAccountIdentifier(
      client.accountIdentifier?.identifier.toLowerCase() ?? null,
    );
  }, [client.accountIdentifier]);

  const handleRevokeAllOtherInstallations = useCallback(async () => {
    await revokeAllOtherInstallations();
    await sync();
  }, [revokeAllOtherInstallations, sync]);

  const handleClose = useCallback(() => {
    void navigate(-1);
  }, [navigate]);

  return (
    <>
      <Modal
        opened
        centered
        withCloseButton={false}
        fullScreen={fullScreen}
        onClose={handleClose}
        size="auto"
        padding={0}>
        <ContentLayout
          maxHeight={contentHeight}
          loading={revoking || syncing}
          withScrollAreaPadding={false}
          title={
            <Group justify="space-between" align="center" flex={1}>
              <Text size="lg" fw={700} c="text.primary">
                Identity
              </Text>
              <CloseButton size="md" onClick={handleClose} />
            </Group>
          }>
          <Stack gap="md" p="md">
            <Paper p="md" radius="md" withBorder>
              <Stack gap="md">
                <Group gap="md" wrap="nowrap">
                  <Text flex="0 0 25%" style={{ whiteSpace: "nowrap" }}>
                    Address
                  </Text>
                  <BadgeWithCopy value={accountIdentifier || ""} />
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
        </ContentLayout>
      </Modal>
    </>
  );
};

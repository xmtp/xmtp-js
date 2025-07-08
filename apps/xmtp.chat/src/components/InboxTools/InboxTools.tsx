import { Button, Group, Stack, Text, TextInput, Title } from "@mantine/core";
import { Client, type SafeInstallation, type Signer } from "@xmtp/browser-sdk";
import { useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router";
import { useAccount, useSignMessage } from "wagmi";
import { InstallationTable } from "@/components/InboxTools/InstallationTable";
import { Settings } from "@/components/InboxTools/Settings";
import { createEOASigner, createSCWSigner } from "@/helpers/createSigner";
import { isValidInboxId } from "@/helpers/strings";
import { useMemberId } from "@/hooks/useMemberId";
import { useSettings } from "@/hooks/useSettings";
import { ContentLayout } from "@/layouts/ContentLayout";

export const InboxTools: React.FC = () => {
  const account = useAccount();
  const { signMessageAsync } = useSignMessage();
  const {
    inboxId,
    memberId,
    setMemberId,
    error: memberIdError,
  } = useMemberId();
  const [installations, setInstallations] = useState<SafeInstallation[]>([]);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [selectedInstallationIds, setSelectedInstallationIds] = useState<
    string[]
  >([]);
  const [loading, setLoading] = useState(false);
  const { environment, useSCW } = useSettings();

  const handleFindInstallations = useCallback(async () => {
    if (!isValidInboxId(inboxId)) {
      return;
    }
    setLoading(true);
    try {
      const inboxState = await Client.inboxStateFromInboxIds(
        [inboxId],
        environment,
      );
      setInstallations(
        inboxState[0].installations.sort(
          (a, b) =>
            Number(b.clientTimestampNs ?? 0) - Number(a.clientTimestampNs ?? 0),
        ),
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [inboxId, environment]);

  const handleRevokeInstallations = useCallback(
    async (installationIds: Uint8Array[]) => {
      if (!signer) {
        return;
      }
      setLoading(true);
      try {
        await Client.revokeInstallations(
          signer,
          inboxId,
          installationIds,
          environment,
        );
      } finally {
        setLoading(false);
      }
      void handleFindInstallations();
    },
    [environment, inboxId, handleFindInstallations, signer],
  );

  useEffect(() => {
    if (!account.address || (useSCW && !account.chainId)) {
      return;
    }
    const signer = useSCW
      ? createSCWSigner(
          account.address,
          (message: string) => signMessageAsync({ message }),
          account.chainId,
        )
      : createEOASigner(account.address, (message: string) =>
          signMessageAsync({ message }),
        );
    setSigner(signer);
  }, [account.address, account.chainId, signMessageAsync, useSCW]);

  useEffect(() => {
    if (!isValidInboxId(inboxId)) {
      setInstallations([]);
      setSelectedInstallationIds([]);
    }
  }, [inboxId]);

  return (
    <>
      <ContentLayout
        loading={loading}
        title={
          <Group justify="space-between" align="center" flex={1}>
            <Text size="lg" fw={700} c="text.primary">
              Installation management
            </Text>
          </Group>
        }
        footer={
          <Group justify="flex-end" p="md" flex={1}>
            {!signer && (
              <Text size="sm" c="dimmed">
                Wallet connection required
              </Text>
            )}
            <Button
              disabled={!signer || selectedInstallationIds.length === 0}
              onClick={() => {
                const installationBytes = installations
                  .filter((installation) =>
                    selectedInstallationIds.includes(installation.id),
                  )
                  .map((installation) => installation.bytes);
                void handleRevokeInstallations(installationBytes);
              }}>
              Revoke installations
            </Button>
          </Group>
        }>
        <Stack gap="md" py="md">
          <Stack gap="xs">
            <Title order={4} ml="sm">
              Settings
            </Title>
            <Settings />
          </Stack>
          <Stack gap="xs" mt="md">
            <TextInput
              size="sm"
              label="Address or inbox ID"
              styles={{
                label: {
                  marginBottom: "var(--mantine-spacing-xxs)",
                },
              }}
              error={!!memberIdError}
              value={memberId}
              onChange={(event) => {
                setMemberId(event.target.value);
              }}
            />
            <Group justify="flex-end" align="center">
              <Text c="error" size="sm">
                {memberIdError}
              </Text>
              <Button
                disabled={!isValidInboxId(inboxId)}
                onClick={() => {
                  void handleFindInstallations();
                }}>
                Find installations
              </Button>
            </Group>
          </Stack>
          <Title order={4}>Installations</Title>
          <Stack gap="md">
            {installations.length === 0 && <Text>No installations found</Text>}
            {installations.length > 0 && (
              <InstallationTable
                installations={installations}
                selectedInstallationIds={selectedInstallationIds}
                setSelectedInstallationIds={setSelectedInstallationIds}
              />
            )}
          </Stack>
        </Stack>
      </ContentLayout>
      <Outlet />
    </>
  );
};

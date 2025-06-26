import {
  Button,
  CloseButton,
  Group,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { Client, type SafeInstallation, type Signer } from "@xmtp/browser-sdk";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAccount, useSignMessage } from "wagmi";
import { ConnectModal } from "@/components/App/ConnectModal";
import { InstallationTable } from "@/components/InboxTools/InstallationTable";
import { Modal } from "@/components/Modal";
import { createEOASigner, createSCWSigner } from "@/helpers/createSigner";
import { isValidInboxId } from "@/helpers/strings";
import { useCollapsedMediaQuery } from "@/hooks/useCollapsedMediaQuery";
import { useMemberId } from "@/hooks/useMemberId";
import { useSettings } from "@/hooks/useSettings";
import { ContentLayout } from "@/layouts/ContentLayout";

export const InboxToolsModal: React.FC = () => {
  const account = useAccount();
  const { signMessageAsync } = useSignMessage();
  const navigate = useNavigate();
  const {
    inboxId,
    memberId,
    setMemberId,
    error: memberIdError,
  } = useMemberId();
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [installations, setInstallations] = useState<SafeInstallation[]>([]);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [selectedInstallationIds, setSelectedInstallationIds] = useState<
    string[]
  >([]);
  const [loading, setLoading] = useState(false);
  const { environment, useSCW } = useSettings();

  const fullScreen = useCollapsedMediaQuery();
  const contentHeight = fullScreen ? "auto" : "70dvh";

  const handleRevokeInstallations = useCallback(
    async (installationIds: Uint8Array[]) => {
      if (!signer) {
        return;
      }
      setLoading(true);
      await Client.revokeInstallations(
        signer,
        inboxId,
        installationIds,
        environment,
      );
      setLoading(false);
    },
    [environment, inboxId],
  );

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
      setInstallations(inboxState[0].installations);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [inboxId, environment]);

  const handleClose = useCallback(() => {
    void navigate(-1);
  }, [navigate]);

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
  }, [account, signMessageAsync, useSCW]);

  useEffect(() => {
    if (signer) {
      setConnectModalOpen(false);
    }
  }, [signer]);

  useEffect(() => {
    if (!isValidInboxId(inboxId)) {
      setInstallations([]);
      setSelectedInstallationIds([]);
    }
  }, [inboxId]);

  return (
    <>
      <Modal
        opened
        centered
        withCloseButton={false}
        fullScreen={fullScreen}
        onClose={handleClose}
        size="lg"
        padding={0}>
        <ContentLayout
          maxHeight={contentHeight}
          loading={loading}
          withScrollAreaPadding={false}
          title={
            <Group justify="space-between" align="center" flex={1}>
              <Text size="lg" fw={700} c="text.primary">
                Inbox tools
              </Text>
              <CloseButton size="md" onClick={handleClose} />
            </Group>
          }>
          <Stack gap="md" p="md">
            <Stack gap="xs">
              <TextInput
                size="sm"
                label="Address or inbox ID"
                styles={{
                  label: {
                    marginBottom: "var(--mantine-spacing-xxs)",
                  },
                }}
                error={memberIdError}
                value={memberId}
                onChange={(event) => {
                  setMemberId(event.target.value);
                }}
              />
              <Group justify="flex-end">
                <Button
                  disabled={!isValidInboxId(inboxId)}
                  onClick={() => {
                    void handleFindInstallations();
                  }}>
                  Find installations
                </Button>
              </Group>
            </Stack>
            {installations.length > 0 && (
              <>
                <Title order={4}>Installations</Title>
                <Stack gap="md">
                  {installations.length === 0 && (
                    <Text>No installations found</Text>
                  )}
                  {installations.length > 0 && (
                    <InstallationTable
                      installations={installations}
                      selectedInstallationIds={selectedInstallationIds}
                      setSelectedInstallationIds={setSelectedInstallationIds}
                    />
                  )}
                </Stack>
                <Group justify="space-between">
                  <Button
                    onClick={() => {
                      setConnectModalOpen(true);
                    }}>
                    Connect
                  </Button>
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
              </>
            )}
          </Stack>
        </ContentLayout>
      </Modal>
      {connectModalOpen && <ConnectModal />}
    </>
  );
};

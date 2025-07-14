import {
  Button,
  Group,
  Stack,
  Stepper,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { Client, type SafeInstallation, type Signer } from "@xmtp/browser-sdk";
import { useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router";
import { useSignMessage } from "wagmi";
import { ConnectedAddress } from "@/components/App/ConnectedAddress";
import { WalletConnect } from "@/components/App/WalletConnect";
import { InstallationTable } from "@/components/InboxTools/InstallationTable";
import { NetworkSelect } from "@/components/InboxTools/NetworkSelect";
import { createEOASigner, createSCWSigner } from "@/helpers/createSigner";
import { isValidInboxId } from "@/helpers/strings";
import { useConnectWallet } from "@/hooks/useConnectWallet";
import { useEphemeralSigner } from "@/hooks/useEphemeralSigner";
import { useMemberId } from "@/hooks/useMemberId";
import { useSettings } from "@/hooks/useSettings";
import { ContentLayout } from "@/layouts/ContentLayout";

export const InboxTools: React.FC = () => {
  const {
    account,
    address,
    isConnected,
    disconnect,
    loading: walletLoading,
  } = useConnectWallet();
  const { address: ephemeralAddress, signer: ephemeralSigner } =
    useEphemeralSigner();
  const { signMessageAsync } = useSignMessage();
  const {
    inboxId,
    memberId,
    setMemberId,
    error: memberIdError,
  } = useMemberId();
  const [installations, setInstallations] = useState<SafeInstallation[]>([]);
  const [selectedInstallationIds, setSelectedInstallationIds] = useState<
    string[]
  >([]);
  const [loading, setLoading] = useState(false);
  const {
    environment,
    useSCW,
    ephemeralAccountEnabled,
    setEphemeralAccountEnabled,
  } = useSettings();
  const [active, setActive] = useState(0);

  const handleFindInstallations = useCallback(async () => {
    if (!isValidInboxId(inboxId)) {
      return;
    }
    setLoading(true);
    setInstallations([]);
    setSelectedInstallationIds([]);
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
      let signer: Signer;
      if (ephemeralAccountEnabled) {
        if (!ephemeralAddress) {
          console.error("Ephemeral wallet not connected");
          return;
        }
        signer = ephemeralSigner;
      } else {
        if (!address) {
          console.error("Wallet not connected");
          return;
        }
        if (useSCW && !account.chainId) {
          console.error("Smart contract wallet chain ID not set");
          return;
        }
        signer = useSCW
          ? createSCWSigner(
              address,
              (message: string) => signMessageAsync({ message }),
              account.chainId,
            )
          : createEOASigner(address, (message: string) =>
              signMessageAsync({ message }),
            );
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
    [
      environment,
      address,
      account.chainId,
      useSCW,
      signMessageAsync,
      inboxId,
      handleFindInstallations,
      ephemeralAccountEnabled,
      ephemeralAddress,
    ],
  );

  const handleDisconnectWallet = useCallback(() => {
    if (isConnected) {
      disconnect();
    } else {
      setEphemeralAccountEnabled(false);
    }
    setMemberId("");
    setInstallations([]);
    setSelectedInstallationIds([]);
  }, [
    isConnected,
    disconnect,
    setEphemeralAccountEnabled,
    setMemberId,
    setInstallations,
    setSelectedInstallationIds,
  ]);

  useEffect(() => {
    if (!isValidInboxId(inboxId)) {
      setInstallations([]);
      setSelectedInstallationIds([]);
    }
  }, [inboxId]);

  useEffect(() => {
    setInstallations([]);
    setSelectedInstallationIds([]);
  }, [environment]);

  useEffect(() => {
    if (isConnected || ephemeralAccountEnabled) {
      setActive(1);
    } else {
      setActive(0);
    }
  }, [isConnected, ephemeralAccountEnabled]);

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
            {!(address || ephemeralAddress) && (
              <Text size="sm" c="dimmed">
                Wallet connection required
              </Text>
            )}
            <Button
              disabled={selectedInstallationIds.length === 0}
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
        <Stepper active={active} onStepClick={setActive} mt="md">
          <Stepper.Step
            label="Connect your wallet"
            allowStepSelect={false}
            loading={walletLoading}>
            <WalletConnect />
          </Stepper.Step>
          <Stepper.Step label="Manage installations" allowStepSelect={false}>
            <Stack gap="md" py="md">
              <Group justify="space-between" align="center">
                <ConnectedAddress
                  size="sm"
                  address={address ?? ephemeralAddress}
                  onClick={handleDisconnectWallet}
                />
                <NetworkSelect />
              </Group>
              <Stack gap="xs" mb="md">
                <Group justify="space-between" align="center">
                  <Text size="sm" pl={4}>
                    Enter an address or inbox ID
                  </Text>
                  {memberIdError && (
                    <Text c="red.7" size="sm">
                      {memberIdError}
                    </Text>
                  )}
                </Group>
                <TextInput
                  size="sm"
                  error={!!memberIdError}
                  value={memberId}
                  onChange={(event) => {
                    setMemberId(event.target.value);
                  }}
                />
                <Group justify="space-between" align="center">
                  <Button
                    variant="default"
                    onClick={() => {
                      setMemberId(address ?? ephemeralAddress);
                    }}>
                    Use wallet address
                  </Button>
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
            </Stack>
          </Stepper.Step>
        </Stepper>
      </ContentLayout>
      <Outlet />
    </>
  );
};

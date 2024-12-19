import { Button, FocusTrap, Popover, Stack, Text, Title } from "@mantine/core";
import { useState } from "react";
import { shortAddress } from "../helpers/address";
import { useClient } from "../hooks/useClient";
import classes from "./AddressButton.module.css";
import { BadgeWithCopy } from "./BadgeWithCopy";

export type AddressButtonProps = {
  address: string;
  inboxId: string;
  installationId: string;
};

export const AddressButton: React.FC<AddressButtonProps> = ({
  address,
  inboxId,
  installationId,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { client } = useClient();
  const handleRevokeInstallations = async () => {
    setIsLoading(true);
    await client?.revokeInstallations();
    setIsLoading(false);
  };
  return (
    <Popover position="bottom" withArrow shadow="md">
      <Popover.Target>
        <Button
          variant="default"
          aria-label={address}
          className={classes.button}>
          {shortAddress(address)}
        </Button>
      </Popover.Target>
      <Popover.Dropdown>
        <FocusTrap>
          <Stack gap="xs" w={{ base: 360, md: 500 }} py="xs">
            <FocusTrap.InitialFocus />
            <Title order={3}>Identity</Title>
            <Stack gap="calc(var(--mantine-spacing-xs) / 2)">
              <Text size="sm">Address</Text>
              <BadgeWithCopy value={address} />
            </Stack>
            <Stack gap="calc(var(--mantine-spacing-xs) / 2)">
              <Text size="sm">Inbox ID</Text>
              <BadgeWithCopy value={inboxId} />
            </Stack>
            <Stack gap="calc(var(--mantine-spacing-xs) / 2)">
              <Text size="sm">Installation ID</Text>
              <BadgeWithCopy value={installationId} />
            </Stack>
            <Title order={3}>Actions</Title>
            <Stack gap="xs">
              <Button
                onClick={() => void handleRevokeInstallations()}
                loading={isLoading}>
                Revoke installations
              </Button>
            </Stack>
          </Stack>
        </FocusTrap>
      </Popover.Dropdown>
    </Popover>
  );
};

import { Badge, Box, Burger, Button, Flex, Group, Text } from "@mantine/core";
import type { Client } from "@xmtp/browser-sdk";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { AppMenu } from "@/components/App/AppMenu";
import type { ContentTypes } from "@/contexts/XMTPContext";
import { shortAddress } from "@/helpers/strings";
import { useSettings } from "@/hooks/useSettings";
import classes from "./AppHeader.module.css";

const GlowingCircle = () => {
  return (
    <Box
      w={6}
      h={6}
      bg="green.6"
      style={{
        borderRadius: "50%",
        boxShadow: "0px 0px 2px 2px var(--mantine-color-green-9)",
      }}
    />
  );
};

export type AppHeaderProps = {
  client: Client<ContentTypes>;
  opened?: boolean;
  toggle?: () => void;
};

export const AppHeader: React.FC<AppHeaderProps> = ({
  client,
  opened,
  toggle,
}) => {
  const navigate = useNavigate();
  const { environment } = useSettings();
  const [accountIdentifier, setAccountIdentifier] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setAccountIdentifier(
      client.accountIdentifier?.identifier.toLowerCase() ?? null,
    );
  }, [client.accountIdentifier]);

  const handleClick = () => {
    void navigate("identity");
  };

  return (
    <Flex align="center" justify="space-between">
      <Flex align="center" gap="md" className={classes.header}>
        <div className={classes.burger}>
          <Burger opened={opened} onClick={toggle} size="sm" />
        </div>
        <Flex align="center" flex={1}>
          <Button
            variant="default"
            aria-label={accountIdentifier || ""}
            className={classes.button}
            onClick={handleClick}>
            {accountIdentifier ? shortAddress(accountIdentifier) : "..."}
          </Button>
        </Flex>
      </Flex>
      <Group align="center" gap="xs">
        <Badge size="lg" radius="md" variant="default" p={0}>
          <Group align="center" gap="xs" px="sm">
            <GlowingCircle />
            <Text size="xs" fw={700}>
              {environment}
            </Text>
          </Group>
        </Badge>
        <AppMenu />
      </Group>
    </Flex>
  );
};

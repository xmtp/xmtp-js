import { Burger, Button, Flex, Skeleton } from "@mantine/core";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { shortAddress } from "@/helpers/address";
import { useClient } from "@/hooks/useClient";
import { Actions } from "./Actions";
import classes from "./AppHeader.module.css";
import { Connection } from "./Connection";

export type AppHeaderProps = {
  collapsed?: boolean;
  opened: boolean;
  toggle: () => void;
};

export const AppHeader: React.FC<AppHeaderProps> = ({
  collapsed,
  opened,
  toggle,
}) => {
  const { client } = useClient();
  const navigate = useNavigate();
  const [accountIdentifier, setAccountIdentifier] = useState<string | null>(
    null,
  );
  const [isLoadingIdentifier, setIsLoadingIdentifier] = useState(false);

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

  const handleClick = () => {
    void navigate("/identity");
  };

  return (
    <Flex align="center">
      <Flex align="center" gap="md" p="md" w={{ base: 300, lg: 420 }}>
        {!collapsed && (
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
        )}
        <Flex align="center" flex={1}>
          {client &&
            (isLoadingIdentifier ? (
              <Skeleton height={36} width={120} radius="sm" />
            ) : (
              <Button
                variant="default"
                aria-label={accountIdentifier || ""}
                className={classes.button}
                onClick={handleClick}>
                {accountIdentifier ? shortAddress(accountIdentifier) : "..."}
              </Button>
            ))}
        </Flex>
      </Flex>
      <Flex align="center" justify="space-between" gap="xs" p="md" flex={1}>
        <Actions />
        <Connection />
      </Flex>
    </Flex>
  );
};

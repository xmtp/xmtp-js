import { Burger, Button, Flex, Skeleton } from "@mantine/core";
import type { Client } from "@xmtp/browser-sdk";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { shortAddress } from "@/helpers/address";
import { Actions } from "./Actions";
import classes from "./AppHeader.module.css";

export type AppHeaderProps = {
  client: Client;
  opened?: boolean;
  toggle?: () => void;
};

export const AppHeader: React.FC<AppHeaderProps> = ({
  client,
  opened,
  toggle,
}) => {
  const navigate = useNavigate();
  const [accountIdentifier, setAccountIdentifier] = useState<string | null>(
    null,
  );
  const [isLoadingIdentifier, setIsLoadingIdentifier] = useState(false);

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
  }, [client]);

  const handleClick = () => {
    void navigate("/identity");
  };

  return (
    <Flex align="center" justify="space-between">
      <Flex align="center" gap="md" className={classes.header}>
        <div className={classes.burger}>
          <Burger opened={opened} onClick={toggle} size="sm" />
        </div>
        <Flex align="center" flex={1}>
          {isLoadingIdentifier ? (
            <Skeleton height={36} width={120} radius="sm" />
          ) : (
            <Button
              variant="default"
              aria-label={accountIdentifier || ""}
              className={classes.button}
              onClick={handleClick}>
              {accountIdentifier ? shortAddress(accountIdentifier) : "..."}
            </Button>
          )}
        </Flex>
      </Flex>
      <Actions />
    </Flex>
  );
};

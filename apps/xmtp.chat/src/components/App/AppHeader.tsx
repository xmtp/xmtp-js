import { Burger, Button, Flex } from "@mantine/core";
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
          {client && (
            <Button
              variant="default"
              aria-label={client.accountAddress}
              className={classes.button}
              onClick={handleClick}>
              {shortAddress(client.accountAddress)}
            </Button>
          )}
        </Flex>
      </Flex>
      <Flex align="center" justify="space-between" gap="xs" p="md" flex={1}>
        <Actions />
        <Connection />
      </Flex>
    </Flex>
  );
};

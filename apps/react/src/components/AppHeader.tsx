import { AppShell, Burger, Flex } from "@mantine/core";
import { Actions } from "./Actions";
import { Connection } from "./Connection";
import { User } from "./User";

export type AppHeaderProps = {
  opened: boolean;
  toggle: () => void;
};

export const AppHeader: React.FC<AppHeaderProps> = ({ opened, toggle }) => {
  return (
    <AppShell.Header>
      <Flex align="center">
        <Flex align="center" gap="md" p="md" w={{ base: 300, lg: 420 }}>
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Flex align="center" flex={1}>
            <User />
          </Flex>
        </Flex>
        <Flex align="center" justify="space-between" gap="xs" p="md" flex={1}>
          <Actions />
          <Connection />
        </Flex>
      </Flex>
    </AppShell.Header>
  );
};

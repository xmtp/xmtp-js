import {
  ActionIcon,
  Avatar,
  Group,
  Menu,
  Popover,
  Stack,
  Text,
  Textarea,
  type PopoverProps,
} from "@mantine/core";
import { useClipboard } from "@mantine/hooks";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import BreakableText from "@/components/Messages/BreakableText";
import { IconDots } from "@/icons/IconDots";
import classes from "./MemberPopover.module.css";

type MemberPopoverContextType = {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
};

const MemberPopoverContext = createContext<MemberPopoverContextType>({
  opened: false,
  setOpened: () => {},
});

const MemberPopoverProvider: React.FC<
  React.PropsWithChildren<MemberPopoverContextType>
> = ({ children, opened, setOpened }) => {
  const value = useMemo(() => ({ opened, setOpened }), [opened, setOpened]);
  return (
    <MemberPopoverContext.Provider value={value}>
      {children}
    </MemberPopoverContext.Provider>
  );
};

export const useMemberPopover = () => {
  const context = useContext(MemberPopoverContext);
  return context;
};

export type MemberPopoverProps = React.PropsWithChildren<{
  address: string;
  avatar: string | null;
  description: string | null;
  displayName: string | null;
  inboxId: string;
  position?: PopoverProps["position"];
  showDm?: boolean;
}>;

export const MemberPopover: React.FC<MemberPopoverProps> = ({
  address,
  avatar,
  children,
  description,
  displayName,
  inboxId,
  position,
  showDm = true,
}) => {
  const clipboard = useClipboard({ timeout: 1000 });
  const [message, setMessage] = useState("");
  const [opened, setOpened] = useState(false);
  const handleCopy = useCallback(
    (value: string) => {
      clipboard.copy(value);
    },
    [clipboard],
  );
  return (
    <MemberPopoverProvider opened={opened} setOpened={setOpened}>
      <Popover
        withArrow
        shadow="md"
        opened={opened}
        onChange={setOpened}
        position={position}>
        <Popover.Target>{children}</Popover.Target>
        <Popover.Dropdown>
          <Stack
            gap="sm"
            align="center"
            maw={300}
            miw={240}
            className={classes.profile}>
            <Menu shadow="md">
              <Menu.Target>
                <ActionIcon
                  variant="default"
                  className={classes.menu}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}>
                  <IconDots />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown miw={200}>
                <Menu.Item>Add to group</Menu.Item>
                <Menu.Item>Create group</Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(address);
                  }}>
                  Copy address
                </Menu.Item>
                <Menu.Item
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(inboxId);
                  }}>
                  Copy inbox ID
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item c="red">Remove from group</Menu.Item>
                <Menu.Item c="red">Block</Menu.Item>
              </Menu.Dropdown>
            </Menu>
            <Avatar src={avatar} size="xl" radius="100%" variant="default" />
            <Group w="100%" align="center" justify="center">
              <BreakableText>{displayName || address}</BreakableText>
            </Group>
            {description && <Text size="xs">{description}</Text>}
            {showDm && (
              <Textarea
                size="sm"
                autosize
                placeholder="Send a message..."
                onChange={(e) => {
                  setMessage(e.target.value);
                }}
                value={message}
                w="100%"
              />
            )}
          </Stack>
        </Popover.Dropdown>
      </Popover>
    </MemberPopoverProvider>
  );
};

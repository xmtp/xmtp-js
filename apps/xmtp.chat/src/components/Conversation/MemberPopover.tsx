import {
  ActionIcon,
  Avatar,
  Group,
  Menu,
  Popover,
  Stack,
  Text,
  Textarea,
  Tooltip,
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
import { shortAddress } from "@/helpers/strings";
import { useConversations } from "@/hooks/useConversations";
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
  onBlock?: () => void;
  onRemove?: () => void;
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
  onRemove,
  onBlock,
  position,
  showDm = true,
}) => {
  const { newDm, getDmByInboxId } = useConversations();
  const clipboard = useClipboard({ timeout: 1000 });
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [message, setMessage] = useState("");
  const [opened, setOpened] = useState(false);
  const handleCopy = useCallback(
    (value: string) => {
      clipboard.copy(value);
    },
    [clipboard],
  );
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        if (message.trim() !== "") {
          setSending(true);
          setSendError(false);
          getDmByInboxId(inboxId)
            .then((dm) => dm ?? newDm(inboxId))
            .then((dm) => dm.send(message))
            .then(() => {
              setMessage("");
            })
            .catch(() => {
              setSendError(true);
            })
            .finally(() => {
              setSending(false);
            });
        }
      }
    },
    [message, inboxId, getDmByInboxId, newDm],
  );
  return (
    <MemberPopoverProvider opened={opened} setOpened={setOpened}>
      <Popover
        withArrow
        shadow="md"
        opened={opened}
        trapFocus
        onChange={setOpened}
        position={position}>
        <Popover.Target>{children}</Popover.Target>
        <Popover.Dropdown>
          <Stack
            gap="sm"
            align="center"
            maw={300}
            miw={260}
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
                {(onRemove || onBlock) && <Menu.Divider />}
                {onRemove && (
                  <Menu.Item c="red" onClick={onRemove}>
                    Remove from group
                  </Menu.Item>
                )}
                {onBlock && (
                  <Menu.Item c="red" onClick={onBlock}>
                    Block
                  </Menu.Item>
                )}
              </Menu.Dropdown>
            </Menu>
            <Avatar src={avatar} size="xl" radius="100%" variant="default" />
            <Group w="100%" align="center" justify="center">
              {displayName ? (
                <BreakableText>{displayName}</BreakableText>
              ) : (
                <Tooltip label={<Text size="xs">{address}</Text>}>
                  <BreakableText>{shortAddress(address, 8)}</BreakableText>
                </Tooltip>
              )}
            </Group>
            {description && <Text size="xs">{description}</Text>}
            {showDm && (
              <Stack gap="0" w="100%">
                <Textarea
                  error={
                    sendError ? "Failed to send message, try again" : undefined
                  }
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                  maxRows={4}
                  size="sm"
                  autosize
                  placeholder="Send a message..."
                  onChange={(e) => {
                    setMessage(e.target.value);
                  }}
                  value={message}
                  w="100%"
                />
                {sending ? (
                  <Text size="xxs" p="xxxs" pb="0" c="dimmed">
                    Sending message...
                  </Text>
                ) : (
                  <Text size="xxs" p="xxxs" pb="0" c="dimmed">
                    <Text fw={700} span>
                      Shift + Enter
                    </Text>{" "}
                    for new line,{" "}
                    <Text fw={700} span>
                      Enter
                    </Text>{" "}
                    to send
                  </Text>
                )}
              </Stack>
            )}
          </Stack>
        </Popover.Dropdown>
      </Popover>
    </MemberPopoverProvider>
  );
};

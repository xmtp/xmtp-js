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
import { PermissionLevel, Group as XmtpGroup } from "@xmtp/browser-sdk";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import BreakableText from "@/components/Messages/BreakableText";
import { useClient } from "@/contexts/XMTPContext";
import { shortAddress } from "@/helpers/strings";
import { useClientPermissions } from "@/hooks/useClientPermissions";
import { useConversation } from "@/hooks/useConversation";
import { useConversations } from "@/hooks/useConversations";
import { IconDots } from "@/icons/IconDots";
import { useActions } from "@/stores/inbox/hooks";
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
  conversationId: string;
  description: string | null;
  displayName: string | null;
  inboxId: string;
  permissionLevel: PermissionLevel;
  position?: PopoverProps["position"];
  showDm?: boolean;
}>;

export const MemberPopover: React.FC<MemberPopoverProps> = ({
  address,
  avatar,
  children,
  conversationId,
  description,
  displayName,
  inboxId,
  permissionLevel,
  position,
  showDm = true,
}) => {
  const client = useClient();
  const { createDm, getDmByInboxId } = useConversations();
  const { conversation, members } = useConversation(conversationId);
  const clientPermissions = useClientPermissions(conversationId);
  const { syncMembers } = useActions();
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
            .then((dm) => dm ?? createDm(inboxId))
            .then((dm) => dm.sendText(message))
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
    [message, inboxId, getDmByInboxId, createDm],
  );

  const handlePermissionLevelChange = useCallback(
    async (inboxId: string, permissionLevel: PermissionLevel) => {
      const member = members.get(inboxId);
      if (!member || !(conversation instanceof XmtpGroup)) {
        return;
      }
      if (member.permissionLevel === permissionLevel) {
        return;
      }

      switch (member.permissionLevel) {
        case PermissionLevel.SuperAdmin: {
          await conversation.removeSuperAdmin(inboxId);
          switch (permissionLevel) {
            case PermissionLevel.Admin:
              await conversation.addAdmin(inboxId);
              break;
          }
          break;
        }
        case PermissionLevel.Admin: {
          await conversation.removeAdmin(inboxId);
          switch (permissionLevel) {
            case PermissionLevel.SuperAdmin:
              await conversation.addSuperAdmin(inboxId);
              break;
          }
          break;
        }
        case PermissionLevel.Member: {
          switch (permissionLevel) {
            case PermissionLevel.SuperAdmin:
              await conversation.addSuperAdmin(inboxId);
              break;
            case PermissionLevel.Admin:
              await conversation.addAdmin(inboxId);
              break;
          }
          break;
        }
      }
      await syncMembers(conversationId);
    },
    [conversation, conversationId, syncMembers],
  );

  const handleRemoveMember = useCallback(
    async (inboxId: string) => {
      if (!(conversation instanceof XmtpGroup)) {
        return;
      }
      await conversation.removeMembers([inboxId]);
      await syncMembers(conversationId);
    },
    [conversation, conversationId, syncMembers],
  );

  const canManageMember = useMemo(() => {
    return (
      (clientPermissions.canPromoteMembers &&
        (permissionLevel === PermissionLevel.Admin ||
          permissionLevel === PermissionLevel.Member)) ||
      (clientPermissions.canDemoteMembers &&
        (permissionLevel === PermissionLevel.SuperAdmin ||
          permissionLevel === PermissionLevel.Admin)) ||
      (clientPermissions.canRemoveMembers && client.inboxId !== inboxId)
    );
  }, [clientPermissions, permissionLevel]);
  const canPromoteToSuperAdmin = useMemo(() => {
    return (
      clientPermissions.canPromoteMembers &&
      (permissionLevel === PermissionLevel.Admin ||
        permissionLevel === PermissionLevel.Member) &&
      client.inboxId !== inboxId
    );
  }, [
    clientPermissions.canPromoteMembers,
    permissionLevel,
    client.inboxId,
    inboxId,
  ]);
  const canPromoteToAdmin = useMemo(() => {
    return (
      clientPermissions.canPromoteMembers &&
      permissionLevel === PermissionLevel.Member &&
      client.inboxId !== inboxId
    );
  }, [
    clientPermissions.canPromoteMembers,
    permissionLevel,
    client.inboxId,
    inboxId,
  ]);
  const canDemoteToAdmin = useMemo(() => {
    return (
      clientPermissions.canDemoteMembers &&
      permissionLevel === PermissionLevel.SuperAdmin &&
      client.inboxId !== inboxId
    );
  }, [
    clientPermissions.canDemoteMembers,
    permissionLevel,
    client.inboxId,
    inboxId,
  ]);
  const canDemoteToMember = useMemo(() => {
    return (
      clientPermissions.canDemoteMembers &&
      (permissionLevel === PermissionLevel.SuperAdmin ||
        permissionLevel === PermissionLevel.Admin) &&
      client.inboxId !== inboxId
    );
  }, [
    clientPermissions.canDemoteMembers,
    permissionLevel,
    client.inboxId,
    inboxId,
  ]);
  const canRemoveMember = useMemo(() => {
    return clientPermissions.canRemoveMembers && client.inboxId !== inboxId;
  }, [clientPermissions.canRemoveMembers, client.inboxId, inboxId]);

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
        <Popover.Dropdown
          onClick={(e) => {
            e.stopPropagation();
          }}>
          <Stack
            gap="sm"
            align="center"
            maw={300}
            miw={260}
            className={classes.profile}>
            <Menu shadow="md" withArrow>
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
              <Menu.Dropdown>
                {canPromoteToSuperAdmin && (
                  <Menu.Item
                    onClick={(e) => {
                      e.stopPropagation();
                      void handlePermissionLevelChange(
                        inboxId,
                        PermissionLevel.SuperAdmin,
                      );
                    }}>
                    Promote to super admin
                  </Menu.Item>
                )}
                {canPromoteToAdmin && (
                  <Menu.Item
                    onClick={(e) => {
                      e.stopPropagation();
                      void handlePermissionLevelChange(
                        inboxId,
                        PermissionLevel.Admin,
                      );
                    }}>
                    Promote to admin
                  </Menu.Item>
                )}
                {canDemoteToAdmin && (
                  <Menu.Item
                    c="red"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handlePermissionLevelChange(
                        inboxId,
                        PermissionLevel.Admin,
                      );
                    }}>
                    Demote to admin
                  </Menu.Item>
                )}
                {canDemoteToMember && (
                  <Menu.Item
                    c="red"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handlePermissionLevelChange(
                        inboxId,
                        PermissionLevel.Member,
                      );
                    }}>
                    Demote to member
                  </Menu.Item>
                )}
                {canManageMember && <Menu.Divider />}
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
                {canRemoveMember && <Menu.Divider />}
                {canRemoveMember && (
                  <Menu.Item
                    c="red"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleRemoveMember(inboxId);
                    }}>
                    Remove from group
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

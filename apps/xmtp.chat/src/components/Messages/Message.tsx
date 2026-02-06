import { Badge, Box, Button, Group, Text } from "@mantine/core";
import {
  ReactionAction,
  ReactionSchema,
  type DecodedMessage,
} from "@xmtp/browser-sdk";
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useConversationContext } from "@/contexts/ConversationContext";
import { useClient } from "@/contexts/XMTPContext";
import { isActionable } from "@/helpers/messages";
import { useConversation } from "@/hooks/useConversation";
import { useSettings } from "@/hooks/useSettings";
import classes from "./Message.module.css";
import { MessageContentWithWrapper } from "./MessageContentWithWrapper";
import { ReactionPopover } from "./ReactionPopover";

type Reaction = {
  count: number;
  didAdd: boolean;
};

export type MessageProps = {
  message: DecodedMessage;
  scrollToMessage: (id: string) => void;
};

export const Message: React.FC<MessageProps> = ({
  message,
  scrollToMessage,
}) => {
  const navigate = useNavigate();
  const { environment } = useSettings();
  const { setReplyTarget, conversationId } = useConversationContext();
  const { conversation } = useConversation(conversationId);
  const client = useClient();

  const isSender = client.inboxId === message.senderInboxId;
  const align = isSender ? "right" : "left";
  const hasActions = isActionable(message);

  const handleReaction = useCallback(
    (content: string, action: ReactionAction) => () => {
      void conversation.sendReaction({
        action,
        reference: message.id,
        referenceInboxId: message.senderInboxId,
        schema: ReactionSchema.Unicode,
        content,
      });
    },
    [conversation, message.id, message.senderInboxId],
  );

  const reactions = useMemo(() => {
    return message.reactions
      .filter((r) => r.content?.schema === ReactionSchema.Unicode)
      .reduce<Record<string, Reaction>>((acc, r) => {
        const reactionContent = r.content;
        if (!reactionContent) {
          return acc;
        }
        const { content: reaction, action } = reactionContent;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        const count = acc[reaction]?.count || 0;
        const isAdding = action === ReactionAction.Added;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        const prevDidAdd = acc[reaction]?.didAdd ?? false;
        const didAdd =
          r.senderInboxId === client.inboxId ? isAdding : prevDidAdd;
        const newCount = isAdding ? count + 1 : count - 1;
        if (newCount <= 0) {
          const { [reaction]: _, ...rest } = acc;
          return rest;
        }
        return {
          ...acc,
          [reaction]: { count: newCount, didAdd },
        };
      }, {});
  }, [message.reactions]);

  return (
    <Box p="md" tabIndex={0} className={classes.root}>
      <Box
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            void navigate(
              `/${environment}/conversations/${message.conversationId}/message/${message.id}`,
            );
          }
        }}
        onClick={() =>
          void navigate(
            `/${environment}/conversations/${message.conversationId}/message/${message.id}`,
          )
        }>
        <ErrorBoundary key={message.id}>
          <MessageContentWithWrapper
            message={message}
            align={align}
            senderInboxId={message.senderInboxId}
            scrollToMessage={scrollToMessage}
          />
        </ErrorBoundary>
      </Box>
      <Group
        justify={align === "left" ? "flex-start" : "flex-end"}
        mt="xs"
        gap="xxxs">
        {Object.entries(reactions).map(([reaction, { count, didAdd }]) => (
          <Badge
            className={classes.reaction}
            key={reaction}
            size="xl"
            variant={didAdd ? "outline" : "default"}
            radius="lg"
            rightSection={
              count > 1 ? <Text size="sm">{count}</Text> : undefined
            }
            onClick={handleReaction(
              reaction,
              didAdd ? ReactionAction.Removed : ReactionAction.Added,
            )}>
            {reaction}
          </Badge>
        ))}
      </Group>
      {hasActions && (
        <Group justify={align === "left" ? "flex-start" : "flex-end"} mt={4}>
          <ReactionPopover message={message} />
          <Button
            size="compact-xs"
            variant="subtle"
            onClick={() => {
              setReplyTarget(message);
            }}>
            Reply
          </Button>
        </Group>
      )}
    </Box>
  );
};

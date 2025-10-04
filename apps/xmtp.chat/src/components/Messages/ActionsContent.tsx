import { Button, Paper, Stack, type ButtonVariant } from "@mantine/core";
import { isAfter, parseISO } from "date-fns";
import { useCallback } from "react";
import BreakableText from "@/components/Messages/BreakableText";
import type { Action, Actions } from "@/content-types/Actions";
import { ContentTypeIntent, type Intent } from "@/content-types/Intent";
import { useConversationContext } from "@/contexts/ConversationContext";
import { useConversation } from "@/hooks/useConversation";

export type ActionsContentProps = {
  content: Actions;
};

const styleToVariantMap: Record<Required<Action>["style"], ButtonVariant> = {
  primary: "filled",
  secondary: "default",
  danger: "filled",
};

const styleToColorMap: Record<Required<Action>["style"], string | undefined> = {
  primary: undefined,
  secondary: undefined,
  danger: "red",
};

export const ActionsContent: React.FC<ActionsContentProps> = ({ content }) => {
  const { conversationId } = useConversationContext();
  const { send } = useConversation(conversationId);
  const handleActionClick = useCallback(
    (actionId: string) => {
      const intent: Intent = {
        id: content.id,
        actionId,
      };
      void send(intent, ContentTypeIntent);
    },
    [send, content],
  );
  const actionsExpiration = content.expiresAt
    ? parseISO(content.expiresAt)
    : undefined;
  return (
    <Paper p="sm" radius="md" withBorder>
      <Stack gap="xxs">
        <BreakableText>{content.description}</BreakableText>
        {content.actions.map((action) => {
          const actionExpiration = action.expiresAt
            ? parseISO(action.expiresAt)
            : undefined;
          const expiration = actionExpiration ?? actionsExpiration;
          const isExpired = expiration && isAfter(Date.now(), expiration);
          return (
            <Button
              key={action.id}
              disabled={isExpired}
              title={isExpired ? "This action has expired" : undefined}
              variant={
                action.style ? styleToVariantMap[action.style] : "filled"
              }
              color={action.style ? styleToColorMap[action.style] : undefined}
              onClick={() => {
                if (!isExpired) {
                  handleActionClick(action.id);
                }
              }}>
              {action.label}
            </Button>
          );
        })}
      </Stack>
    </Paper>
  );
};

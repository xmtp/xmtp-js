import { Button, Paper, Stack, type ButtonVariant } from "@mantine/core";
import { useCallback } from "react";
import BreakableText from "@/components/Messages/BreakableText";
import type { Action, Actions } from "@/content-types/Actions";
import { ContentTypeIntent, type Intent } from "@/content-types/Intent";
import { useConversationContext } from "@/contexts/ConversationContext";

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
  const { conversation } = useConversationContext();
  const handleActionClick = useCallback(
    (actionId: string) => {
      const intent: Intent = {
        id: content.id,
        actionId,
      };
      void conversation.send(intent, ContentTypeIntent);
    },
    [conversation, content],
  );
  return (
    <Paper p="sm" radius="md" withBorder>
      <Stack gap="xxs">
        <BreakableText>{content.description}</BreakableText>
        {content.actions.map((action) => (
          <Button
            key={action.id}
            variant={action.style ? styleToVariantMap[action.style] : "filled"}
            color={action.style ? styleToColorMap[action.style] : undefined}
            onClick={() => {
              handleActionClick(action.id);
            }}>
            {action.label}
          </Button>
        ))}
      </Stack>
    </Paper>
  );
};

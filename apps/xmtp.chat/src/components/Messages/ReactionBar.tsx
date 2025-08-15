import {
  ActionIcon,
  Box,
  Button,
  Group,
  Popover,
  SegmentedControl,
  TextInput,
} from "@mantine/core";
import type { DecodedMessage } from "@xmtp/browser-sdk";
import {
  ContentTypeReaction,
  type Reaction,
} from "@xmtp/content-type-reaction";
import { useState } from "react";
import { useConversationContext } from "@/contexts/ConversationContext";
import { useConversation } from "@/hooks/useConversation";

const EMOJIS = ["👍", "❤️", "😂", "🔥", "😮", "🙏", "🎉", "👀"];

export type ReactionBarProps = {
  message: DecodedMessage;
};

export const ReactionBar: React.FC<ReactionBarProps> = ({ message }) => {
  const { conversation } = useConversationContext();
  const { send } = useConversation(conversation);
  const [opened, setOpened] = useState(false);
  const [schema, setSchema] = useState<Reaction["schema"]>("unicode");
  const [text, setText] = useState("");

  const sendReaction = async (value: string) => {
    const payload: Reaction = {
      action: "added",
      reference: message.id,
      referenceInboxId: message.senderInboxId,
      schema,
      content: value,
    };
    await send(payload, ContentTypeReaction);
    setOpened(false);
    setText("");
    setSchema("unicode");
  };

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      width={240}
      position="top"
      withinPortal>
      <Popover.Target>
        <Button
          size="compact-xs"
          variant="subtle"
          onClick={() => setOpened((o) => !o)}>
          React
        </Button>
      </Popover.Target>
      <Popover.Dropdown p="xs">
        <SegmentedControl
          value={schema}
          onChange={(v: string) => setSchema(v as Reaction["schema"])}
          data={[
            { label: "Unicode", value: "unicode" },
            { label: "Shortcode", value: "shortcode" },
            { label: "Custom", value: "custom" },
          ]}
          mb="xs"
          size="xs"
        />
        <Box
          style={{
            height: 36,
            display: "flex",
            alignItems: "center",
            width: "100%",
          }}>
          {schema === "unicode" ? (
            <Group gap={4} wrap="nowrap" align="center">
              {EMOJIS.map((e) => (
                <ActionIcon
                  key={e}
                  size="sm"
                  variant="light"
                  onClick={() => void sendReaction(e)}>
                  {e}
                </ActionIcon>
              ))}
            </Group>
          ) : (
            <Group gap="xs" wrap="nowrap" align="center">
              <TextInput
                value={text}
                onChange={(e) => setText(e.currentTarget.value)}
                placeholder={schema === "shortcode" ? ":xmtp:" : "Enter custom"}
                size="xs"
                style={{ width: 180 }}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    (schema === "shortcode" || schema === "custom")
                  ) {
                    e.preventDefault();
                    const value = text.trim();
                    if (value) void sendReaction(value);
                  }
                }}
              />
              <ActionIcon
                size="sm"
                variant="filled"
                onClick={() => text && void sendReaction(text)}>
                ➤
              </ActionIcon>
            </Group>
          )}
        </Box>
      </Popover.Dropdown>
    </Popover>
  );
};

import {
  ActionIcon,
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

export const ReactionPopover: React.FC<ReactionBarProps> = ({ message }) => {
  const { conversationId } = useConversationContext();
  const { send } = useConversation(conversationId);
  const [opened, setOpened] = useState(false);
  const [schema, setSchema] = useState<Reaction["schema"]>("unicode");
  const [text, setText] = useState("");

  const sendReaction = async (content: string) => {
    const payload: Reaction = {
      action: "added",
      reference: message.id,
      referenceInboxId: message.senderInboxId,
      schema,
      content,
    };
    await send(payload, ContentTypeReaction);
    setOpened(false);
    setText("");
    setSchema("unicode");
  };

  return (
    <Popover opened={opened} onChange={setOpened} width="auto" position="top">
      <Popover.Target>
        <Button
          size="compact-xs"
          variant="subtle"
          onClick={() => {
            setOpened((opened) => !opened);
          }}>
          React
        </Button>
      </Popover.Target>
      <Popover.Dropdown p="sm">
        <SegmentedControl
          value={schema}
          onChange={(schema: string) => {
            switch (schema) {
              case "unicode":
              case "shortcode":
                setSchema(schema);
                break;
              default:
                setSchema("custom");
            }
          }}
          data={[
            { label: "Unicode", value: "unicode" },
            { label: "Shortcode", value: "shortcode" },
            { label: "Custom", value: "custom" },
          ]}
          mb="sm"
          size="sm"
        />
        <Group align="center" h="42px" wrap="nowrap">
          {schema === "unicode" ? (
            <Group gap="xxs">
              {EMOJIS.map((emoji) => (
                <ActionIcon
                  key={emoji}
                  size="sm"
                  variant="light"
                  onClick={() => void sendReaction(emoji)}>
                  {emoji}
                </ActionIcon>
              ))}
            </Group>
          ) : (
            <Group gap="sm" w="100%">
              <TextInput
                flex={1}
                value={text}
                onChange={(event) => {
                  setText(event.currentTarget.value);
                }}
                placeholder={schema === "shortcode" ? ":xmtp:" : "Enter custom"}
                size="md"
                style={{ width: 180 }}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    ["shortcode", "custom"].includes(schema)
                  ) {
                    event.preventDefault();
                    void sendReaction(text);
                  }
                }}
              />
              <ActionIcon
                size="md"
                variant="filled"
                onClick={() => void sendReaction(text)}>
                ➤
              </ActionIcon>
            </Group>
          )}
        </Group>
      </Popover.Dropdown>
    </Popover>
  );
};

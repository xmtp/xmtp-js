import {
  ActionIcon,
  Button,
  Group,
  Popover,
  SegmentedControl,
  TextInput,
} from "@mantine/core";
import type { DecodedMessage } from "@xmtp/browser-sdk";
import type { Reaction } from "@xmtp/content-type-reaction";
import { useState } from "react";
import { useReactions } from "@/contexts/ReactionsContext";

const EMOJIS = ["👍", "❤️", "😂", "🔥", "😮", "🙏", "🎉", "👀"];

export const ReactionBar: React.FC<{ message: DecodedMessage }> = ({
  message,
}) => {
  const { toggleReaction } = useReactions();
  const [opened, setOpened] = useState(false);
  const [schema, setSchema] = useState<Reaction["schema"]>("unicode");
  const [text, setText] = useState("");

  const send = async (value: string) => {
    await toggleReaction(message, value, schema);
    setOpened(false);
    setText("");
    setSchema("unicode");
  };

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      width="auto"
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
        {schema === "unicode" ? (
          <Group gap={4} wrap="nowrap">
            {EMOJIS.map((e) => (
              <ActionIcon
                key={e}
                size="sm"
                variant="light"
                onClick={() => void send(e)}>
                {e}
              </ActionIcon>
            ))}
          </Group>
        ) : (
          <Group gap="xs" wrap="nowrap">
            <TextInput
              value={text}
              onChange={(e) => setText(e.currentTarget.value)}
              placeholder={
                schema === "shortcode" ? ":thumbsup:" : "Enter custom"
              }
              size="xs"
              style={{ width: 180 }}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  (schema === "shortcode" || schema === "custom")
                ) {
                  e.preventDefault();
                  const value = text.trim();
                  if (value) void send(value);
                }
              }}
            />
            <ActionIcon
              size="sm"
              variant="filled"
              onClick={() => text && void send(text)}>
              ➤
            </ActionIcon>
          </Group>
        )}
      </Popover.Dropdown>
    </Popover>
  );
};

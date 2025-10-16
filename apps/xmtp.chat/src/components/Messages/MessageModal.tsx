import { Center, Code, ScrollArea, Stack, Tabs, Text } from "@mantine/core";
import { useNavigate, useOutletContext, useParams } from "react-router";
import { CodeWithCopy } from "@/components/CodeWithCopy";
import type { ConversationOutletContext } from "@/components/Conversation/ConversationOutletContext";
import { Modal } from "@/components/Modal";
import { useCollapsedMediaQuery } from "@/hooks/useCollapsedMediaQuery";
import { useMessage } from "@/stores/inbox/hooks";
import { MessageProperties } from "./MessageProperties";

export const MessageModal: React.FC = () => {
  const { messageId } = useParams();
  const { conversationId } = useOutletContext<ConversationOutletContext>();
  const message = useMessage(conversationId, messageId ?? "");
  const navigate = useNavigate();

  const fullScreen = useCollapsedMediaQuery();
  const contentHeight = fullScreen ? "auto" : 500;

  return (
    <Modal
      opened
      centered
      fullScreen={fullScreen}
      trapFocus
      size="md"
      scrollAreaComponent={ScrollArea.Autosize}
      onClose={() => void navigate(-1)}
      title={
        <Text size="lg" fw={700} c="text.primary">
          Message details
        </Text>
      }>
      {message ? (
        <Stack
          h={contentHeight}
          flex={1}
          gap="xs"
          style={{ overflow: "hidden" }}>
          <Tabs
            defaultValue="properties"
            flex={1}
            style={{
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}>
            <Tabs.List>
              <Tabs.Tab value="properties">Properties</Tabs.Tab>
              <Tabs.Tab value="encodedContent">Encoded content</Tabs.Tab>
              <Tabs.Tab value="decodedContent">Decoded content</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel
              value="properties"
              py="md"
              flex={1}
              style={{
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}>
              <ScrollArea>
                <MessageProperties message={message} />
              </ScrollArea>
            </Tabs.Panel>
            <Tabs.Panel
              value="encodedContent"
              py="md"
              flex={1}
              style={{
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}>
              <ScrollArea>
                <CodeWithCopy
                  code={JSON.stringify(message.encodedContent, null, 2)}
                />
              </ScrollArea>
            </Tabs.Panel>
            <Tabs.Panel
              value="decodedContent"
              py="md"
              flex={1}
              style={{
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}>
              <ScrollArea>
                {message.content !== undefined ? (
                  <CodeWithCopy
                    code={JSON.stringify(message.content, null, 2)}
                  />
                ) : (
                  <Code
                    p="md"
                    block
                    style={{
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}>
                    The contents of this message could not be decoded.
                  </Code>
                )}
              </ScrollArea>
            </Tabs.Panel>
          </Tabs>
        </Stack>
      ) : (
        <Center>
          <Text>Unable to load message</Text>
        </Center>
      )}
    </Modal>
  );
};

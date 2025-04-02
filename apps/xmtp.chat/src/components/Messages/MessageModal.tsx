import { Center, Modal, ScrollArea, Stack, Tabs, Text } from "@mantine/core";
import { type DecodedMessage } from "@xmtp/browser-sdk";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { CodeWithCopy } from "@/components/CodeWithCopy";
import { useCollapsedMediaQuery } from "@/hooks/useCollapsedMediaQuery";
import { useConversations } from "@/hooks/useConversations";
import { MessageProperties } from "./MessageProperties";

export const MessageModal: React.FC = () => {
  const { messageId } = useParams();
  const { getMessageById, loading } = useConversations();
  const navigate = useNavigate();
  const [message, setMessage] = useState<DecodedMessage | undefined>(undefined);

  const fullScreen = useCollapsedMediaQuery();
  const contentHeight = fullScreen ? "auto" : 500;

  useEffect(() => {
    if (!messageId) return;
    const loadMessage = async () => {
      const message = await getMessageById(messageId);
      setMessage(message);
    };
    void loadMessage();
  }, [messageId]);

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
      {!message && loading && (
        <Center>
          <Text truncate>Loading...</Text>
        </Center>
      )}
      {message && (
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
                <CodeWithCopy code={JSON.stringify(message.content, null, 2)} />
              </ScrollArea>
            </Tabs.Panel>
          </Tabs>
        </Stack>
      )}
    </Modal>
  );
};

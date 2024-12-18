import {
  Center,
  Code,
  Modal,
  ScrollArea,
  Stack,
  Tabs,
  Text,
  useMatches,
} from "@mantine/core";
import { type SafeMessage } from "@xmtp/browser-sdk";
import { ContentTypeId } from "@xmtp/content-type-primitives";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useClient } from "../hooks/useClient";
import { CodeWithCopy } from "./CodeWithCopy";
import { MessageProperties } from "./MessageProperties";

export const MessageModal: React.FC = () => {
  const { messageId } = useParams();
  const { client } = useClient();
  const navigate = useNavigate();
  const [message, setMessage] = useState<SafeMessage | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const fullScreen = useMatches({
    base: true,
    sm: false,
  });

  const contentHeight = useMatches({
    base: "auto",
    sm: 500,
  });

  useEffect(() => {
    if (!client || !messageId) return;
    const loadMessage = async () => {
      const message = await client.conversations.getMessageById(messageId);
      setMessage(message);
      setLoading(false);
    };
    void loadMessage();
  }, [client, messageId]);

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
              <Tabs.Tab value="rawContent">Raw content</Tabs.Tab>
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
              value="rawContent"
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
                <CodeWithCopy
                  code={JSON.stringify(
                    client?.decodeContent(
                      message,
                      new ContentTypeId(message.content.type),
                    ),
                    null,
                    2,
                  )}
                />
              </ScrollArea>
            </Tabs.Panel>
          </Tabs>
        </Stack>
      )}
    </Modal>
  );
};

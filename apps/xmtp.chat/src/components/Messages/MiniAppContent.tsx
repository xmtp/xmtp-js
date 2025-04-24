import { Box, Group, Image, Stack, Text } from "@mantine/core";
import type { Client } from "@xmtp/browser-sdk";
import {
  type MiniAppActionContent,
  type MiniAppContent as MiniAppContentType,
  type UIAction,
} from "@xmtp/content-type-mini-app";
import { MiniAppRenderer } from "@xmtp/content-type-mini-app/react";
import { useOutletContext } from "react-router";
import {
  MessageContentWrapper,
  type MessageContentAlign,
} from "@/components/Messages/MessageContentWrapper";
import { IconInfo } from "@/icons/IconInfo";
import componentMap from "@/mini-app/componentMap";
import classes from "./MiniAppContent.module.css";

export type MiniAppContentProps = {
  align: MessageContentAlign;
  senderInboxId: string;
  content: MiniAppContentType;
  sentAtNs: bigint;
};

export const MiniAppContent: React.FC<MiniAppContentProps> = ({
  align,
  content,
  senderInboxId,
  sentAtNs,
}) => {
  const { client } = useOutletContext<{ client: Client }>();
  const isUI = content.type === "action" && content.action.type === "ui";

  return (
    <MessageContentWrapper
      align={align}
      senderInboxId={senderInboxId}
      sentAtNs={sentAtNs}
      stopClickPropagation={isUI}>
      {isUI ? (
        <Stack gap="0">
          <Group
            align="center"
            justify="space-between"
            gap="xs"
            p="xs"
            className={classes.header}>
            <Group gap="xs">
              {content.manifest.icon && (
                <Image
                  src={content.manifest.icon}
                  alt="XMTP logo"
                  w="24"
                  h="24"
                />
              )}
              <Text size="sm" fw={700}>
                {content.manifest.name}
              </Text>
            </Group>
            <IconInfo />
          </Group>
          <Box className={classes.content}>
            <MiniAppRenderer
              debug
              client={client}
              buttonActionMap={{
                data: (data, content) => {
                  console.log(data, content);
                },
                transaction: () => {},
              }}
              componentMap={componentMap}
              senderInboxId={senderInboxId}
              content={content as MiniAppActionContent<UIAction>}
            />
          </Box>
        </Stack>
      ) : (
        <Text>This is a mini app message not intended for display</Text>
      )}
    </MessageContentWrapper>
  );
};

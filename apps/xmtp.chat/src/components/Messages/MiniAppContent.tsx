import { Text } from "@mantine/core";
import type { Client, ExtractCodecContentTypes } from "@xmtp/browser-sdk";
import {
  type MiniAppActionContent,
  type MiniAppCodec,
  type MiniAppContent as MiniAppContentType,
  type UIAction,
} from "@xmtp/content-type-mini-app";
import { MiniAppRenderer } from "@xmtp/content-type-mini-app/react";
import { useOutletContext } from "react-router";
import {
  MessageContentWrapper,
  type MessageContentAlign,
} from "@/components/Messages/MessageContentWrapper";
import componentMap from "@/mini-app/componentMap";

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
  const { client } = useOutletContext<{
    client: Client<ExtractCodecContentTypes<[MiniAppCodec]>>;
  }>();
  const isUI = content.type === "action" && content.action.type === "ui";

  return (
    <MessageContentWrapper
      align={align}
      senderInboxId={senderInboxId}
      sentAtNs={sentAtNs}
      stopClickPropagation={isUI}>
      {isUI ? (
        <MiniAppRenderer
          debug
          client={client}
          componentMap={componentMap}
          manifest={content.manifest}
          senderInboxId={senderInboxId}
          content={content as MiniAppActionContent<UIAction>}
        />
      ) : (
        <Text>This is a mini app message not intended for display</Text>
      )}
    </MessageContentWrapper>
  );
};

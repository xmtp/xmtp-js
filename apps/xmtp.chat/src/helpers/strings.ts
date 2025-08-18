import { Message, type DecodedMessage } from "@xmtp/browser-sdk";
import { ContentTypeReaction, Reaction } from "@xmtp/content-type-reaction";
import { ContentTypeReply, Reply } from "@xmtp/content-type-reply";
import { ContentTypeText } from "@xmtp/content-type-text";

export const isValidEthereumAddress = (
  address: string,
): address is `0x${string}` => /^0x[a-fA-F0-9]{40}$/.test(address);

export const isValidInboxId = (inboxId: string): inboxId is string =>
  /^[a-z0-9]{64}$/.test(inboxId);

export const shortAddress = (address: string): string =>
  `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;

export const stringifyMessage = ({
  content,
  fallback,
  contentType,
}: Pick<DecodedMessage, "content" | "fallback" | "contentType">): string => {
  switch (true) {
    case typeof content === "string":
      return content;
    case contentType.sameAs(ContentTypeReply):
      // Other content types could be nested in a reply
      return stringifyMessage({
        content: (content as Reply).content,
        fallback,
        contentType,
      });
    case contentType.sameAs(ContentTypeReaction):
      return (content as Reaction).content;
    case contentType.sameAs(ContentTypeText):
      return content as string;
    default:
      return String(fallback);
  }
};

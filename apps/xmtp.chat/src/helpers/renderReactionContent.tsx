import { Image } from "@mantine/core";
import type { Reaction } from "@xmtp/content-type-reaction";

const SHORTCODE_MAP: { [code: string]: string } = {
  ":thumbsup:": "👍",
  ":xmtp:": "https://xmtp.chat/xmtp-icon.png",
} as const;

export const renderReactionContent = (
  schema: Reaction["schema"],
  content: string,
) => {
  switch (schema) {
    case "unicode":
      return content;
    case "shortcode": {
      const replacement = SHORTCODE_MAP[content];
      if (replacement) {
        if (replacement.startsWith("http")) {
          return (
            <Image
              src={replacement}
              alt={content}
              style={{ width: 18, height: 18, display: "inline-block" }}
            />
          );
        }
        return replacement;
      }
    }
    default:
      return content;
  }
};

export default renderReactionContent;

import type { Reaction } from "@xmtp/content-type-reaction";
import React from "react";

const SHORTCODE_IMAGE_MAP: Record<string, string> = {
  ":thumbsup:": "👍",
};

export const renderReactionContent = (
  schema: Reaction["schema"],
  content: string,
) => {
  if (schema === "unicode") return content;
  if (schema === "shortcode") {
    const src = SHORTCODE_IMAGE_MAP[content];
    if (src) {
      if (src.startsWith("http")) {
        return (
          // eslint-disable-next-line jsx-a11y/alt-text
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={content}
            style={{ width: 18, height: 18, display: "inline-block" }}
          />
        );
      }
      return src;
    }
    return content;
  }
  // custom: for demo, just return text
  return content;
};

export default renderReactionContent;

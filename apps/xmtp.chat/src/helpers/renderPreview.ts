import { DecodedMessage } from "@xmtp/browser-sdk";

export function renderPreview(message: DecodedMessage) {
  if ("content" in message) {
    if (
      message.content &&
      typeof message.content === "object" &&
      "content" in message.content
    ) {
      return String(message.content.content);
    }
    return String(message.content);
  }
  return String(message);
}

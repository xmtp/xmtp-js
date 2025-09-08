const V3_TOPIC_PREFIX = "/xmtp/mls/1/";
const TOPIC_SUFFIX = "/proto";

export const buildWelcomeTopic = (installationId: string) =>
  `${V3_TOPIC_PREFIX}w-${installationId}${TOPIC_SUFFIX}`;

export const buildConversationTopic = (groupId: string) =>
  `${V3_TOPIC_PREFIX}g-${groupId}${TOPIC_SUFFIX}`;

export const isWelcomeTopic = (topic: string) =>
  topic
    .replace(new RegExp(`^${V3_TOPIC_PREFIX}`), "")
    .replace(new RegExp(`${TOPIC_SUFFIX}$`), "")
    .startsWith("w-");

export const isConversationTopic = (topic: string) =>
  topic
    .replace(new RegExp(`^${V3_TOPIC_PREFIX}`), "")
    .replace(new RegExp(`${TOPIC_SUFFIX}$`), "")
    .startsWith("g-");

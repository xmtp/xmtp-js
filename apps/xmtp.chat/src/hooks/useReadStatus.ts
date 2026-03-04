import type { DecodedMessage } from "@xmtp/browser-sdk";
import { useEffect, useMemo, useState } from "react";
import { useClient } from "@/contexts/XMTPContext";
import { useConversation } from "@/hooks/useConversation";

export type ReadStatus = "sent" | "read";

export const useReadStatus = (conversationId: string) => {
  const { conversation } = useConversation(conversationId);
  const client = useClient();
  const [lastReadTimes, setLastReadTimes] = useState<Map<string, bigint>>(
    new Map(),
  );

  useEffect(() => {
    const fetchReadTimes = async () => {
      const times = await conversation.lastReadTimes();
      setLastReadTimes(times);
    };
    void fetchReadTimes();
  }, [conversation]);

  const maxOtherReadTime = useMemo(() => {
    let max = 0n;
    for (const [inboxId, time] of lastReadTimes) {
      if (inboxId !== client.inboxId && time > max) {
        max = time;
      }
    }
    return max;
  }, [lastReadTimes, client.inboxId]);

  const getReadStatus = useMemo(() => {
    return (message: DecodedMessage): ReadStatus | undefined => {
      if (message.senderInboxId !== client.inboxId) {
        return undefined;
      }
      return message.sentAtNs <= maxOtherReadTime ? "read" : "sent";
    };
  }, [maxOtherReadTime, client.inboxId]);

  return {
    getReadStatus,
    refreshReadStatus: () => {
      void conversation.lastReadTimes().then(setLastReadTimes);
    },
  };
};

import type { DecodedMessage } from "@xmtp/browser-sdk";
import { useEffect, useMemo } from "react";
import { useClient } from "@/contexts/XMTPContext";
import { useActions, useLastReadTimes } from "@/stores/inbox/hooks";

export type ReadStatus = "sent" | "read";

export const useReadStatus = (conversationId: string) => {
  const client = useClient();
  const lastReadTimes = useLastReadTimes(conversationId);
  const { updateLastReadTimes } = useActions();

  useEffect(() => {
    void updateLastReadTimes(conversationId);
  }, [conversationId, updateLastReadTimes]);

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

  return { getReadStatus };
};

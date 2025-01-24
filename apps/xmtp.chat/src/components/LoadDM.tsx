import {
  Utils,
  type Conversation as XmtpConversation,
} from "@xmtp/browser-sdk";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useBodyClass } from "../hooks/useBodyClass";
import { useClient } from "../hooks/useClient";
import { useConversations } from "../hooks/useConversations";

export const LoadDM: React.FC = () => {
  useBodyClass("main-flex-layout");
  const { address } = useParams();
  const { loading } = useConversations();
  const { client, initialize } = useClient();
  const [conversation, setConversation] = useState<
    XmtpConversation | undefined
  >(undefined);

  useEffect(() => {
    const loadConversation = async () => {
      console.log("client", client);

      if (address) {
        const inboxId = await new Utils().getInboxIdForAddress(address);
        console.log("inboxId", inboxId);
        const dm = await client?.conversations.getDmByInboxId(
          inboxId as string,
        );
        console.log("dm", dm);
        if (!dm) {
          const dm = await client?.conversations.newDm(inboxId as string);
          console.log("dm", dm);
          setConversation(dm);
          return;
        }
        setConversation(dm);
      }
    };
    void loadConversation();
  }, [address]);

  return null;
};

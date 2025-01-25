import { Badge, Box, Button, Stack, Title } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { Utils, type XmtpEnv } from "@xmtp/browser-sdk";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { LoadingMessage } from "@/components/LoadingMessage";
import { useAppState } from "@/contexts/AppState";
import { useRefManager } from "@/contexts/RefManager";
import { useBodyClass } from "@/hooks/useBodyClass";
import { useClient } from "@/hooks/useClient";
import { useConversations } from "@/hooks/useConversations";

export const LoadDM: React.FC = () => {
  useBodyClass("main-flex-layout");
  const { setNavbar } = useAppState();
  useEffect(() => {
    setNavbar(false);
  }, []);
  const [message, setMessage] = useState("");
  const { getRef } = useRefManager();
  const [network] = useLocalStorage<XmtpEnv>({
    key: "XMTP_NETWORK",
    defaultValue: "dev",
  });
  const { address } = useParams();
  const { newDm } = useConversations();
  const { client } = useClient();
  const navigate = useNavigate();

  useEffect(() => {
    const loadDm = async () => {
      if (!client) {
        return;
      }

      // no address, redirect to root
      if (!address) {
        void navigate("/");
        return;
      }

      try {
        setMessage("Verifying address...");
        const inboxId = await new Utils().getInboxIdForAddress(address);
        // no inbox ID, redirect to root
        if (!inboxId) {
          setMessage("Invalid address, redirecting...");
          setTimeout(() => {
            void navigate("/");
          }, 2000);
          return;
        }

        // look for existing DM group
        setMessage("Looking for existing DM...");
        const dm = await client.conversations.getDmByInboxId(inboxId);
        if (!dm) {
          // no DM group, create it
          setMessage("Creating new DM...");
          const dmGroup = await newDm(inboxId);
          // go to new DM group
          void navigate(`/conversations/${dmGroup.id}`);
        }
      } catch (e) {
        setMessage("Error loading DM, redirecting...");
        // if any errors occur during this process, redirect to root
        setTimeout(() => {
          void navigate("/");
          // rethrow error for error modal
          throw e;
        }, 2000);
      }
    };
    void loadDm();
  }, [client, address]);

  return client ? (
    <LoadingMessage message={message} />
  ) : (
    <Box
      display="flex"
      style={{ flexGrow: 1, alignItems: "center", justifyContent: "center" }}>
      <Stack gap="xs">
        <Title order={3}>No client connected</Title>
        <Box>
          Click{" "}
          <Button
            size="xs"
            px={6}
            onClick={() => {
              getRef("connect-wallet-button")?.current?.click();
            }}>
            Connect
          </Button>{" "}
          to connect a wallet to the{" "}
          <Badge variant="default" size="lg" radius="md">
            {network}
          </Badge>{" "}
          network
        </Box>
      </Stack>
    </Box>
  );
};

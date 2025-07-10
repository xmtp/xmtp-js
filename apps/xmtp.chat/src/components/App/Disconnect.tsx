import { LoadingOverlay } from "@mantine/core";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useXMTP } from "@/contexts/XMTPContext";
import { useConnectWallet } from "@/hooks/useConnectWallet";
import { useSettings } from "@/hooks/useSettings";
import { CenteredLayout } from "@/layouts/CenteredLayout";

export const Disconnect: React.FC = () => {
  const navigate = useNavigate();
  const { disconnect } = useConnectWallet();
  const { setAutoConnect, setEphemeralAccountEnabled } = useSettings();
  const { disconnect: disconnectClient } = useXMTP();

  useEffect(() => {
    disconnect(undefined, {
      onSuccess: () => {
        disconnectClient();
        setEphemeralAccountEnabled(false);
        setAutoConnect(false);
        void navigate("/");
      },
    });
  }, []);

  return (
    <CenteredLayout>
      <LoadingOverlay visible={true} />
    </CenteredLayout>
  );
};

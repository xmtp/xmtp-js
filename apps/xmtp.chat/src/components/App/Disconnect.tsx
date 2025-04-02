import { LoadingOverlay } from "@mantine/core";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useDisconnect } from "wagmi";
import { useXMTP } from "@/contexts/XMTPContext";
import { useSettings } from "@/hooks/useSettings";
import { CenteredLayout } from "@/layouts/CenteredLayout";

export const Disconnect: React.FC = () => {
  const navigate = useNavigate();
  const { disconnect } = useDisconnect();
  const { setEphemeralAccountEnabled, ephemeralAccountEnabled } = useSettings();
  const { disconnect: disconnectClient } = useXMTP();

  useEffect(() => {
    if (ephemeralAccountEnabled) {
      setEphemeralAccountEnabled(false);
    }
    disconnect(undefined, {
      onSuccess: () => {
        disconnectClient();
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

import { LoadingOverlay } from "@mantine/core";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useXMTP } from "@/contexts/XMTPContext";
import { useWallet } from "@/hooks/useWallet";
import { CenteredLayout } from "@/layouts/CenteredLayout";

export const Disconnect: React.FC = () => {
  const navigate = useNavigate();
  const { disconnect } = useWallet();
  const { disconnect: disconnectClient } = useXMTP();

  useEffect(() => {
    disconnect(() => {
      disconnectClient();
      void navigate("/");
    });
  }, []);

  return (
    <CenteredLayout>
      <LoadingOverlay visible={true} />
    </CenteredLayout>
  );
};

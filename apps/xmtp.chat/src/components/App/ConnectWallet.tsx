import { Button } from "@mantine/core";
import { useCallback } from "react";
import { useSettings } from "@/hooks/useSettings";
import { useWallet } from "@/hooks/useWallet";

export const ConnectWallet: React.FC = () => {
  const { connect, disconnect, loading, isConnected } = useWallet();
  const { ephemeralAccountEnabled } = useSettings();

  const handleConnect = useCallback(() => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  }, [connect, isConnected, disconnect]);

  return (
    <Button
      color={isConnected ? "red" : "var(--mantine-color-primary)"}
      onClick={handleConnect}
      loading={loading}
      disabled={ephemeralAccountEnabled}>
      {isConnected ? "Disconnect" : "Connect"}
    </Button>
  );
};

import { Button } from "@mantine/core";
import { useCallback } from "react";
import { useConnectWallet } from "@/hooks/useConnectWallet";
import { useSettings } from "@/hooks/useSettings";

export const ConnectWallet: React.FC = () => {
  const { connect, disconnect, loading, isConnected } = useConnectWallet();
  const { connector, ephemeralAccountEnabled } = useSettings();

  const handleConnect = useCallback(() => {
    if (isConnected) {
      disconnect();
    } else {
      connect(connector)();
    }
  }, [connect, connector, isConnected, disconnect]);

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

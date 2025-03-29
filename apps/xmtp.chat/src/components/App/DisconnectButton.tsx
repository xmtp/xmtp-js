import { Button, useMatches } from "@mantine/core";
import { useDisconnect } from "wagmi";
import { useXMTP } from "@/contexts/XMTPContext";
import { useSettings } from "@/hooks/useSettings";
import { IconLogout } from "@/icons/IconLogout";

export const DisconnectButton: React.FC = () => {
  const { disconnect } = useDisconnect();
  const { setEphemeralAccountEnabled, ephemeralAccountEnabled } = useSettings();
  const { disconnect: disconnectClient } = useXMTP();
  const label: React.ReactNode = useMatches({
    base: <IconLogout size={24} />,
    sm: "Disconnect",
  });
  const px = useMatches({
    base: "xs",
    sm: "md",
  });

  const handleDisconnect = () => {
    if (ephemeralAccountEnabled) {
      setEphemeralAccountEnabled(false);
    }
    disconnect(undefined, {
      onSuccess: () => {
        disconnectClient();
      },
    });
  };
  return (
    <Button onClick={handleDisconnect} px={px}>
      {label}
    </Button>
  );
};

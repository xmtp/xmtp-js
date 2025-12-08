import { Stepper } from "@mantine/core";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ConnectXMTP } from "@/components/App/ConnectXMTP";
import { WalletConnect } from "@/components/App/WalletConnect";
import { useXMTP } from "@/contexts/XMTPContext";
import { useConnectWallet } from "@/hooks/useConnectWallet";
import { useRedirect } from "@/hooks/useRedirect";
import { useSettings } from "@/hooks/useSettings";

export const Connect = () => {
  const { isConnected, disconnect, loading } = useConnectWallet();
  const {
    environment,
    ephemeralAccountEnabled,
    setEphemeralAccountEnabled,
    setAutoConnect,
  } = useSettings();
  const { client } = useXMTP();
  const navigate = useNavigate();
  const { redirectUrl, setRedirectUrl } = useRedirect();
  const [active, setActive] = useState(0);

  // redirect if there's already a client
  useEffect(() => {
    if (client) {
      if (redirectUrl) {
        setRedirectUrl("");
        void navigate(redirectUrl);
      } else {
        void navigate(`/${environment}`);
      }
    }
  }, [client, environment]);

  useEffect(() => {
    if (isConnected || ephemeralAccountEnabled) {
      setActive(1);
    } else {
      setActive(0);
    }
  }, [isConnected, ephemeralAccountEnabled]);

  const handleDisconnectWallet = useCallback(() => {
    if (isConnected) {
      disconnect();
    } else {
      setEphemeralAccountEnabled(false);
    }
    setAutoConnect(false);
  }, [isConnected, disconnect]);

  return (
    <Stepper active={active} onStepClick={setActive}>
      <Stepper.Step
        label="Connect your wallet"
        allowStepSelect={false}
        loading={loading}>
        <WalletConnect />
      </Stepper.Step>
      <Stepper.Step label="Connect to XMTP" allowStepSelect={false}>
        <ConnectXMTP onDisconnectWallet={handleDisconnectWallet} />
      </Stepper.Step>
    </Stepper>
  );
};

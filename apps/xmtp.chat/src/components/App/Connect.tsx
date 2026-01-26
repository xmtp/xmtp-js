import { Stepper } from "@mantine/core";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ConnectXMTP } from "@/components/App/ConnectXMTP";
import { WalletConnect } from "@/components/App/WalletConnect";
import { useXMTP } from "@/contexts/XMTPContext";
import { useRedirect } from "@/hooks/useRedirect";
import { useSettings } from "@/hooks/useSettings";
import { useWallet } from "@/hooks/useWallet";

export const Connect = () => {
  const { isConnected, loading } = useWallet();
  const { environment, ephemeralAccountEnabled } = useSettings();
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

  return (
    <Stepper active={active} onStepClick={setActive}>
      <Stepper.Step
        label="Connect your wallet"
        allowStepSelect={false}
        loading={loading}>
        <WalletConnect />
      </Stepper.Step>
      <Stepper.Step label="Connect to XMTP" allowStepSelect={false}>
        <ConnectXMTP />
      </Stepper.Step>
    </Stepper>
  );
};

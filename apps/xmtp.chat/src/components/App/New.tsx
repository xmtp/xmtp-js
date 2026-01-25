import { useEffect } from "react";
import { useNavigate } from "react-router";
import { LoadingMessage } from "@/components/LoadingMessage";
import { useXMTP } from "@/contexts/XMTPContext";
import { useConnectXmtp } from "@/hooks/useConnectXmtp";
import { useSettings } from "@/hooks/useSettings";
import { useWallet } from "@/hooks/useWallet";

export const New = () => {
  const { isConnected } = useWallet();
  const {
    environment,
    ephemeralAccountEnabled,
    setEphemeralAccountEnabled,
    autoConnect,
    setUseSCW,
  } = useSettings();
  // if autoConnect is true, this hook will automatically connect to XMTP
  // once a wallet is connected
  const { connect } = useConnectXmtp();
  const { client } = useXMTP();
  const navigate = useNavigate();

  useEffect(() => {
    // redirect if there's already a client
    if (client) {
      void navigate(`/${environment}`);
      return;
    }

    // wallet is already connected without autoConnect, connect to XMTP
    if (isConnected && !autoConnect) {
      connect();
      return;
    }

    // wallet is not connected, ensure ephemeral account is enabled
    if (!isConnected && !ephemeralAccountEnabled) {
      setEphemeralAccountEnabled(true);
      // disable SCW if enabled
      setUseSCW(false);
      return;
    }

    if (!autoConnect) {
      // connect to XMTP
      connect();
    }
  }, [
    autoConnect,
    client,
    connect,
    environment,
    ephemeralAccountEnabled,
    isConnected,
    navigate,
  ]);

  return <LoadingMessage message="Connecting to XMTP..." />;
};

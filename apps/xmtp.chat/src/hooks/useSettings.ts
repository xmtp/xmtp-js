import { useLocalStorage } from "@mantine/hooks";
import { LogLevel, type ClientOptions, type XmtpEnv } from "@xmtp/browser-sdk";
import { useEffect } from "react";
import type { Hex } from "viem";
import type { ConnectorString } from "@/hooks/useConnectWallet";

const loggingLevelStringToEnum = {
  off: LogLevel.Off,
  error: LogLevel.Error,
  warn: LogLevel.Warn,
  info: LogLevel.Info,
  debug: LogLevel.Debug,
  trace: LogLevel.Trace,
};

export const useSettings = () => {
  const [environment, setEnvironment] = useLocalStorage<XmtpEnv>({
    key: "XMTP_NETWORK",
    defaultValue: "dev",
    getInitialValueInEffect: false,
  });
  const [ephemeralAccountKey, setEphemeralAccountKey] =
    useLocalStorage<Hex | null>({
      key: "XMTP_EPHEMERAL_ACCOUNT_KEY",
      defaultValue: null,
      getInitialValueInEffect: false,
    });
  const [encryptionKey, setEncryptionKey] = useLocalStorage({
    key: "XMTP_ENCRYPTION_KEY",
    defaultValue: "",
    getInitialValueInEffect: false,
  });
  const [ephemeralAccountEnabled, setEphemeralAccountEnabled] = useLocalStorage(
    {
      key: "XMTP_USE_EPHEMERAL_ACCOUNT",
      defaultValue: false,
      getInitialValueInEffect: false,
    },
  );
  const [loggingLevel, setLoggingLevel] = useLocalStorage<
    ClientOptions["loggingLevel"]
  >({
    key: "XMTP_LOGGING_LEVEL",
    defaultValue: LogLevel.Warn,
    getInitialValueInEffect: false,
  });
  const [forceSCW, setForceSCW] = useLocalStorage<boolean>({
    key: "XMTP_FORCE_SCW",
    defaultValue: false,
    getInitialValueInEffect: false,
  });
  const [useSCW, setUseSCW] = useLocalStorage<boolean>({
    key: "XMTP_USE_SCW",
    defaultValue: false,
    getInitialValueInEffect: false,
  });
  const [blockchain, setBlockchain] = useLocalStorage<number>({
    key: "XMTP_BLOCKCHAIN",
    defaultValue: 1,
    getInitialValueInEffect: false,
  });
  const [connector, setConnector] = useLocalStorage<ConnectorString>({
    key: "XMTP_CONNECTOR",
    defaultValue: "Injected",
    getInitialValueInEffect: false,
  });
  const [autoConnect, setAutoConnect] = useLocalStorage<boolean>({
    key: "XMTP_AUTO_CONNECT",
    defaultValue: false,
    getInitialValueInEffect: false,
  });
  const [showDisclaimer, setShowDisclaimer] = useLocalStorage<boolean>({
    key: "XMTP_SHOW_DISCLAIMER",
    defaultValue: true,
    getInitialValueInEffect: false,
  });
  const [gatewayHost, setGatewayHost] = useLocalStorage({
    key: "XMTP_GATEWAY_HOST",
    defaultValue: null,
    getInitialValueInEffect: false,
  });

  // fix for old logging level values
  useEffect(() => {
    if (typeof loggingLevel === "string") {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      setLoggingLevel(loggingLevelStringToEnum[loggingLevel] ?? LogLevel.Off);
    }
  }, [loggingLevel]);

  return {
    autoConnect,
    blockchain,
    connector,
    encryptionKey,
    environment,
    ephemeralAccountEnabled,
    ephemeralAccountKey,
    forceSCW,
    gatewayHost,
    loggingLevel,
    useSCW,
    showDisclaimer,
    setAutoConnect,
    setBlockchain,
    setConnector,
    setEncryptionKey,
    setEnvironment,
    setEphemeralAccountEnabled,
    setEphemeralAccountKey,
    setForceSCW,
    setGatewayHost,
    setLoggingLevel,
    setUseSCW,
    setShowDisclaimer,
  };
};

import { useLocalStorage } from "@mantine/hooks";
import { type ClientOptions, type XmtpEnv } from "@xmtp/browser-sdk";
import type { Hex } from "viem";

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
    defaultValue: "off",
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

  return {
    blockchain,
    encryptionKey,
    environment,
    ephemeralAccountEnabled,
    ephemeralAccountKey,
    forceSCW,
    loggingLevel,
    useSCW,
    setBlockchain,
    setEncryptionKey,
    setEnvironment,
    setEphemeralAccountEnabled,
    setEphemeralAccountKey,
    setForceSCW,
    setLoggingLevel,
    setUseSCW,
  };
};

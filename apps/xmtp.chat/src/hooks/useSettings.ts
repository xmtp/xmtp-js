import { useLocalStorage } from "@mantine/hooks";
import { type ClientOptions, type XmtpEnv } from "@xmtp/browser-sdk";
import { uint8ArrayToHex } from "uint8array-extras";
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
    defaultValue: uint8ArrayToHex(crypto.getRandomValues(new Uint8Array(32))),
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

  return {
    encryptionKey,
    environment,
    ephemeralAccountEnabled,
    ephemeralAccountKey,
    loggingLevel,
    setEncryptionKey,
    setEnvironment,
    setEphemeralAccountEnabled,
    setEphemeralAccountKey,
    setLoggingLevel,
  };
};

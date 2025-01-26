import { Button, Flex, Loader, Text, useMatches } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import type { ClientOptions, XmtpEnv } from "@xmtp/browser-sdk";
import { useEffect, useRef } from "react";
import { hexToUint8Array, uint8ArrayToHex } from "uint8array-extras";
import { type Hex } from "viem";
import { generatePrivateKey } from "viem/accounts";
import { useConnect, useDisconnect, useWalletClient } from "wagmi";
import { injected } from "wagmi/connectors";
import { Settings } from "@/components/Settings/Settings";
import { useRefManager } from "@/contexts/RefManager";
import { createEphemeralSigner, createSigner } from "@/helpers/createSigner";
import { useClient } from "@/hooks/useClient";
import { IconLogout } from "@/icons/IconLogout";
import { IconUser } from "@/icons/IconUser";

export const Disconnect: React.FC = () => {
  const { disconnect } = useDisconnect();
  const { disconnect: disconnectClient } = useClient();
  const label: React.ReactNode = useMatches({
    base: <IconLogout size={24} />,
    sm: "Disconnect",
  });
  const px = useMatches({
    base: "xs",
    sm: "md",
  });

  const handleDisconnect = () => {
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

export const Connect: React.FC = () => {
  const { setRef } = useRefManager();
  const ref = useRef<HTMLButtonElement>(null);
  const { initialize, initializing } = useClient();
  const [encryptionKey] = useLocalStorage({
    key: "XMTP_ENCRYPTION_KEY",
    defaultValue: uint8ArrayToHex(crypto.getRandomValues(new Uint8Array(32))),
  });
  const [env] = useLocalStorage<XmtpEnv>({
    key: "XMTP_NETWORK",
    defaultValue: "dev",
  });
  const [useEphemeralAccount] = useLocalStorage({
    key: "XMTP_USE_EPHEMERAL_ACCOUNT",
    defaultValue: false,
  });
  const [ephemeralAccountKey, setEphemeralAccountKey] =
    useLocalStorage<Hex | null>({
      key: "XMTP_EPHEMERAL_ACCOUNT_KEY",
      defaultValue: null,
    });
  const [loggingLevel] = useLocalStorage<ClientOptions["loggingLevel"]>({
    key: "XMTP_LOGGING_LEVEL",
    defaultValue: "off",
  });
  const { connect } = useConnect();
  const { data } = useWalletClient();
  const label: React.ReactNode = useMatches({
    base: <IconUser size={24} />,
    sm: "Connect",
  });
  const px = useMatches({
    base: "xs",
    sm: "md",
  });

  useEffect(() => {
    setRef("connect-wallet-button", ref);
  }, []);

  useEffect(() => {
    if (data?.account) {
      void initialize({
        encryptionKey: hexToUint8Array(encryptionKey),
        env,
        loggingLevel,
        signer: createSigner(data.account.address, data),
      });
    }
  }, [data, env]);

  const handleConnect = () => {
    const connectEphemeralAccount = async () => {
      const key = ephemeralAccountKey || generatePrivateKey();
      if (!ephemeralAccountKey) {
        setEphemeralAccountKey(key);
      }
      const signer = createEphemeralSigner(key);
      await initialize({
        encryptionKey: hexToUint8Array(encryptionKey),
        env,
        loggingLevel,
        signer,
      });
    };
    if (!useEphemeralAccount) {
      connect({ connector: injected() });
    } else {
      void connectEphemeralAccount();
    }
  };

  return initializing ? (
    <Flex align="center" gap="xs">
      <Loader color="var(--mantine-primary-color-filled)" size="sm" />
      <Text size="sm">Connecting...</Text>
    </Flex>
  ) : (
    <Button onClick={handleConnect} px={px} ref={ref}>
      {label}
    </Button>
  );
};

export const Connection: React.FC = () => {
  const { client } = useClient();
  return (
    <Flex align="center" gap="xs" ml="auto">
      {!client && <Connect />}
      {client && <Disconnect />}
      <Settings />
    </Flex>
  );
};

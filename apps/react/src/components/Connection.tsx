import { Button, Flex, Loader, Text, useMatches } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { IconLogin2, IconUser } from "@tabler/icons-react";
import type { XmtpEnv } from "@xmtp/browser-sdk";
import { useEffect, useState } from "react";
import { hexToUint8Array, uint8ArrayToHex } from "uint8array-extras";
import { type Hex } from "viem";
import { generatePrivateKey } from "viem/accounts";
import { useConnect, useDisconnect, useWalletClient } from "wagmi";
import { injected } from "wagmi/connectors";
import { createEphemeralSigner, createSigner } from "../helpers/createSigner";
import { useClient } from "../hooks/useClient";
import { Settings } from "./Settings";

export const Disconnect: React.FC = () => {
  const { disconnect } = useDisconnect();
  const { disconnect: disconnectClient } = useClient();
  const label: React.ReactNode = useMatches({
    base: <IconLogin2 stroke={1.5} />,
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
  const [loading, setLoading] = useState(false);
  const { initialize } = useClient();
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
  const { connect } = useConnect();
  const { data } = useWalletClient();
  const label: React.ReactNode = useMatches({
    base: <IconUser stroke={1.5} />,
    sm: "Connect",
  });
  const px = useMatches({
    base: "xs",
    sm: "md",
  });

  useEffect(() => {
    if (data?.account) {
      void initialize({
        encryptionKey: hexToUint8Array(encryptionKey),
        env,
        signer: createSigner(data.account.address, data),
      });
      setLoading(false);
    }
  }, [data, env]);

  const handleConnect = () => {
    const connectEphemeralAccount = async () => {
      setLoading(true);
      const key = ephemeralAccountKey || generatePrivateKey();
      if (!ephemeralAccountKey) {
        setEphemeralAccountKey(key);
      }
      const signer = createEphemeralSigner(key);
      await initialize({
        encryptionKey: hexToUint8Array(encryptionKey),
        env,
        signer,
      });
      setLoading(false);
    };
    if (!useEphemeralAccount) {
      setLoading(true);
      connect({ connector: injected() });
    } else {
      void connectEphemeralAccount();
    }
  };

  return loading ? (
    <Flex align="center" gap="xs">
      <Loader color="var(--mantine-primary-color-filled)" size="sm" />
      <Text size="sm">Connecting...</Text>
    </Flex>
  ) : (
    <Button onClick={handleConnect} px={px}>
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

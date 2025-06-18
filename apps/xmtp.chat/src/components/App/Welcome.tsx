import {
  Anchor,
  LoadingOverlay,
  Stack,
  Text,
  Title,
  useMatches,
} from "@mantine/core";
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import { hexToUint8Array } from "uint8array-extras";
import { generatePrivateKey } from "viem/accounts";
import { useAccount, useConnect, useSignMessage } from "wagmi";
import { Connect } from "@/components/App/Connect";
import { Settings } from "@/components/App/Settings";
import { useXMTP } from "@/contexts/XMTPContext";
import {
  createEOASigner,
  createEphemeralSigner,
  createSCWSigner,
} from "@/helpers/createSigner";
import { useRedirect } from "@/hooks/useRedirect";
import { useSettings } from "@/hooks/useSettings";

export const Welcome = () => {
  const { status } = useConnect();
  const { initializing, client, initialize } = useXMTP();
  const navigate = useNavigate();
  const account = useAccount();
  const { redirectUrl, setRedirectUrl } = useRedirect();
  const { signMessageAsync } = useSignMessage();
  const {
    encryptionKey,
    environment,
    ephemeralAccountEnabled,
    ephemeralAccountKey,
    setEphemeralAccountKey,
    loggingLevel,
    useSCW,
  } = useSettings();
  const px = useMatches({
    base: "5%",
    sm: "10%",
  });

  // redirect if there's already a client
  useEffect(() => {
    if (client) {
      if (redirectUrl) {
        setRedirectUrl("");
        void navigate(redirectUrl);
      } else {
        void navigate("/");
      }
    }
  }, [client]);

  // create client if ephemeral account is enabled
  useEffect(() => {
    if (ephemeralAccountEnabled) {
      let accountKey = ephemeralAccountKey;
      if (!accountKey) {
        accountKey = generatePrivateKey();
        setEphemeralAccountKey(accountKey);
      }

      const signer = createEphemeralSigner(accountKey);
      void initialize({
        dbEncryptionKey: encryptionKey
          ? hexToUint8Array(encryptionKey)
          : undefined,
        env: environment,
        loggingLevel,
        signer,
      });
    }
  }, [
    ephemeralAccountEnabled,
    ephemeralAccountKey,
    encryptionKey,
    environment,
    loggingLevel,
  ]);

  // create client if wallet is connected
  useEffect(() => {
    if (!account.address || (useSCW && !account.chainId)) {
      return;
    }
    void initialize({
      dbEncryptionKey: encryptionKey
        ? hexToUint8Array(encryptionKey)
        : undefined,
      env: environment,
      loggingLevel,
      signer: useSCW
        ? createSCWSigner(
            account.address,
            (message: string) => signMessageAsync({ message }),
            account.chainId,
          )
        : createEOASigner(account.address, (message: string) =>
            signMessageAsync({ message }),
          ),
    });
  }, [account.address, account.chainId, useSCW, signMessageAsync]);

  const isBusy = status === "pending" || initializing;

  return (
    <>
      <LoadingOverlay visible={isBusy} />
      <Stack gap="xl" py={40} px={px} align="center">
        <Stack gap="md" align="center">
          <Title order={1}>XMTP.chat is built for developers</Title>
          <Text fs="italic" size="xl">
            Learn to build with XMTP — using an app built with XMTP
          </Text>
        </Stack>
        <Stack gap="md">
          <Title order={3} ml="sm">
            Settings
          </Title>
          <Settings />
          <Connect />
          <Title order={3}>Feedback</Title>
          <Stack gap="md">
            <Text>
              Your feedback is incredibly important to the success of this tool.
              If you find any bugs or have suggestions, please let us know by{" "}
              <Anchor
                href="https://github.com/xmtp/xmtp-js/issues/new/choose"
                target="_blank">
                filing an issue
              </Anchor>{" "}
              on GitHub.
            </Text>
            <Text>
              Check out the official{" "}
              <Anchor href="https://docs.xmtp.org/" target="_blank">
                documentation
              </Anchor>{" "}
              for more information on how to build with XMTP.
            </Text>
            <Text>
              If you have other questions about XMTP, visit our{" "}
              <Anchor href="https://community.xmtp.org/" target="_blank">
                community forums
              </Anchor>
              .
            </Text>
          </Stack>
        </Stack>
      </Stack>
      <Outlet />
    </>
  );
};

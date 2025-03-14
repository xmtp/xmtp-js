import { AppShell, Loader } from "@mantine/core";
import { useDisclosure, useLocalStorage } from "@mantine/hooks";
import type { ClientOptions, XmtpEnv } from "@xmtp/browser-sdk";
import { useEffect } from "react";
import { hexToUint8Array, uint8ArrayToHex } from "uint8array-extras";
import type { Hex } from "viem";
import { AppFooter } from "@/components/App/AppFooter";
import { AppHeader } from "@/components/App/AppHeader";
import { ErrorModal } from "@/components/App/ErrorModal";
import { useAppState } from "@/contexts/AppState";
import { useXMTP } from "@/contexts/XMTPContext";
import { createEphemeralSigner } from "@/helpers/createSigner";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useRedirects } from "@/hooks/useRedirects";
import { Main } from "@/routes/Main";
import { Navbar } from "@/routes/Navbar";
import classes from "./App.module.css";

export const App: React.FC = () => {
  useRedirects();
  useAnalytics();
  const [opened, { toggle }] = useDisclosure();
  const { initialize, initializing } = useXMTP();
  const [env] = useLocalStorage<XmtpEnv>({
    key: "XMTP_NETWORK",
    defaultValue: "dev",
  });
  const [ephemeralAccountKey] = useLocalStorage<Hex | null>({
    key: "XMTP_EPHEMERAL_ACCOUNT_KEY",
    defaultValue: null,
  });
  const [encryptionKey] = useLocalStorage({
    key: "XMTP_ENCRYPTION_KEY",
    defaultValue: uint8ArrayToHex(crypto.getRandomValues(new Uint8Array(32))),
  });
  const [checked] = useLocalStorage({
    key: "XMTP_USE_EPHEMERAL_ACCOUNT",
    defaultValue: false,
  });
  const [loggingLevel] = useLocalStorage<ClientOptions["loggingLevel"]>({
    key: "XMTP_LOGGING_LEVEL",
    defaultValue: "off",
  });
  const { navbar } = useAppState();

  useEffect(() => {
    const maybeConnect = async () => {
      if (checked && ephemeralAccountKey && encryptionKey) {
        const signer = createEphemeralSigner(ephemeralAccountKey);
        await initialize({
          encryptionKey: hexToUint8Array(encryptionKey),
          env,
          loggingLevel,
          signer,
        });
      }
    };
    void maybeConnect();
  }, [checked, ephemeralAccountKey, encryptionKey, env, loggingLevel]);

  return (
    <>
      <ErrorModal />
      <AppShell
        header={{ height: 68 }}
        footer={{
          height: 64,
        }}
        navbar={{
          width: { base: 300, lg: 420 },
          breakpoint: "sm",
          collapsed: { desktop: !navbar, mobile: !opened },
        }}
        padding="md">
        <AppShell.Header>
          <AppHeader opened={opened} toggle={toggle} collapsed={!navbar} />
        </AppShell.Header>
        <AppShell.Navbar className={classes.navbar}>
          <Navbar />
        </AppShell.Navbar>
        <AppShell.Main className={classes.main}>
          {initializing ? <Loader /> : <Main />}
        </AppShell.Main>
        <AppShell.Footer display="flex" className={classes.footer}>
          <AppFooter />
        </AppShell.Footer>
      </AppShell>
    </>
  );
};

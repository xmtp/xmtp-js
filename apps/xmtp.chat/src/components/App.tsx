import {
  AppShell,
  Button,
  Group,
  Modal,
  ScrollArea,
  Stack,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Plausible from "plausible-tracker";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useClient } from "../hooks/useClient";
import classes from "./App.module.css";
import { AppFooter } from "./AppFooter";
import { AppHeader } from "./AppHeader";
import { CodeWithCopy } from "./CodeWithCopy";
import { Main } from "./Main";
import { Navbar } from "./Navbar";

export const App: React.FC = () => {
  const [opened, { toggle }] = useDisclosure();
  const [collapsed, setCollapsed] = useState(true);
  const [unhandledRejectionError, setUnhandledRejectionError] = useState<
    string | null
  >(null);
  const { client } = useClient();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!client && location.pathname !== "/") {
      void navigate("/");
      return;
    }

    if (
      location.pathname.startsWith("/conversations") ||
      location.pathname.startsWith("/identity")
    ) {
      setCollapsed(false);
    } else {
      setCollapsed(true);
    }

    if (location.pathname === "/" && client) {
      void navigate("/conversations");
    }
  }, [location.pathname, client, navigate]);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setUnhandledRejectionError(
        (event.reason as Error).message || "Unknown error",
      );
    };
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, []);

  useEffect(() => {
    const plausible = Plausible({
      domain: "xmtp.chat",
    });
    const cleanupAutoPageviews = plausible.enableAutoPageviews();
    const cleanupAutoOutboundTracking = plausible.enableAutoOutboundTracking();
    return () => {
      cleanupAutoPageviews();
      cleanupAutoOutboundTracking();
    };
  }, []);

  return (
    <>
      {unhandledRejectionError && (
        <Modal
          opened={!!unhandledRejectionError}
          onClose={() => {
            setUnhandledRejectionError(null);
          }}
          withCloseButton={false}
          centered>
          <Stack gap="md">
            <Title order={4}>Application error</Title>
            <ScrollArea>
              <CodeWithCopy
                code={JSON.stringify(unhandledRejectionError, null, 2)}
              />
            </ScrollArea>
            <Group justify="space-between">
              <Button
                variant="default"
                component="a"
                href="https://github.com/xmtp/xmtp-js/issues/new/choose"
                target="_blank">
                Report issue
              </Button>
              <Button
                onClick={() => {
                  setUnhandledRejectionError(null);
                }}>
                OK
              </Button>
            </Group>
          </Stack>
        </Modal>
      )}
      <AppShell
        header={{ height: 68 }}
        footer={{
          height: 64,
        }}
        navbar={{
          width: { base: 300, lg: 420 },
          breakpoint: "sm",
          collapsed: { desktop: collapsed, mobile: !opened },
        }}
        padding="md">
        <AppShell.Header>
          <AppHeader opened={opened} toggle={toggle} collapsed={collapsed} />
        </AppShell.Header>
        <AppShell.Navbar className={classes.navbar}>
          {client && <Navbar />}
        </AppShell.Navbar>
        <AppShell.Main className={classes.main}>
          <Main />
        </AppShell.Main>
        <AppShell.Footer display="flex" className={classes.footer}>
          <AppFooter />
        </AppShell.Footer>
      </AppShell>
    </>
  );
};

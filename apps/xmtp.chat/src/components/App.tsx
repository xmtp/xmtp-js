import { AppShell } from "@mantine/core";
import { useDisclosure, useHotkeys } from "@mantine/hooks";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { useLocation, useNavigate } from "react-router";
import { useClient } from "../hooks/useClient";
import classes from "./App.module.css";
import { AppFooter } from "./AppFooter";
import { AppHeader } from "./AppHeader";
import { Main } from "./Main";
import { Navbar } from "./Navbar";
import { useConfetti } from "./XMTPContext";

export const App: React.FC = () => {
  const [opened, { toggle }] = useDisclosure();
  const [collapsed, setCollapsed] = useState(true);
  const { client } = useClient();
  const { confetti, setConfetti } = useConfetti();
  const location = useLocation();
  const navigate = useNavigate();
  useHotkeys([
    [
      "ctrl+shift+C",
      () => {
        setConfetti((v) => !v);
      },
    ],
  ]);

  useEffect(() => {
    if (location.pathname.startsWith("/conversations")) {
      if (!client) {
        void navigate("/");
        setCollapsed(true);
      }
      return;
    }

    if (location.pathname === "/") {
      if (client) {
        void navigate("/conversations");
        setCollapsed(false);
      }
      return;
    }
  }, [location.pathname, client, navigate]);

  return (
    <>
      {confetti && <Confetti />}
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
          <Navbar />
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

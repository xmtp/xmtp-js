import { AppShell } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useClient } from "../hooks/useClient";
import classes from "./App.module.css";
import { AppFooter } from "./AppFooter";
import { AppHeader } from "./AppHeader";
import { Main } from "./Main";
import { Navbar } from "./Navbar";

export const App: React.FC = () => {
  const [opened, { toggle }] = useDisclosure();
  const [collapsed, setCollapsed] = useState(true);
  const { client } = useClient();
  const location = useLocation();
  const navigate = useNavigate();

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
      <AppShell.Navbar p="md" className={classes.navbar}>
        <Navbar />
      </AppShell.Navbar>
      <AppShell.Main className={classes.main}>
        <Main />
      </AppShell.Main>
      <AppShell.Footer display="flex" className={classes.footer}>
        <AppFooter />
      </AppShell.Footer>
    </AppShell>
  );
};

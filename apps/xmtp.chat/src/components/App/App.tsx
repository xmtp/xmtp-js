import { AppShell } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { AppFooter } from "@/components/App/AppFooter";
import { AppHeader } from "@/components/App/AppHeader";
import { ErrorModal } from "@/components/App/ErrorModal";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useClient } from "@/hooks/useClient";
import { Main } from "@/routes/Main";
import { Navbar } from "@/routes/Navbar";
import classes from "./App.module.css";

export const App: React.FC = () => {
  useAnalytics();
  const [opened, { toggle }] = useDisclosure();
  const [collapsed, setCollapsed] = useState(true);
  const { client } = useClient();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (
      !client &&
      (location.pathname !== "/" || !location.pathname.startsWith("/dm"))
    ) {
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

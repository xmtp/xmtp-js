import { AppShell } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { AppFooter } from "@/components/App/AppFooter";
import { AppHeader } from "@/components/App/AppHeader";
import { ErrorModal } from "@/components/App/ErrorModal";
import { useAppState } from "@/contexts/AppState";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useRedirects } from "@/hooks/useRedirects";
import { Main } from "@/routes/Main";
import { Navbar } from "@/routes/Navbar";
import classes from "./App.module.css";

export const App: React.FC = () => {
  useRedirects();
  useAnalytics();
  const [opened, { toggle }] = useDisclosure();
  const { navbar } = useAppState();

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
          <Main />
        </AppShell.Main>
        <AppShell.Footer display="flex" className={classes.footer}>
          <AppFooter />
        </AppShell.Footer>
      </AppShell>
    </>
  );
};

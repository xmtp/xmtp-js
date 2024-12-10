import { AppShell } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import classes from "./App.module.css";
import { AppFooter } from "./AppFooter";
import { AppHeader } from "./AppHeader";

export type AppProps = {
  navbar?: React.ReactNode;
  main?: React.ReactNode;
  collapsed?: boolean;
};

export const App: React.FC<AppProps> = ({ navbar, main, collapsed }) => {
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 68 }}
      footer={{
        height: 64,
      }}
      navbar={{
        width: { base: 300, lg: 420 },
        breakpoint: "sm",
        collapsed: { desktop: collapsed ?? false, mobile: !opened },
      }}
      padding="md">
      <AppShell.Header>
        <AppHeader opened={opened} toggle={toggle} collapsed={collapsed} />
      </AppShell.Header>
      <AppShell.Navbar p="md" className={classes.navbar}>
        {navbar}
      </AppShell.Navbar>
      <AppShell.Main className={classes.main}>{main}</AppShell.Main>
      <AppShell.Footer display="flex" className={classes.footer}>
        <AppFooter />
      </AppShell.Footer>
    </AppShell>
  );
};

import { AppShell } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
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
      <AppHeader opened={opened} toggle={toggle} />
      <AppShell.Navbar p="md">{navbar}</AppShell.Navbar>
      <AppShell.Main>{main}</AppShell.Main>
      <AppFooter />
    </AppShell>
  );
};

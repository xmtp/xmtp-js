import { useClickOutside } from "@mantine/hooks";
import classes from "./MainLayout.module.css";

export const MainLayout: React.FC<React.PropsWithChildren> = ({ children }) => {
  return <div className={classes.root}>{children}</div>;
};

export const MainLayoutHeader: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  return (
    <header className={classes.header}>
      <div className={classes.headerContent}>{children}</div>
    </header>
  );
};

export const MainLayoutContent: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  return (
    <main className={classes.main}>
      <div className={classes.mainContent}>{children}</div>
    </main>
  );
};

export type MainLayoutNavProps = React.PropsWithChildren<{
  opened?: boolean;
  toggle?: () => void;
}>;

export const MainLayoutNav: React.FC<MainLayoutNavProps> = ({
  children,
  opened,
  toggle,
}) => {
  const ref = useClickOutside(() => {
    if (opened) {
      toggle?.();
    }
  });
  const classNames = [classes.aside, opened && classes.showNavbar];
  return (
    <aside className={classNames.join(" ")} ref={ref}>
      <nav className={classes.asideNav}>{children}</nav>
    </aside>
  );
};

export const MainLayoutFooter: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  return (
    <footer className={classes.footer}>
      <div className={classes.footerContent}>{children}</div>
    </footer>
  );
};

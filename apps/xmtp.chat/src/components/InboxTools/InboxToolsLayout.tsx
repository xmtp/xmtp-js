import { Outlet } from "react-router";
import { AppFooter } from "@/components/App/AppFooter";
import { InboxToolsHeader } from "@/components/InboxTools/InboxToolsHeader";
import {
  MainLayout,
  MainLayoutContent,
  MainLayoutFooter,
  MainLayoutHeader,
} from "@/layouts/MainLayout";

export const InboxToolsLayout: React.FC = () => {
  return (
    <MainLayout>
      <MainLayoutHeader>
        <InboxToolsHeader />
      </MainLayoutHeader>
      <MainLayoutContent>
        <Outlet />
      </MainLayoutContent>
      <MainLayoutFooter>
        <AppFooter />
      </MainLayoutFooter>
    </MainLayout>
  );
};

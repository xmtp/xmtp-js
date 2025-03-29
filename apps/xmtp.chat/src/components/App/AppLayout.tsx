import { LoadingOverlay } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect } from "react";
import { Outlet, Route, Routes, useLocation, useNavigate } from "react-router";
import { AppFooter } from "@/components/App/AppFooter";
import { AppHeader } from "@/components/App/AppHeader";
import { ConversationsNavbar } from "@/components/Conversations/ConversationsNavbar";
import { useXMTP } from "@/contexts/XMTPContext";
import { useRedirect } from "@/hooks/useRedirect";
import { CenteredLayout } from "@/layouts/CenteredLayout";
import {
  MainLayout,
  MainLayoutContent,
  MainLayoutFooter,
  MainLayoutHeader,
  MainLayoutNav,
} from "@/layouts/MainLayout";

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { client } = useXMTP();
  const { setRedirectUrl } = useRedirect();
  const [opened, { toggle }] = useDisclosure();

  useEffect(() => {
    if (!client) {
      // save the current path to redirect to it after the client is initialized
      setRedirectUrl(location.pathname);
      void navigate("/welcome");
    }
  }, [client]);

  return !client ? (
    <CenteredLayout>
      <LoadingOverlay visible />
    </CenteredLayout>
  ) : (
    <MainLayout>
      <MainLayoutHeader>
        <AppHeader client={client} opened={opened} toggle={toggle} />
      </MainLayoutHeader>
      <MainLayoutNav opened={opened} toggle={toggle}>
        <Routes>
          <Route path="/" element={null} />
          <Route path="/conversations/new" element={null} />
          <Route path="/conversations/:conversationId/manage" element={null} />
          <Route path="/conversations/*" element={<ConversationsNavbar />} />
          <Route path="/identity" element={null} />
        </Routes>
      </MainLayoutNav>
      <MainLayoutContent>
        <Outlet context={client} />
      </MainLayoutContent>
      <MainLayoutFooter>
        <AppFooter />
      </MainLayoutFooter>
    </MainLayout>
  );
};

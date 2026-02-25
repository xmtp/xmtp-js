import { useDisclosure } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router";
import { AppFooter } from "@/components/App/AppFooter";
import { AppHeader } from "@/components/App/AppHeader";
import { Disclaimer } from "@/components/App/Disclaimer";
import { ConversationsNavbar } from "@/components/Conversations/ConversationsNavbar";
import { LoadingMessage } from "@/components/LoadingMessage";
import { useXMTP } from "@/contexts/XMTPContext";
import { getSdkEnv, isValidEnvironment } from "@/helpers/strings";
import { useRedirect } from "@/hooks/useRedirect";
import { useSettings } from "@/hooks/useSettings";
import { CenteredLayout } from "@/layouts/CenteredLayout";
import {
  MainLayout,
  MainLayoutContent,
  MainLayoutFooter,
  MainLayoutHeader,
  MainLayoutNav,
} from "@/layouts/MainLayout";

const REDIRECT_TIMEOUT = 2000;

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { client } = useXMTP();
  const { setRedirectUrl } = useRedirect();
  const [opened, { toggle }] = useDisclosure();
  const [message, setMessage] = useState("Connecting...");
  const { environment: envParam } = useParams();
  const { setEnvironment, environment } = useSettings();
  const [validEnvironment, setValidEnvironment] = useState(false);

  useEffect(() => {
    if (!client) {
      // save the current path to redirect to it after the client is initialized
      if (location.pathname !== "/" && location.pathname !== "/disconnect") {
        setRedirectUrl(`${location.pathname}${location.search}`);
      }
      void navigate("/");
    }
  }, [client]);

  useEffect(() => {
    if (!client) {
      return;
    }

    // the session's actual SDK environment from client options
    const sessionSdkEnv = client.env!;
    const isInvalidEnvironment =
      !envParam ||
      !isValidEnvironment(envParam) ||
      getSdkEnv(envParam) !== sessionSdkEnv;

    let timeout: NodeJS.Timeout;

    if (isInvalidEnvironment) {
      // invalid or mismatched URL environment, redirect to matching environment
      // Prefer localStorage env (preserves D14N URL), fall back to raw SDK env
      const redirectEnv =
        getSdkEnv(environment) === sessionSdkEnv ? environment : sessionSdkEnv;
      setMessage("Invalid environment, redirecting...");
      timeout = setTimeout(() => {
        void navigate(`/${redirectEnv}`);
      }, REDIRECT_TIMEOUT);
    } else if (getSdkEnv(envParam) !== getSdkEnv(environment)) {
      // URL doesn't match localStorage, sync localStorage to URL
      setEnvironment(envParam);
      setValidEnvironment(true);
    } else {
      setValidEnvironment(true);
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [client, envParam, environment, navigate, setEnvironment]);

  return !client || !validEnvironment ? (
    <CenteredLayout fullScreen>
      <LoadingMessage message={message} />
    </CenteredLayout>
  ) : (
    <>
      <MainLayout>
        <MainLayoutHeader>
          <AppHeader client={client} opened={opened} toggle={toggle} />
        </MainLayoutHeader>
        <MainLayoutNav opened={opened} toggle={toggle}>
          <ConversationsNavbar />
        </MainLayoutNav>
        <MainLayoutContent>
          <Outlet />
        </MainLayoutContent>
        <MainLayoutFooter>
          <AppFooter />
        </MainLayoutFooter>
      </MainLayout>
      <Disclaimer />
    </>
  );
};

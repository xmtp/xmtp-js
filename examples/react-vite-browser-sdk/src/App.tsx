import {
  App as AppComponent,
  Conversation,
  Conversations,
  useClient,
} from "@xmtp/react-app";
import { useEffect, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router";

export const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(true);
  const { client } = useClient();
  const location = useLocation();
  const navigate = useNavigate();

  const Navbar = (
    <Routes>
      <Route path="/" element={null} />
      <Route path="/conversations/*" element={<Conversations />} />
    </Routes>
  );

  const Main = (
    <Routes>
      <Route path="/" element={null} />
      <Route path="/conversations">
        <Route index element={"Select a conversation"} />
        <Route path=":id" element={<Conversation id="new" />} />
      </Route>
    </Routes>
  );

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

  return <AppComponent navbar={Navbar} main={Main} collapsed={collapsed} />;
};

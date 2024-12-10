import { useEffect, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router";
import { App } from "../components/App";
import { Conversation } from "../components/Conversation";
import { Conversations } from "../components/Conversations";
import { useClient } from "../hooks/useClient";

export const AppController: React.FC = () => {
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

  return <App navbar={Navbar} main={Main} collapsed={collapsed} />;
};

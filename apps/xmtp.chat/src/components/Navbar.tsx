import { Route, Routes } from "react-router";
import { ConversationsNavbar } from "./ConversationsNavbar";

export const Navbar: React.FC = () => (
  <Routes>
    <Route path="/" element={null} />
    <Route path="/conversations/*" element={<ConversationsNavbar />} />
  </Routes>
);

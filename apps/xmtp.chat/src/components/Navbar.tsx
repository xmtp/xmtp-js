import { Route, Routes } from "react-router";
import { ConversationsNavbar } from "./ConversationsNavbar";
import { IdentityNavbar } from "./IdentityNavbar";

export const Navbar: React.FC = () => (
  <Routes>
    <Route path="/" element={null} />
    <Route path="/conversations/*" element={<ConversationsNavbar />} />
    <Route path="/identity" element={<IdentityNavbar />} />
  </Routes>
);

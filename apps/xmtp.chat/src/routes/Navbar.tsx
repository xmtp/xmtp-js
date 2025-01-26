import { Route, Routes } from "react-router";
import { ConversationsNavbar } from "@/components/Conversations/ConversationsNavbar";
import { IdentityNavbar } from "@/components/Identity/IdentityNavbar";
import { useAppState } from "@/contexts/AppState";

export const Navbar: React.FC = () => {
  const { navbar } = useAppState();
  return (
    navbar && (
      <Routes>
        <Route path="/" element={null} />
        <Route path="/conversations/*" element={<ConversationsNavbar />} />
        <Route path="/identity" element={<IdentityNavbar />} />
      </Routes>
    )
  );
};

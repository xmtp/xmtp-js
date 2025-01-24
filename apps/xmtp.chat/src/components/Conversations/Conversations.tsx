import { useEffect } from "react";
import { Outlet } from "react-router";
import { useAppState } from "@/contexts/AppState";

export const Conversations: React.FC = () => {
  const { setNavbar } = useAppState();
  useEffect(() => {
    setNavbar(true);
  }, []);

  return <Outlet />;
};

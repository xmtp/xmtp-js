import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useClient } from "@/hooks/useClient";

export const useRedirects = () => {
  const { client } = useClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (
      !client &&
      location.pathname !== "/" &&
      !location.pathname.startsWith("/dm")
    ) {
      void navigate("/");
      return;
    }

    if (location.pathname === "/" && client) {
      void navigate("/conversations");
    }
  }, [location.pathname, client, navigate]);
};

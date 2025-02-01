import { useNavigate } from "react-router";
import { useClient } from "@/hooks/useClient";
import { useDelayedEffect } from "@/hooks/useDelayedEffect";

export const useRedirects = () => {
  const { client } = useClient();
  const navigate = useNavigate();

  useDelayedEffect(
    () => {
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
    },
    1000,
    [location.pathname, client, navigate],
  );
};

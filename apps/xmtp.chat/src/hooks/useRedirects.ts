import { useNavigate } from "react-router";
import { useXMTP } from "@/contexts/XMTPContext";
import { useDelayedEffect } from "@/hooks/useDelayedEffect";

export const useRedirects = () => {
  const { client } = useXMTP();
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
    500,
    [location.pathname, client, navigate],
  );
};

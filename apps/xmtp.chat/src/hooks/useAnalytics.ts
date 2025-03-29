import Plausible from "plausible-tracker";
import { useEffect } from "react";

export const useAnalytics = () => {
  useEffect(() => {
    const plausible = Plausible({
      domain: "xmtp.chat",
    });
    const cleanupAutoPageviews = plausible.enableAutoPageviews();
    return () => {
      cleanupAutoPageviews();
    };
  }, []);
};

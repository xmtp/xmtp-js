import { useEffect } from "react";

export const useBodyClass = (className: string) => {
  useEffect(() => {
    document.body.classList.add(className);
    return () => {
      document.body.classList.remove(className);
    };
  }, []);
};

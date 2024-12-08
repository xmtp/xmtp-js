import { createContext, useContext, useMemo } from "react";

export type NavigateContextValue = {
  navigate: (to: string) => void | Promise<void>;
};

export const NavigateContext = createContext<NavigateContextValue>({
  navigate: () => {},
});

export type NavigateProviderProps = React.PropsWithChildren & {
  navigate: NavigateContextValue["navigate"];
};

export const NavigateProvider: React.FC<NavigateProviderProps> = ({
  children,
  navigate,
}) => {
  // memo-ize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      navigate,
    }),
    [navigate],
  );
  return (
    <NavigateContext.Provider value={value}>
      {children}
    </NavigateContext.Provider>
  );
};

export const useNavigate = () => {
  const { navigate } = useContext(NavigateContext);
  return navigate;
};

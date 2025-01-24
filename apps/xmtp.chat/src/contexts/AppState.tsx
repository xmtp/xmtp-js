import { createContext, useContext, useMemo, useState } from "react";

type AppStateContextType = {
  navbar: boolean;
  setNavbar: React.Dispatch<React.SetStateAction<boolean>>;
};

const AppStateContext = createContext<AppStateContextType>({
  navbar: false,
  setNavbar: () => {},
});

export const AppStateProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [navbar, setNavbar] = useState(false);

  const value = useMemo(
    () => ({
      navbar,
      setNavbar,
    }),
    [navbar],
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  return useContext(AppStateContext);
};

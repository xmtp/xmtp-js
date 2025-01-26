import { createContext, useContext, useMemo, useState } from "react";

type RefManagerContextType = {
  getRef: (id: string) => React.RefObject<HTMLElement> | undefined;
  setRef: (id: string, ref: React.RefObject<HTMLElement>) => void;
  removeRef: (id: string) => void;
};

const RefManagerContext = createContext<RefManagerContextType>({
  getRef: () => undefined,
  setRef: () => {},
  removeRef: () => {},
});

export const RefManagerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [refs, setRefs] = useState<Map<string, React.RefObject<HTMLElement>>>(
    new Map(),
  );

  const getRef = (id: string) => {
    return refs.get(id);
  };

  const setRef = (id: string, ref: React.RefObject<HTMLElement>) => {
    setRefs((prevRefs) => {
      const newRefs = new Map(prevRefs);
      newRefs.set(id, ref);
      return newRefs;
    });
  };

  const removeRef = (id: string) => {
    setRefs((prevRefs) => {
      const newRefs = new Map(prevRefs);
      newRefs.delete(id);
      return newRefs;
    });
  };

  const value = useMemo(
    () => ({
      getRef,
      setRef,
      removeRef,
    }),
    [refs],
  );

  return (
    <RefManagerContext.Provider value={value}>
      {children}
    </RefManagerContext.Provider>
  );
};

export const useRefManager = () => {
  return useContext(RefManagerContext);
};

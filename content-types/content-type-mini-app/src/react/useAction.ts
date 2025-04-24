import { useLiveQuery } from "dexie-react-hooks";
import { getAction, setActionCompleted } from "../db";

export const useAction = (uuid: string) => {
  const action = useLiveQuery(() => getAction(uuid));

  return {
    completed: action?.completed ?? false,
    setCompleted: async (completed: boolean) => {
      await setActionCompleted(uuid, completed);
    },
  };
};

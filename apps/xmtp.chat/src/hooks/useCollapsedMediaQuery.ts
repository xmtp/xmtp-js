import { useMediaQuery } from "@mantine/hooks";

export const useCollapsedMediaQuery = () => {
  return useMediaQuery("(max-width: 1080px)");
};

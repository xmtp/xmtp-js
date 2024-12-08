import { Providers } from "@xmtp/react-app";
import { useNavigate } from "react-router";

export const AppProviders: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const navigate = useNavigate();
  return <Providers navigate={navigate}>{children}</Providers>;
};

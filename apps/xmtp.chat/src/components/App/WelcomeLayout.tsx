import { Outlet } from "react-router";
import { CenteredLayout } from "@/layouts/CenteredLayout";

export const WelcomeLayout: React.FC = () => {
  return (
    <CenteredLayout>
      <Outlet />
    </CenteredLayout>
  );
};

import { Outlet } from "react-router";
import { CenteredLayout } from "@/layouts/CenteredLayout";

export const BasicLayout: React.FC = () => {
  return (
    <CenteredLayout>
      <Outlet />
    </CenteredLayout>
  );
};

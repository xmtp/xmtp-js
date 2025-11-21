import { Navigate, useParams, useSearchParams } from "react-router";

export const LoadDMLegacy: React.FC = () => {
  const { address } = useParams();
  const [searchParams] = useSearchParams();
  const env = searchParams.get("env");

  return env ? (
    <Navigate to={`/${env}/dm/${address}`} replace />
  ) : (
    <Navigate to="/" replace />
  );
};

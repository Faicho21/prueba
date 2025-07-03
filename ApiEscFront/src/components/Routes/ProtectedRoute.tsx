import { Navigate, Outlet } from "react-router-dom";

interface Props {
  rolRequerido?: string; // Opcional: si no se pasa, solo valida que haya login
}

function ProtectedRoute({ rolRequerido }: Props) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (rolRequerido && user.type !== rolRequerido) {
    return <Navigate to="/no-autorizado" />;
  }

  return <Outlet />;
}

export default ProtectedRoute;

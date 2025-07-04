import { Navigate, Outlet } from "react-router-dom";

function PublicRoute() {
  const token = localStorage.getItem("token");

  if (token) {
    return <Navigate to="/home" />;
  }

  return <Outlet />;
}

export default PublicRoute;

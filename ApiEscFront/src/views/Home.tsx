import { Navigate } from "react-router-dom";

export default function Home() {
  
  if (!localStorage.getItem("token")) return <Navigate to="/" />;

  const userLs = localStorage.getItem("user");
  const user = JSON.parse(userLs || "{}");


return (
  <div className="d-flex justify-content-center align-items-center vh-100">
    <div
      className="card p-4 shadow-lg"
      style={{ maxWidth: "600px", width: "100%" }}
    >
      <h1 className="text-center mb-3">BIENVENIDO</h1>
      <div className="text-center">
        <strong className="fs-4">Usuario:</strong>
        <div className="fs-3">{user.firstName} {user.lastName}</div>
      </div>
    </div>
  </div>
);

}
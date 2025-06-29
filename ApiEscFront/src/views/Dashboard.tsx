import { Navigate } from "react-router-dom";

export default function Dashboard() {
  
  if (!localStorage.getItem("token")) return <Navigate to="/" />;

  const userLs = localStorage.getItem("user");
  const user = JSON.parse(userLs || "{}");
    console.log('user', user)


  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div
        className="card p-4 shadow-lg"
        style={{ maxWidth: "600px", width: "100%" }}
      >
        <h1 className="text-center mb-3">Dashboard</h1>
          <strong>Usuario:</strong> {user.firstName} {user.lastName} 
        
        
      </div>
    </div>
  );
}

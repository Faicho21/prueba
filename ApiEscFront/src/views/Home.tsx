import { Navigate } from "react-router-dom";

export default function Home() {
  if (!localStorage.getItem("token")) return <Navigate to="/" />;

  const userLs = localStorage.getItem("user");
  const user = JSON.parse(userLs || "{}");

  return (
    <div
      className="d-flex flex-column min-vh-100"
      style={{
        backgroundImage: `url('/colegio.png')`,
        backgroundSize: '100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Contenido principal centrado */}
      <div className="flex-grow-1 d-flex justify-content-center align-items-center">
        <div
          className="card p-4 shadow-lg text-center"
          style={{
            maxWidth: "600px",
            width: "100%",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
          }}
        >
          <h1 className="mb-4">BIENVENIDO</h1>
          <strong className="fs-4">Usuario:</strong>
          <div className="fs-3">
            {user.firstName} {user.lastName}
          </div>
        </div>
      </div>

      {/* Footer fijo en el pie */}
      <footer
        className="text-center py-3 border-top"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.9)" }}
      >
        <small>
          Colegio Secundario Mariano Moreno | San Lorenzo 1234, Hasenkamp - Entre Rios|
          Tel: (343) 454-5678 | contacto@marianomoreno.edu.ar
        </small>
      </footer>
    </div>
  );
}

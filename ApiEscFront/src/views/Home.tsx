import { useEffect } from "react";
import { Navigate } from "react-router-dom";

export default function Home() {
  // Inyectamos el CSS directamente si no tenés App.css
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes slideFadeIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .fade-in-green {
        animation: slideFadeIn 0.6s ease-out forwards;
        border: 2px solid #3ab397;
        border-radius: 15px;
        background-color: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(8px);
      }
    `;
    document.head.appendChild(style);
  }, []);

  // Seguridad
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
          className="p-4 text-center fade-in-green"
          style={{
            maxWidth: "600px",
            width: "100%",
          }}
        >
          <h1 className="mb-4" style={{ color: "#3ab397", fontWeight: 700 }}>BIENVENIDO</h1>
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
          Colegio Secundario Mariano Moreno | San Lorenzo 1234, Hasenkamp - Entre Ríos |
          Tel: (343) 454-5678 | contacto@marianomoreno.edu.ar
        </small>
      </footer>
    </div>
  );
}

import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";

function Logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
}

function Nvar() {
  const [tipoUsuario, setTipoUsuario] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setTipoUsuario(payload.type?.toLowerCase()); // Convertido a minúsculas
      } catch (error) {
        console.error("Token inválido", error);
        setTipoUsuario(null);
      }
    }
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark" style={{ backgroundColor: "#3ab397" }}>
      <div className="container">
        <NavLink className="navbar-brand" to="/home">Mi Escuela</NavLink>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <NavLink className="nav-link" to="/perfil">Perfil</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/notificaciones">Notificaciones</NavLink>
            </li>

            {tipoUsuario === "alumno" && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/pagos">Mis pagos</NavLink>
              </li>
            )}

            {tipoUsuario === "admin" && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/pagos">Pagos</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/alumnos">Alumnos</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/carreras">Carreras</NavLink>
                </li>
              </>
            )}
          </ul>

          <button className="btn btn-outline-light" onClick={Logout}>
            Cerrar Sesión
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Nvar;

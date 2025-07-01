import React, { useEffect, useState } from 'react';

const MisPagos: React.FC = () => {
  const token = localStorage.getItem('token');
  const [tipoUsuario, setTipoUsuario] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true); // Para evitar mostrar mensaje antes de leer token

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log("PAYLOAD:", payload); // Útil para debug
        setTipoUsuario(payload.type?.toLowerCase());
      } catch (error) {
        console.error("Token inválido", error);
        setTipoUsuario(null);
      }
    }
    setCargando(false);
  }, [token]);

  // Mientras carga el tipo de usuario, no mostrar nada
  if (cargando) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (tipoUsuario !== "alumno") {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center">
          No tienes permiso para acceder a esta sección.
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="p-4 mb-4 bg-success bg-opacity-10 border-start border-4 border-success rounded shadow-sm">
        <h2 className="text-success m-0 text-center">Mis Pagos</h2>
      </div>

      <div className="alert alert-info text-center">
        Aquí se mostrarán tus pagos una vez que se integre la lógica.
      </div>

      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead className="table-light">
            <tr>
              <th>ID</th>
              <th>Carrera</th>
              <th>Monto</th>
              <th>Mes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4} className="text-center text-muted">
                (Sin datos aún)
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MisPagos;

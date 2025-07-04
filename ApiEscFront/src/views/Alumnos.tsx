import React, { useEffect, useState } from 'react';

interface Usuario {
  id: number;
  username: string;
  userdetail: {
    email: string;
    dni: number;
    firstName: string;
    lastName: string;
    type: string;
  };
}

interface NuevoUsuario {
  username: string;
  password: string;
  email: string;
  dni: number;
  firstName: string;
  lastName: string;
  type: string;
}

const Alumnos: React.FC = () => {
  const BACKEND_IP = "localhost";
  const BACKEND_PORT = "8000";
  const token = localStorage.getItem('token');

  const [alumnos, setAlumnos] = useState<Usuario[]>([]);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [tipoUsuario, setTipoUsuario] = useState<string>('');

  const fetchAlumnos = () => {
    fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/users/all`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setAlumnos(data.filter((u: Usuario) => u.userdetail?.type === "Alumno")))
      .catch(() => setMensaje("No se pudieron cargar los alumnos."));
  };

  useEffect(() => {
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setTipoUsuario(payload.type);
      fetchAlumnos();
    }
  }, [token]);

  const eliminarUsuario = (id: number) => {
    if (!window.confirm('¿Eliminar este usuario?')) return;

    fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok && setAlumnos(alumnos.filter(a => a.id !== id)))
      .catch(() => setMensaje("Error al eliminar el usuario."));
  };

  return (
    <div className="container-fluid mt-4">
      {mensaje && <div className="alert alert-info text-center">{mensaje}</div>}

      <div className="p-4 bg-light border rounded shadow-sm mb-4">
        <h5 className="text-center">Listado de Alumnos</h5>
        <div className="table-responsive" style={{ maxHeight: "400px", overflowY: "auto" }}>
          <table className="table table-sm table-bordered">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>DNI</th>
                <th>Nombre</th>
                <th>Apellido</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {alumnos.map(a => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>{a.username}</td>
                  <td>{a.userdetail.email}</td>
                  <td>{a.userdetail.dni}</td>
                  <td>{a.userdetail.firstName}</td>
                  <td>{a.userdetail.lastName}</td>
                  <td className="text-end">
                    <button
                      className="btn btn-sm border-secondary text-secondary me-2"
                      style={{ backgroundColor: 'transparent', transition: '0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f3f5'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      onClick={() => alert('Funcionalidad de edición no implementada en esta versión')}
                    >
                      🖉 Editar
                    </button>
                    <button
                      className="btn btn-sm border-dark text-dark"
                      style={{ backgroundColor: 'transparent', transition: '0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f3f5'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      onClick={() => eliminarUsuario(a.id)}
                    >
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Alumnos;

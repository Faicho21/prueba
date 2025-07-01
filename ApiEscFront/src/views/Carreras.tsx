import React, { useEffect, useState } from 'react';

interface Carrera {
  id: number;
  nombre: string;
  estado: string;
  user_id: number;
}

interface UserPayload {
  type: string;
}

const Carreras: React.FC = () => {
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ nombre: '', estado: '' });
  const [tipoUsuario, setTipoUsuario] = useState('');
  const token = localStorage.getItem('token');

  const BACKEND_IP = "localhost";
  const BACKEND_PORT = "8000";

  // Inyectar animación
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideFadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .fade-in-green {
        animation: slideFadeIn 0.6s ease-out forwards;
        border: 2px solid #3ab397;
        border-radius: 15px;
        background-color: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(8px);
        padding: 1.5rem;
      }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    if (token) {
      const payload: UserPayload = JSON.parse(atob(token.split('.')[1]));
      setTipoUsuario(payload.type);

      fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/carrera/todas`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => setCarreras(data))
        .catch(() => console.error("Error al obtener las carreras."));
    }
  }, [token]);

  const handleEdit = (carrera: Carrera) => {
    setEditandoId(carrera.id);
    setFormData({ nombre: carrera.nombre, estado: carrera.estado });
  };

  const handleCancel = () => {
    setEditandoId(null);
    setFormData({ nombre: '', estado: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = (id: number) => {
    fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/editarCarrera/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    })
      .then(res => {
        if (!res.ok) throw new Error();
        setCarreras(carreras.map(c => (c.id === id ? { ...c, ...formData } : c)));
        setEditandoId(null);
        setFormData({ nombre: '', estado: '' });
      })
      .catch(() => alert("Error al guardar los cambios."));
  };

  return (
    <div className="container mt-5 fade-in-green">
      <h2 className="text-center text-success mb-4">Listado de Carreras</h2>

      <div className="table-responsive">
        <table className="table table-hover table-bordered align-middle">
          <thead className="table-light">
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Estado</th>
              <th>Usuario (ID)</th>
              {tipoUsuario === 'Admin' && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {carreras.map(carrera => (
              <tr key={carrera.id}>
                <td>{carrera.id}</td>
                <td>
                  {editandoId === carrera.id ? (
                    <input
                      type="text"
                      className="form-control"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                    />
                  ) : (
                    carrera.nombre
                  )}
                </td>
                <td>
                  {editandoId === carrera.id ? (
                    <input
                      type="text"
                      className="form-control"
                      name="estado"
                      value={formData.estado}
                      onChange={handleChange}
                    />
                  ) : (
                    carrera.estado
                  )}
                </td>
                <td>{carrera.user_id}</td>
                {tipoUsuario === 'Admin' && (
                  <td>
                    {editandoId === carrera.id ? (
                      <>
                        <button className="btn btn-sm btn-success me-2" onClick={() => handleSave(carrera.id)}>
                          Guardar
                        </button>
                        <button className="btn btn-sm btn-secondary" onClick={handleCancel}>
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button className="btn btn-sm btn-primary" onClick={() => handleEdit(carrera)}>
                        Editar
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Carreras;

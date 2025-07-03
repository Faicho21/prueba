import React, { useEffect, useState } from 'react';

interface Carrera {
  id: number;
  nombre: string;
  estado: string;
  creado_en?: string;
  user_id: number;
  user?: {
    userdetail?: {
      firstName?: string;
      lastName?: string;
    };
  };
}

interface UserPayload {
  sub: number;
  type: string;
}

const Carreras: React.FC = () => {
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [tipoUsuario, setTipoUsuario] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', estado: '' });
  const [editId, setEditId] = useState<number | null>(null);

  const token = localStorage.getItem('token');
  const BACKEND_IP = "localhost";
  const BACKEND_PORT = "8000";

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
      setUserId(payload.sub);

      fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/carrera/todas`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => setCarreras(data))
        .catch(() => console.error("Error al obtener las carreras."));
    }
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const guardarCarrera = () => {
    if (!userId) return;

    const data = {
      nombre: formData.nombre,
      estado: formData.estado,
      user_id: userId,
    };

    const url = editId
      ? `http://${BACKEND_IP}:${BACKEND_PORT}/editarCarrera/${editId}`
      : `http://${BACKEND_IP}:${BACKEND_PORT}/nuevaCarrera`;

    fetch(url, {
      method: editId ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
      .then(res => {
        if (!res.ok) throw new Error();
        alert(editId ? "Carrera actualizada" : "Carrera agregada");
        setShowModal(false);
        setFormData({ nombre: '', estado: '' });
        setEditId(null);

        return fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/carrera/todas`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      })
      .then(res => res.json())
      .then(data => setCarreras(data))
      .catch(() => alert("Error al guardar la carrera."));
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
              <th>Fecha de creación</th>
              <th>Responsable</th>
            </tr>
          </thead>
          <tbody>
            {carreras.map(carrera => (
              <tr key={carrera.id}>
                <td>{carrera.id}</td>
                <td>{carrera.nombre}</td>
                <td>{carrera.creado_en ? new Date(carrera.creado_en).toLocaleDateString() : '---'}</td>
                <td>
                  {carrera.user?.userdetail
                    ? `${carrera.user.userdetail.firstName || ''} ${carrera.user.userdetail.lastName || ''}`
                    : `ID: ${carrera.user_id}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tipoUsuario === "Admin" && (
        <button
          className="btn btn-success mt-3"
          onClick={() => {
            setFormData({ nombre: '', estado: '' });
            setEditId(null);
            setShowModal(true);
          }}
        >
          Agregar Carrera
        </button>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal fade show" tabIndex={-1} style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content" style={{
              animation: 'slideFadeIn 0.4s ease-out',
              border: '2px solid #3ab397',
              backgroundColor: 'rgba(255,255,255,0.95)',
              borderRadius: '15px',
              backdropFilter: 'blur(5px)',
            }}>
              <div className="modal-header">
                <h5 className="modal-title">
                  {editId ? 'Editar Carrera' : 'Nueva Carrera'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <label className="form-label">Nombre</label>
                <input
                  className="form-control mb-2"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                />
                <label className="form-label">Estado</label>
                <select
                  className="form-select mb-2"
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                >
                  <option value="">Seleccionar estado</option>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={guardarCarrera}>
                  {editId ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Carreras;

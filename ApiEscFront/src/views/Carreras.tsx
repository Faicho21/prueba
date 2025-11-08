import React, { useEffect, useState } from "react";
import Select from "react-select";
import { Pencil, Trash2 } from "lucide-react";

interface Carrera {
  id: number;
  nombre: string;
  estado: string;
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
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);

  const [tipoUsuario, setTipoUsuario] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ nombre: "", estado: "Activa" });
  const [editId, setEditId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<{ nombre: string; estado: string }>({ nombre: "", estado: "Activa" });

  const [mensaje, setMensaje] = useState<string | null>(null);

  const [selectedAlumno, setSelectedAlumno] = useState<{ value: number; label: string } | null>(null);
  const [selectedCarrera, setSelectedCarrera] = useState<{ value: number; label: string } | null>(null);
  const [selectedCarreraVer, setSelectedCarreraVer] = useState<{ value: number; label: string } | null>(null);

  const [alumnosInscriptos, setAlumnosInscriptos] = useState<Alumno[]>([]);

  const token = localStorage.getItem("token");
  const BACKEND_IP = "localhost";
  const BACKEND_PORT = "8000";

  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => setMensaje(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  useEffect(() => {
    if (token) {
      const payload: UserPayload = JSON.parse(atob(token.split(".")[1]));
      setTipoUsuario(payload.type);
      setUserId(payload.sub);

      fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/carrera/todas`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setCarreras(data));

      fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/user/alumnos`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setAlumnos(data));
    }
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const guardarCarrera = () => {
    if (!userId) return;

    const data = {
      nombre: formData.nombre,
      estado: formData.estado,
    };

    fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/nuevaCarrera`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al guardar la carrera.");
        setMensaje("Carrera creada.");
        setFormData({ nombre: "", estado: "Activa" });
        return fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/carrera/todas`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      })
      .then(res => res.json())
      .then(data => setCarreras(data))
      .catch(() => alert("Error al guardar la carrera."));
  };

  const abrirModalEditar = (carrera: Carrera) => {
    setFormData({ nombre: carrera.nombre, estado: carrera.estado });
    setEditId(carrera.id);
    setShowModal(true);
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
              <th>Responsable</th>
              {tipoUsuario === "Admin" && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {carreras.map(carrera => (
              <tr key={carrera.id}>
                <td>{carrera.id}</td>
                <td>{carrera.nombre}</td>
                <td>{carrera.estado}</td>
                <td>
                  {carrera.user?.userdetail
                    ? `${carrera.user.userdetail.firstName || ''} ${carrera.user.userdetail.lastName || ''}`
                    : `ID: ${carrera.user_id}`}
                </td>
                {tipoUsuario === "Admin" && (
                  <td>
                    <button className="btn btn-sm btn-primary" onClick={() => abrirModalEditar(carrera)}>
                      Editar
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

        {/* Alumnos inscriptos */}
        <div className="col-md-6">
          <div className="p-4 bg-light border rounded shadow-sm" style={{ height: '450px' }}>
            <h5>Alumnos Inscriptos por Carrera</h5>
            <Select
              value={selectedCarreraVer}
              onChange={(option) => {
                setSelectedCarreraVer(option);
                if (option) verInscriptos(option.value);
              }}
              options={carreras.map((c) => ({ value: c.id, label: `${c.nombre} ` }))}
              placeholder="Seleccionar carrera"
              isClearable
            />
            <div className="mt-3" style={{ maxHeight: "330px", overflowY: "auto" }}>
              {alumnosInscriptos.length > 0 ? (
                <ul className="list-group">
                  {alumnosInscriptos.map((alumno) => (
                    <li key={alumno.id} className="list-group-item">
                      {alumno.userdetail.firstName} {alumno.userdetail.lastName}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No hay inscriptos para esta carrera.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Carreras;

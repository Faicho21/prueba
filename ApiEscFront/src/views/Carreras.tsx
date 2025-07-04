import React, { useEffect, useState } from "react";
import Select from "react-select";
import { Pencil, Trash2 } from "lucide-react";

interface Carrera {
  id: number;
  nombre: string;
  estado: string;
}

interface Alumno {
  id: number;
  username: string;
  userdetail: {
    firstName: string;
    lastName: string;
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

const guardarCarrera = () => {
  if (!userId) return;

  const data = {
    nombre: formData.nombre,
    estado: formData.estado,
  };

  const url = editId
    ? `http://${BACKEND_IP}:${BACKEND_PORT}/carrera/${editId}`
    : `http://${BACKEND_IP}:${BACKEND_PORT}/nuevaCarrera`;

  fetch(url, {
    method: editId ? "PATCH" : "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Error al guardar la carrera.");
      setMensaje(editId ? "Carrera actualizada." : "Carrera creada.");
      setFormData({ nombre: "", estado: "Activa" });
      setEditId(null);
      return fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/carrera/todas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    })
    .then((res) => res.json())
    .then((data) => setCarreras(data));
};


  const inscribirAlumno = (e: React.FormEvent) => {
    e.preventDefault();
    if (tipoUsuario !== "Admin" || !selectedAlumno || !selectedCarrera) return;

    fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/carrera/inscribir-alumno`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_id: selectedAlumno.value,
        carrera_id: selectedCarrera.value,
      }),
    })
      .then((res) => res.json())
      .then(() => {
        setMensaje("Alumno inscrito correctamente.");
        setSelectedAlumno(null);
        setSelectedCarrera(null);
      });
  };

  const abrirEditar = (c: Carrera) => {
    setFormData({ nombre: c.nombre, estado: c.estado });
    setEditId(c.id);
  };

  const eliminarCarrera = (id: number) => {
    if (!window.confirm("Eliminar carrera? Esta acción no se puede deshacer.")) return;
    fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/eliminarCarrera/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(() => {
        setMensaje("Carrera eliminada.");
        setCarreras((prev) => prev.filter((c) => c.id !== id));
      });
  };

  const verInscriptos = (carreraId: number) => {
    fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/carrera/${carreraId}/alumnos`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setAlumnosInscriptos(data));
  };

  return (
    <div className="container-fluid mt-4">
      {mensaje && <div className="alert alert-info text-center">{mensaje}</div>}

      <div className="row g-4">
        {/* Crear carrera */}
        <div className="col-md-6">
          <div className="p-4 bg-light border rounded shadow-sm h-100">
            <h5>Nueva Carrera</h5>
            <div className="d-flex gap-2 align-items-end">
              <input className="form-control w-50" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Nombre" />
              <select className="form-select w-25" name="estado" value={formData.estado} onChange={handleChange}>
                <option value="Activa">Activa</option>
                <option value="Inactiva">Inactiva</option>
              </select>
              <button className="btn border-success text-success" onClick={guardarCarrera}>
                {editId ? "Actualizar" : "Crear"}
              </button>
            </div>
          </div>
        </div>

        {/* Inscribir alumno */}
        <div className="col-md-6">
          <div className="p-4 bg-light border rounded shadow-sm h-100">
            <h5>Inscribir Alumno en Carrera</h5>
            <form onSubmit={inscribirAlumno}>
              <div className="d-flex gap-2 align-items-end">
                <div className="w-50">
                  <Select
                    value={selectedAlumno}
                    onChange={setSelectedAlumno}
                    options={alumnos.map((a) => ({ value: a.id, label: `${a.userdetail.firstName} ${a.userdetail.lastName} ` }))}
                    placeholder="Alumno"
                    isClearable
                  />
                </div>
                <div className="w-25">
                  <Select
                    value={selectedCarrera}
                    onChange={setSelectedCarrera}
                    options={carreras.map((c) => ({ value: c.id, label: `${c.nombre} ` }))}
                    placeholder="Carrera"
                    isClearable
                  />
                </div>
                <button type="submit" className="btn border-primary text-primary align-self-end">
                  Inscribir
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Listado de carreras */}
        <div className="col-md-6">
          <div className="p-4 bg-light border rounded shadow-sm" style={{ height: '450px' }}>
            <h5>Listado de Carreras</h5>
            <div className="table-responsive" style={{ maxHeight: "330px", overflowY: "auto" }}>
              <table className="table table-sm table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Estado</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {carreras.map((c) => (
                    <tr key={c.id}>
                      <td>{c.id}</td>
                      <td>{c.nombre}</td>
                      <td>{c.estado}</td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm border-secondary text-secondary me-2"
                          style={{ backgroundColor: 'transparent', transition: '0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f3f5'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                          onClick={() => abrirEditar(c)}
                        >
                          🖉 Editar
                        </button>
                        <button
                          className="btn btn-sm border-dark text-dark"
                          style={{ backgroundColor: 'transparent', transition: '0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f3f5'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                          onClick={() => eliminarCarrera(c.id)}
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

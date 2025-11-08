import React, { useEffect, useState } from "react";

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
interface InputUser {
  username: string;
  password: string;
  email: string;
  dni: number;
  firstName: string;
  lastName: string;
  type: string;
}
interface CambiosUsuario {
  email?: string;
  dni?: number;
  firstName?: string;
  lastName?: string;
  type?: string;
}



const Alumnos: React.FC = () => {
  const BACKEND_IP = "localhost";
  const BACKEND_PORT = "8000";
  const token = localStorage.getItem("token");

  const [alumnos, setAlumnos] = useState<Usuario[]>([]);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [tipoUsuario, setTipoUsuario] = useState<string>("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CambiosUsuario>({});

  const fetchAlumnos = () => {
    fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/users/all`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) =>
        setAlumnos(data.filter((u: Usuario) => u.userdetail?.type === "Alumno"))
      )
      .catch(() => setMensaje("No se pudieron cargar los alumnos."));
  };
  const [nuevoAlumno, setNuevoAlumno] = useState<InputUser>({
  username: '',
  password: '',
  email: '',
  dni: 0,
  firstName: '',
  lastName: '',
  type: 'Alumno',
});

const handleNuevoAlumnoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setNuevoAlumno({ ...nuevoAlumno, [e.target.name]: e.target.value });
};

const registrarAlumno = () => {
  fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/users/register/full`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(nuevoAlumno),
  })
    .then(res => res.ok ? res.json() : Promise.reject())
    .then(() => {
      setMensaje("Alumno registrado correctamente");
      fetchAlumnos();
      setNuevoAlumno({
        username: '',
        password: '',
        email: '',
        dni: 0,
        firstName: '',
        lastName: '',
        type: 'Alumno'
      });
      setTimeout(() => setMensaje(null), 3000);
    })
    .catch(() => setMensaje("Error al registrar alumno"));
};

  useEffect(() => {
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setTipoUsuario(payload.type);
      fetchAlumnos();
    }
  }, [token]);

  const eliminarUsuario = (id: number) => {
    if (!window.confirm("¿Eliminar este usuario?")) return;

    fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok && setAlumnos(alumnos.filter((a) => a.id !== id)))
      .catch(() => setMensaje("Error al eliminar el usuario."));
  };

  const iniciarEdicion = (usuario: Usuario) => {
    setEditandoId(usuario.id);
    setFormData({
      email: usuario.userdetail.email,
      dni: usuario.userdetail.dni,
      firstName: usuario.userdetail.firstName,
      lastName: usuario.userdetail.lastName,
    });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setFormData({});
  };

  const guardarCambios = (id: number) => {
    fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/users/${id}/details`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al actualizar");
        return res.json();
      })
      .then(() => {
        setMensaje("Usuario actualizado correctamente");
        setEditandoId(null);
        fetchAlumnos();
        setTimeout(() => setMensaje(null), 3000);
      })
      .catch(() => setMensaje("Error al actualizar el usuario."));
  };

  return (
    <div className="container-fluid mt-4">
      {mensaje && <div className="alert alert-info text-center">{mensaje}</div>}

      <div className="p-4 bg-light border rounded shadow-sm mb-4">
        <div className="d-flex justify-content-end mb-3">
          <button
            className="btn btn-outline-primary"
            data-bs-toggle="modal"
            data-bs-target="#agregarAlumnoModal"
          >
            ➕ Agregar Alumno
          </button>
        </div>
        <h5 className="text-center">Listado de Alumnos</h5>
        <div
          className="table-responsive"
          style={{ maxHeight: "400px", overflowY: "auto" }}
        >
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
              {alumnos.map((a) => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>{a.username}</td>
                  <td>
                    {editandoId === a.id ? (
                      <input
                        className="form-control form-control-sm"
                        value={formData.email || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    ) : (
                      a.userdetail.email
                    )}
                  </td>
                  <td>
                    {editandoId === a.id ? (
                      <input
                        className="form-control form-control-sm"
                        value={formData.dni || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dni: parseInt(e.target.value),
                          })
                        }
                      />
                    ) : (
                      a.userdetail.dni
                    )}
                  </td>
                  <td>
                    {editandoId === a.id ? (
                      <input
                        className="form-control form-control-sm"
                        value={formData.firstName || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            firstName: e.target.value,
                          })
                        }
                      />
                    ) : (
                      a.userdetail.firstName
                    )}
                  </td>
                  <td>
                    {editandoId === a.id ? (
                      <input
                        className="form-control form-control-sm"
                        value={formData.lastName || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                      />
                    ) : (
                      a.userdetail.lastName
                    )}
                  </td>
                  <td className="text-end">
                    {editandoId === a.id ? (
                      <>
                        <button
                          className="btn btn-sm btn-success me-2"
                          onClick={() => guardarCambios(a.id)}
                        >
                          💾 Guardar
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={cancelarEdicion}
                        >
                          ❌ Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn btn-sm border-secondary text-secondary me-2"
                          style={{
                            backgroundColor: "transparent",
                            transition: "0.2s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = "#f1f3f5")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "transparent")
                          }
                          onClick={() => iniciarEdicion(a)}
                        >
                          🖉 Editar
                        </button>
                        <button
                          className="btn btn-sm border-dark text-dark"
                          style={{
                            backgroundColor: "transparent",
                            transition: "0.2s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = "#f1f3f5")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "transparent")
                          }
                          onClick={() => eliminarUsuario(a.id)}
                        >
                          🗑️ Eliminar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="modal fade" id="agregarAlumnoModal" tabIndex={-1} aria-hidden="true">
  <div className="modal-dialog modal-lg">
  <div className="modal-content">
    <div className="modal-header">
      <h5 className="modal-title">Agregar Nuevo Alumno</h5>
      <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
    </div>
    <div className="modal-body">
      <div className="container-fluid">
        <div className="row g-3">
          {[
            { label: 'Usuario', name: 'username' },
            { label: 'Contraseña', name: 'password' },
            { label: 'Email', name: 'email' },
            { label: 'DNI', name: 'dni' },
            { label: 'Nombre', name: 'firstName' },
            { label: 'Apellido', name: 'lastName' }
          ].map((campo, i) => (
            <div className="col-md-6" key={i}>
              <label className="form-label">{campo.label}</label>
              <input
                type={campo.name === 'password' ? 'password' : campo.name === 'dni' ? 'number' : 'text'}
                className="form-control"
                name={campo.name}
                value={nuevoAlumno[campo.name as keyof InputUser]}
                onChange={handleNuevoAlumnoChange}
              />
            </div>
          ))}

          <div className="col-md-6">
            <label className="form-label">Tipo</label>
            <input type="text" className="form-control" value="Alumno" disabled />
          </div>
        </div>
      </div>
    </div>
    <div className="modal-footer">
      <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
      <button type="button" className="btn btn-primary" data-bs-dismiss="modal" onClick={registrarAlumno}>Registrar</button>
    </div>
  </div>
</div>
</div>
    </div>
  );
};

export default Alumnos;

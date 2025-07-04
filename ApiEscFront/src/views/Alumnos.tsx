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

function Alumnos() {
  const BACKEND_IP = "localhost";
  const BACKEND_PORT = "8000";

  const [alumnos, setAlumnos] = useState<Usuario[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [usuarioEnEdicion, setUsuarioEnEdicion] = useState<Usuario | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const [nuevoUsuario, setNuevoUsuario] = useState<NuevoUsuario>({
    username: '',
    password: '',
    email: '',
    dni: 0,
    firstName: '',
    lastName: '',
    type: 'Alumno',
  });

  const token = localStorage.getItem('token');
  const [tipoUsuario, setTipoUsuario] = useState<string>('');

  useEffect(() => {
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setTipoUsuario(payload.type);
    }
  }, [token]);

  useEffect(() => {
    fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/users/all`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAlumnos(data);
        } else {
          console.error("Los datos recibidos no son válidos.");
        }
      })
      .catch(error => console.error("Error al obtener los alumnos:", error));
  }, [tipoUsuario]);

  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => setMensaje(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  const eliminarUsuario = (id: number) => {
    if (!window.confirm('¿Eliminar este usuario?')) return;

    fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (res.ok) {
          setAlumnos(alumnos.filter(alumno => alumno.id !== id));
        } else {
          console.error("Error al eliminar el usuario.");
        }
      })
      .catch(error => console.error("Error al eliminar el usuario:", error));
  };

  const editarUsuario = (id: number) => {
    const usuario = alumnos.find(alumno => alumno.id === id);
    if (usuario) {
      setUsuarioEnEdicion(usuario);
      setMostrarModalEditar(true);
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!usuarioEnEdicion) return;
    const { name, value } = e.target;
    const updatedUserDetail = {
      ...usuarioEnEdicion.userdetail,
      [name]: name === "dni" ? Number(value) : value,
    };
    setUsuarioEnEdicion({ ...usuarioEnEdicion, userdetail: updatedUserDetail });
  };

  const guardarCambios = () => {
    if (!usuarioEnEdicion) return;

    fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/users/${usuarioEnEdicion.id}/details`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(usuarioEnEdicion.userdetail),
    })
      .then(res => {
        if (!res.ok) throw res;
        return res.json();
      })
      .then(() => {
        setMensaje('Usuario actualizado correctamente');
        setMostrarModalEditar(false);
        return fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/users/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      })
      .then(res => res.json())
      .then(data => setAlumnos(data))
      .catch(error => {
        console.error("Error al actualizar el usuario:", error);
        setMensaje('Error al actualizar el usuario');
      });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNuevoUsuario({ ...nuevoUsuario, [name]: name === 'dni' ? Number(value) : value });
  };

  const crearUsuario = () => {
    fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/users/register/full`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(nuevoUsuario),
    })
      .then(res => {
        if (!res.ok) throw res;
        setMensaje('Usuario creado exitosamente');
        setShowModal(false);
        setNuevoUsuario({
          username: '',
          password: '',
          email: '',
          dni: 0,
          firstName: '',
          lastName: '',
          type: 'Alumno',
        });
        return fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/users/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      })
      .then(res => res.json())
      .then(data => setAlumnos(data))
      .catch(error => {
        console.error("Error al crear el usuario:", error);
        setMensaje('Error al crear el usuario');
      });
  };

  return (
    <div className="container mt-5">
      <div className="p-4 mb-4 bg-success bg-opacity-10 border-start border-4 border-success rounded shadow-sm">
        <h2 className="text-success m-0 text-center">Gestión de Usuarios</h2>
      </div>

      {mensaje && <div className="alert alert-info text-center">{mensaje}</div>}

      <table className="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Email</th>
            <th>DNI</th>
            <th>Nombre</th>
            <th>Apellido</th>
            <th>Tipo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {alumnos.map(alumno => (
            <tr key={alumno.id}>
              <td>{alumno.id}</td>
              <td>{alumno.username}</td>
              <td>{alumno.userdetail.email}</td>
              <td>{alumno.userdetail.dni}</td>
              <td>{alumno.userdetail.firstName}</td>
              <td>{alumno.userdetail.lastName}</td>
              <td>{alumno.userdetail.type}</td>
              <td>
                <button className="btn btn-sm btn-primary me-2" onClick={() => editarUsuario(alumno.id)}>Editar</button>
                <button className="btn btn-sm btn-danger" onClick={() => eliminarUsuario(alumno.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="btn btn-success" style={{ position: 'fixed', bottom: '2rem', right: '2rem', borderRadius: '50%', width: '60px', height: '60px', fontSize: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'green', color: 'white', border: 'none', zIndex: 1050 }} onClick={() => setShowModal(true)}>+</button>

      {showModal && (
        <div className="modal show fade d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Nuevo Usuario</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <input className="form-control mb-2" name="username" placeholder="Username" value={nuevoUsuario.username} onChange={handleChange} />
                <input className="form-control mb-2" name="password" type="password" placeholder="Password" value={nuevoUsuario.password} onChange={handleChange} />
                <input className="form-control mb-2" name="email" placeholder="Email" value={nuevoUsuario.email} onChange={handleChange} />
                <input className="form-control mb-2" name="dni" placeholder="DNI" value={nuevoUsuario.dni} onChange={handleChange} />
                <input className="form-control mb-2" name="firstName" placeholder="Nombre" value={nuevoUsuario.firstName} onChange={handleChange} />
                <input className="form-control mb-2" name="lastName" placeholder="Apellido" value={nuevoUsuario.lastName} onChange={handleChange} />
                <select className="form-select" name="type" value={nuevoUsuario.type} onChange={handleChange}>
                  <option value="Alumno">Alumno</option>
                  <option value="Admin">Admin</option>
                  <option value="Profesor">Profesor</option>
                </select>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={crearUsuario}>Crear</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mostrarModalEditar && usuarioEnEdicion && (
        <div className="modal show fade d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Editar Usuario</h5>
                <button type="button" className="btn-close" onClick={() => setMostrarModalEditar(false)}></button>
              </div>
              <div className="modal-body">
                <input className="form-control mb-2" name="email" value={usuarioEnEdicion.userdetail.email} onChange={handleEditChange} />
                <input className="form-control mb-2" name="dni" value={usuarioEnEdicion.userdetail.dni} onChange={handleEditChange} />
                <input className="form-control mb-2" name="firstName" value={usuarioEnEdicion.userdetail.firstName} onChange={handleEditChange} />
                <input className="form-control mb-2" name="lastName" value={usuarioEnEdicion.userdetail.lastName} onChange={handleEditChange} />
                <select className="form-select mb-2" name="type" value={usuarioEnEdicion.userdetail.type} onChange={handleEditChange}>
                  <option value="Alumno">Alumno</option>
                  <option value="Admin">Admin</option>
                  <option value="Profesor">Profesor</option>
                </select>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setMostrarModalEditar(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={guardarCambios}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Alumnos;

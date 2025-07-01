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
  const [modoEditar, setModoEditar] = useState(false);
  const [usuarioEditandoId, setUsuarioEditandoId] = useState<number | null>(null);

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
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInModal {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setTipoUsuario(payload.type);
    }
  }, [token]);

  const fetchAlumnos = () => {
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
  };

  useEffect(fetchAlumnos, [tipoUsuario]);

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
    const alumno = alumnos.find(a => a.id === id);
    if (!alumno) return;

    setNuevoUsuario({
      username: alumno.username,
      password: '',
      email: alumno.userdetail.email,
      dni: alumno.userdetail.dni,
      firstName: alumno.userdetail.firstName,
      lastName: alumno.userdetail.lastName,
      type: alumno.userdetail.type,
    });
    setModoEditar(true);
    setUsuarioEditandoId(id);
    setShowModal(true);
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
        alert('Usuario creado exitosamente');
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
        fetchAlumnos();
      })
      .catch(error => {
        console.error("Error al crear el usuario:", error);
        alert('Error al crear el usuario');
      });
  };

  const actualizarUsuario = () => {
    if (usuarioEditandoId === null) return;

    fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/users/${usuarioEditandoId}/details`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(nuevoUsuario),
    })
      .then(res => {
        if (!res.ok) throw res;
        alert('Usuario actualizado correctamente');
        setShowModal(false);
        setModoEditar(false);
        setUsuarioEditandoId(null);
        fetchAlumnos();
      })
      .catch(error => {
        console.error("Error al actualizar el usuario:", error);
        alert('Error al actualizar el usuario');
      });
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4 text-center">Gestión de Usuarios</h2>
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

      <button
        className="btn btn-success"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          borderRadius: '8px',
          fontSize: '16px',
          padding: '10px 20px',
          backgroundColor: 'green',
          color: 'white',
          border: 'none',
          zIndex: 1050
        }}
        onClick={() => {
          setShowModal(true);
          setModoEditar(false);
          setNuevoUsuario({
            username: '',
            password: '',
            email: '',
            dni: 0,
            firstName: '',
            lastName: '',
            type: 'Alumno',
          });
        }}
      >
        Agregar Usuario
      </button>

      {showModal && (
        <div className="modal fade show" tabIndex={-1} role="dialog" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog" role="document">
            <div className="modal-content" style={{
              animation: 'fadeInModal 0.4s ease-out',
              border: '2px solid #3ab397',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(6px)',
              borderRadius: '15px',
            }}>
              <div className="modal-header">
                <h5 className="modal-title">{modoEditar ? 'Editar Usuario' : 'Nuevo Usuario'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <label className="form-label">USUARIO</label>
                <input className="form-control mb-2" name="username" placeholder="Username" value={nuevoUsuario.username} onChange={handleChange} disabled={modoEditar} />
                {!modoEditar && (
                  <>
                    <label className="form-label">CONTRASEÑA</label>
                    <input className="form-control mb-2" name="password" type="password" placeholder="Password" value={nuevoUsuario.password} onChange={handleChange} />
                  </>
                )}
                <label className="form-label">EMAIL</label>
                <input className="form-control mb-2" name="email" placeholder="Email" value={nuevoUsuario.email} onChange={handleChange} />
                <label className="form-label">DNI</label>
                <input className="form-control mb-2" name="dni" placeholder="DNI" value={nuevoUsuario.dni} onChange={handleChange} />
                <label className="form-label">NOMBRE</label>
                <input className="form-control mb-2" name="firstName" placeholder="Nombre" value={nuevoUsuario.firstName} onChange={handleChange} />
                <label className="form-label">APELLIDO</label>
                <input className="form-control mb-2" name="lastName" placeholder="Apellido" value={nuevoUsuario.lastName} onChange={handleChange} />
                <select className="form-select" name="type" value={nuevoUsuario.type} onChange={handleChange}>
                  <option value="Alumno">Alumno</option>
                  <option value="Admin">Admin</option>
                  <option value="Profesor">Profesor</option>
                </select>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={modoEditar ? actualizarUsuario : crearUsuario}>
                  {modoEditar ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Alumnos;

import React, { useEffect, useState } from 'react';

interface Pago {
  id: number;
  user_id: number;
  carrera_id: number;
  monto: number;
  mes: string;
}

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

interface NuevoPago {
  user_id: number;
  carrera_id: number;
  monto: number;
  mes: string;
}

interface Carreras {
  id: number;
  nombre: string;
  estado: string;
  user_id: number;
}

const Pagos: React.FC = () => {
  const BACKEND_IP = "localhost";
  const BACKEND_PORT = "8000";
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [alumnos, setAlumnos] = useState<Usuario[]>([]);
  const [carreras, setCarreras] = useState<Carreras[]>([]);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nuevoPago, setNuevoPago] = useState<NuevoPago>({
    user_id: 0,
    carrera_id: 0,
    monto: 0,
    mes: '',
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
    if (tipoUsuario === 'Admin') {
      //Fetch pagos
      fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/pago/todos`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setPagos(data);
          else setError("Los datos recibidos no son válidos.");
        })
        .catch(() => setError('No se pudieron cargar los pagos.'));
      //Fetch alumnos
      fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/users/all`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          const alumnos = data.filter((u: Usuario) => u.userdetail?.type === 'Alumno');
          setAlumnos(alumnos);
        })
        .catch(() => setError('No se pudieron cargar los alumnos.'));
      //Fetch carreras
      fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/carrera/todas`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {setCarreras(data);
          }
          else setError("Los datos recibidos no son válidos.");
        })
        .catch(() => setError('No se pudieron cargar las carreras.'));
    }
  }, [tipoUsuario]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const parsedValue = ['user_id', 'carrera_id', 'monto'].includes(name) ? Number(value) : value;
    setNuevoPago({ ...nuevoPago, [name]: parsedValue });
  };

  const crearPago = () => {
    setError(null);
    setMensaje(null);

    if (!nuevoPago.user_id || !nuevoPago.carrera_id || !nuevoPago.monto || !nuevoPago.mes) {
      setError('Todos los campos son obligatorios.');
      return;
    }
    if (nuevoPago.monto <= 0) { // O solo < 0 si quieres permitir 0
    setError('El monto del pago no puede ser 0.');
    return;
  }

    fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/nuevoPago`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(nuevoPago),
    })
      .then(res => {
        if (!res.ok) throw res;
        setMensaje('Pago agregado exitosamente.');
        setNuevoPago({ user_id: 0, carrera_id: 0, monto: 0, mes: '' });
        return fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/pago/todos`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      })
      .then(res => res.json())
      .then(data => setPagos(data))
      .catch(async err => {
        const errorData = await err.json();
        setError(errorData.detail || 'Error al crear el pago.');
      });
  };

  // Funcion eliminar pagos
  const eliminarPago = (id: number) => {
    if (!window.confirm('¿Eliminar este pago?')) return;

    fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/eliminarPago/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => {
        setMensaje('Pago eliminado correctamente.');
        setPagos(pagos.filter(p => p.id !== id));
      })
      .catch(() => setError('Error al eliminar el pago.'));
  };

  // Funcion editar pagos
  const editarPago = (pago: Pago) => {
    fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/editarPago/${pago.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(pago),
    })
      .then(() => setMensaje('Pago editado correctamente.'))
      .catch(() => setError('Error al editar el pago.'));
  };

  if (tipoUsuario !== 'Admin') {
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
      <h2 className="mb-4 text-center">Gestión de Pagos</h2>

      {mensaje && <div className="alert alert-success">{mensaje}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card mb-4">
        <div className="card-header">Nuevo Pago</div>
        <div className="card-body row g-3">
          <div className="col-md-3">
            <select
              className="form-select"
              name="user_id"
              value={nuevoPago.user_id}
              onChange={handleInputChange}
            >
              <option value={0}>Seleccionar alumno</option>
              {alumnos.map(alumno => (
                <option key={alumno.id} value={alumno.id}>
                  {alumno.userdetail.firstName} {alumno.userdetail.lastName}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            
            <select
              id="carreraSelect"
              className="form-select"
              name="carrera_id"
              value={nuevoPago.carrera_id}
              onChange={handleInputChange}
            >
              <option value={0}>Seleccionar carrera</option>
              {
                // Paso 1: Obtener solo los nombres únicos de las carreras
                Array.from(new Set(carreras.map(c => c.nombre)))
                .map(nombreUnico => {
                  // Paso 2: Encontrar el objeto de carrera original para obtener su ID
                  // Aquí asumimos que si el nombre es único, queremos el ID de la primera carrera con ese nombre.
                  // Si 'Programación' tiene el ID 10 en un objeto y ID 11 en otro,
                  // esto tomará el ID del primer objeto 'Programación' que encuentre.
                  const carreraOriginal = carreras.find(c => c.nombre === nombreUnico);

                  // Esto es una salvaguarda, aunque en este caso 'carreraOriginal'
                  // siempre debería existir si 'nombreUnico' proviene de 'carreras'.
                  if (!carreraOriginal) return null;

                  return (
                    <option key={carreraOriginal.id} value={carreraOriginal.id}>
                      {nombreUnico}
                    </option>
                  );
                })
              }
            </select>
          </div>
          <div className="col-md-1">
            <input
              type="input"
              name="monto"
              className="form-control"
              placeholder="Monto"
              value={nuevoPago.monto}
              onChange={handleInputChange}
            />
          </div>
          <div className="col-md-3">
            <input
              type="date"
              name="mes"
              className="form-control"
              value={nuevoPago.mes}
              onChange={handleInputChange}
            />
          </div>
          <div className="col-md-2 d-grid">
            <button className="btn btn-success" onClick={crearPago}>
              Registrar
            </button>
          </div>
        </div>
      </div>

      <h4>Pagos Registrados</h4>
      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead className="table-light">
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Carrera</th>
              <th>Monto</th>
              <th>Mes</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pagos.length > 0 ? (
              pagos.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>
                    {(() => {
                              const user = alumnos.find(a => a.id === p.user_id);
                              return user
                              ? `${user.userdetail.firstName} ${user.userdetail.lastName}`
                              : `ID: ${p.user_id}`;
                            }
                    )()}
                  </td>
                  <td>{carreras.find(c=> c.id === p.carrera_id)?.nombre || `ID: ${p.carrera_id}`}</td>
                  <td>{p.monto}</td>
                  <td>{p.mes}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-primary me-2"
                      onClick={() => editarPago(p)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => eliminarPago(p.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center">
                  No hay pagos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Pagos;

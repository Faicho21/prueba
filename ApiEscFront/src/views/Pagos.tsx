import React, { useEffect, useState } from "react";
import Select from "react-select";
import { motion, AnimatePresence } from "framer-motion"; // 👈 Import de framer-motion

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
    mes: "",
  });

  const [pagoSeleccionado, setPagoSeleccionado] = useState<Pago | null>(null);
  const [mostrarModal, setMostrarModal] = useState<boolean>(false);
  const [tipoUsuario, setTipoUsuario] = useState<string>("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setTipoUsuario(payload.type);
    }
  }, [token]);

  useEffect(() => {
    if (tipoUsuario === "Admin") {
      fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/pago/todos`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setPagos(Array.isArray(data) ? data : []))
        .catch(() => setError("No se pudieron cargar los pagos."));

      fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/users/all`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          const alumnosFiltrados = data.filter(
            (u: Usuario) => u.userdetail?.type === "Alumno"
          );
          setAlumnos(alumnosFiltrados);
        })
        .catch(() => setError("No se pudieron cargar los alumnos."));

      fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/carrera/todas`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setCarreras(Array.isArray(data) ? data : []))
        .catch(() => setError("No se pudieron cargar las carreras."));
    }
  }, [tipoUsuario]);

  const opcionesAlumnos = alumnos.map((alumno) => ({
    value: alumno.id,
    label: `${alumno.userdetail.firstName} ${alumno.userdetail.lastName}`,
  }));

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const parsedValue = ["user_id", "carrera_id", "monto"].includes(name)
      ? Number(value)
      : value;
    setNuevoPago({ ...nuevoPago, [name]: parsedValue });
  };

  const crearPago = () => {
    setError(null);
    setMensaje(null);

    if (
      !nuevoPago.user_id ||
      !nuevoPago.carrera_id ||
      !nuevoPago.monto ||
      !nuevoPago.mes
    ) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/nuevoPago`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(nuevoPago),
    })
      .then((res) => {
        if (!res.ok) throw res;
        setMensaje("Pago agregado exitosamente.");
        setNuevoPago({ user_id: 0, carrera_id: 0, monto: 0, mes: "" });
        return fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/pago/todos`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      })
      .then((res) => res.json())
      .then((data) => setPagos(data))
      .catch(async (err) => {
        const errorData = await err.json();
        setError(errorData.detail || "Error al crear el pago.");
      });
  };

  const eliminarPago = (id: number) => {
    if (!window.confirm("¿Eliminar este pago?")) return;

    fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/eliminarPago/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => {
        setMensaje("Pago eliminado correctamente.");
        setPagos(pagos.filter((p) => p.id !== id));
      })
      .catch(() => setError("Error al eliminar el pago."));
  };

  const abrirModalEdicion = (pago: Pago) => {
    setPagoSeleccionado({ ...pago });
    setMostrarModal(true);
  };

  const handleEditarPagoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (!pagoSeleccionado) return;
    const { name, value } = e.target;
    const parsedValue = ["user_id", "carrera_id", "monto"].includes(name)
      ? Number(value)
      : value;
    setPagoSeleccionado({ ...pagoSeleccionado, [name]: parsedValue });
  };

  const guardarEdicionPago = () => {
    if (!pagoSeleccionado) return;

    fetch(
      `http://${BACKEND_IP}:${BACKEND_PORT}/editarPago/${pagoSeleccionado.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(pagoSeleccionado),
      }
    )
      .then(() => {
        setMensaje("Pago editado correctamente.");
        setMostrarModal(false);
        return fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/pago/todos`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      })
      .then((res) => res.json())
      .then((data) => setPagos(data))
      .catch(() => setError("Error al editar el pago."));
  };

  if (tipoUsuario !== "Admin") {
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
      <motion.div
        className="p-4 mb-4 bg-success bg-opacity-10 border-start border-4 border-success rounded shadow-sm"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-success m-0 text-center">Gestión de Pagos</h2>
      </motion.div>

      {mensaje && <div className="alert alert-success">{mensaje}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card mb-4">
        <div className="card-header">Nuevo Pago</div>
        <div className="card-body row g-3">
          <div className="col-md-4">
            <Select
              options={opcionesAlumnos}
              placeholder="Buscar alumno..."
              onChange={(selectedOption) =>
                setNuevoPago({
                  ...nuevoPago,
                  user_id: selectedOption?.value || 0,
                })
              }
              value={
                opcionesAlumnos.find(
                  (opt) => opt.value === nuevoPago.user_id
                ) || null
              }
              isClearable
            />
          </div>

          <div className="col-md-3">
            <select
              className="form-select"
              name="carrera_id"
              value={nuevoPago.carrera_id}
              onChange={handleInputChange}
            >
              <option value={0}>Seleccionar carrera</option>
              {carreras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          
              <div className="col-md-1">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                name="monto"
                className="form-control"
                placeholder="MONTO"
                value={nuevoPago.monto === 0 ? '' : nuevoPago.monto}
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

          <div className="col-md-1 d-grid">
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
              pagos.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>
                    {alumnos.find((a) => a.id === p.user_id)?.userdetail
                      ?.firstName || "ID: " + p.user_id}
                  </td>
                  <td>
                    {carreras.find((c) => c.id === p.carrera_id)?.nombre ||
                      "ID: " + p.carrera_id}
                  </td>
                  <td>{p.monto}</td>
                  <td>{p.mes}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-primary me-2"
                      onClick={() => abrirModalEdicion(p)}
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

      {/* ✅ Modal con animación */}
      <AnimatePresence>
        {mostrarModal && pagoSeleccionado && (
          <motion.div
            className="modal d-block"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
          >
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Editar Pago</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setMostrarModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <Select
                    options={opcionesAlumnos}
                    placeholder="Buscar alumno..."
                    onChange={(selectedOption) =>
                      setPagoSeleccionado({
                        ...pagoSeleccionado,
                        user_id: selectedOption?.value || 0,
                      })
                    }
                    value={
                      opcionesAlumnos.find(
                        (opt) => opt.value === pagoSeleccionado.user_id
                      ) || null
                    }
                    isClearable
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    name="monto"
                    className="form-control"
                    placeholder="Monto"
                    value={nuevoPago.monto === 0 ? "" : nuevoPago.monto}
                    onChange={(e) => {
                      const valor = e.target.value;
                      if (/^\d*$/.test(valor)) {
                        setNuevoPago({ ...nuevoPago, monto: Number(valor) });
                      }
                    }}
                  />

                  <input
                    type="date"
                    className="form-control mb-2"
                    name="mes"
                    value={pagoSeleccionado.mes}
                    onChange={handleEditarPagoChange}
                  />
                  <select
                    className="form-select"
                    name="carrera_id"
                    value={pagoSeleccionado.carrera_id}
                    onChange={handleEditarPagoChange}
                  >
                    <option value={0}>Seleccionar carrera</option>
                    {carreras.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setMostrarModal(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={guardarEdicionPago}
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Pagos;

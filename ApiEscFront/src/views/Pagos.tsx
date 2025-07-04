import React, { useEffect, useState } from "react";
import Select from "react-select";
import { motion, AnimatePresence } from "framer-motion";

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
  const token = localStorage.getItem("token");

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
  const [tipoUsuario, setTipoUsuario] = useState<string>("");
  const [pagoSeleccionado, setPagoSeleccionado] = useState<Pago | null>(null);
  const [mostrarModal, setMostrarModal] = useState<boolean>(false);

  useEffect(() => {
    if (mensaje || error) {
      const timer = setTimeout(() => {
        setMensaje(null);
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [mensaje, error]);

  useEffect(() => {
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setTipoUsuario(payload.type);

      fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/pago/todos`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setPagos(Array.isArray(data) ? data : []));

      fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/users/all`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setAlumnos(data.filter((u: Usuario) => u.userdetail?.type === "Alumno")));

      fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/carrera/todas`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setCarreras(Array.isArray(data) ? data : []));
    }
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNuevoPago({ ...nuevoPago, [name]: name === "monto" ? Number(value) : value });
  };

  const crearPago = () => {
    if (!nuevoPago.user_id || !nuevoPago.carrera_id || !nuevoPago.monto || !nuevoPago.mes) {
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
      .then((res) => res.json())
      .then(() => {
        setMensaje("Pago creado correctamente.");
        setNuevoPago({ user_id: 0, carrera_id: 0, monto: 0, mes: "" });
        return fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/pago/todos`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      })
      .then((res) => res.json())
      .then((data) => setPagos(data));
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
      });
  };

  const abrirEdicion = (pago: Pago) => {
    setPagoSeleccionado(pago);
    setMostrarModal(true);
  };

  const guardarEdicion = () => {
    if (!pagoSeleccionado) return;

    fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/editarPago/${pagoSeleccionado.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(pagoSeleccionado),
    })
      .then(res => res.json())
      .then(() => {
        setMensaje("Pago editado correctamente.");
        setMostrarModal(false);
        return fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/pago/todos`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      })
      .then(res => res.json())
      .then((data) => setPagos(data));
  };

  return (
    <div className="container-fluid mt-4">
      {mensaje && <div className="alert alert-info text-center">{mensaje}</div>}
      {error && <div className="alert alert-danger text-center">{error}</div>}

      <div className="p-4 bg-light border rounded shadow-sm mb-4">
        <h5>Nuevo Pago</h5>
        <div className="row g-3 align-items-end">
          <div className="col-md-4">
            <label className="form-label">Alumno</label>
            <Select
              options={alumnos.map((a) => ({ value: a.id, label: `${a.userdetail.firstName} ${a.userdetail.lastName}` }))}
              placeholder="Alumno"
              value={alumnos.find((a) => a.id === nuevoPago.user_id) ? { value: nuevoPago.user_id, label: `${alumnos.find((a) => a.id === nuevoPago.user_id)?.userdetail.firstName} ${alumnos.find((a) => a.id === nuevoPago.user_id)?.userdetail.lastName}` } : null}
              onChange={(option) => setNuevoPago({ ...nuevoPago, user_id: option?.value || 0 })}
              isClearable
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Carrera</label>
            <select className="form-select" name="carrera_id" value={nuevoPago.carrera_id} onChange={handleChange}>
              <option value={0}>Seleccionar carrera</option>
              {carreras.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label">Monto</label>
            <input
              type="number"
              name="monto"
              className="form-control"
              placeholder="MONTO"
              value={nuevoPago.monto || ""}
              onChange={handleChange}
              style={{ appearance: "none", WebkitAppearance: "none", MozAppearance: "textfield" }}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Fecha de pago</label>
            <input
              type="date"
              name="mes"
              className="form-control"
              value={nuevoPago.mes}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-1">
            <label className="form-label invisible">Crear</label>
            <button
              className="btn border-success text-success w-100"
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f3f5'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              onClick={crearPago}
            >
              Crear
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 bg-light border rounded shadow-sm">
        <h5>Pagos Registrados</h5>
        <div className="table-responsive" style={{ maxHeight: "400px", overflowY: "auto" }}>
          <table className="table table-sm table-bordered">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Alumno</th>
                <th>Carrera</th>
                <th>Monto</th>
                <th>Mes</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{alumnos.find((a) => a.id === p.user_id)?.userdetail.firstName || `ID: ${p.user_id}`}</td>
                  <td>{carreras.find((c) => c.id === p.carrera_id)?.nombre || `ID: ${p.carrera_id}`}</td>
                  <td>{p.monto}</td>
                  <td>{p.mes}</td>
                  <td className="text-end">
                    <button
                      className="btn btn-sm border-secondary text-secondary me-2"
                      style={{ backgroundColor: 'transparent', transition: '0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f3f5'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      onClick={() => abrirEdicion(p)}
                    >
                      🖉 Editar
                    </button>
                    <button
                      className="btn btn-sm border-dark text-dark"
                      style={{ backgroundColor: 'transparent', transition: '0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f3f5'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      onClick={() => eliminarPago(p.id)}
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

      <AnimatePresence>
        {mostrarModal && pagoSeleccionado && (
          <motion.div
            className="modal d-block"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Editar Pago</h5>
                  <button type="button" className="btn-close" onClick={() => setMostrarModal(false)}></button>
                </div>
                <div className="modal-body">
                  <input
                    type="number"
                    className="form-control mb-2"
                    placeholder="Monto"
                    value={pagoSeleccionado.monto}
                    onChange={(e) => setPagoSeleccionado({ ...pagoSeleccionado, monto: Number(e.target.value) })}
                  />
                  <input
                    type="month"
                    className="form-control mb-2"
                    value={pagoSeleccionado.mes}
                    onChange={(e) => setPagoSeleccionado({ ...pagoSeleccionado, mes: e.target.value })}
                  />
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setMostrarModal(false)}>
                    Cancelar
                  </button>
                  <button className="btn btn-primary" onClick={guardarEdicion}>
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

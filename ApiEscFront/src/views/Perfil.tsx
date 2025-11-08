import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { useNavigate } from "react-router-dom";

function Perfil() {
  const BACKEND_IP = "localhost";
  const BACKEND_PORT = "8000";
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [acciones, setAcciones] = useState<any[]>([]);
  const [ultimoPago, setUltimoPago] = useState<any | null>(null);

  const navigate = useNavigate();

  const secciones = [
    { tipo: "Creaciones", titulo: "Carreras recientes" },
    { tipo: "Inscripciones", titulo: "Nuevas inscripciones" },
    { tipo: "Pagos", titulo: "Pagos recientes" },
    { tipo: "Usuarios", titulo: "Nuevos usuarios" },
  ];

  const rutasPorTipo: { [key: string]: string } = {
    Creaciones: "/carreras",
    Inscripciones: "/carreras",
    Pagos: "/pagos",
    Usuarios: "/alumnos",
  };

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes slideFadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .fade-in-green {
        border: none;
        animation: slideFadeIn 0.6s ease-out forwards;
        border-radius: 1s2px;
        background-color: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(6px);
        padding: 2rem;
        height: 100%;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setFormData({
        firstName: parsedUser.firstName,
        lastName: parsedUser.lastName,
        email: parsedUser.email,
      });
    }

    const token = localStorage.getItem("token");

    const fetchUltimosDatos = async () => {
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [carreraRes, inscripcionRes, pagoRes, usuarioRes] =
          await Promise.all([
            fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/carrera/ultima`, {
              headers,
            }),
            fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/inscripcion/ultima`, {
              headers,
            }),
            fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/pago/ultimo`, {
              headers,
            }),
            fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/users/ultimo`, {
              headers,
            }),
          ]);

        const carrera = await carreraRes.json();
        const inscripcion = await inscripcionRes.json();
        const pago = await pagoRes.json();
        const usuario = await usuarioRes.json();

        const accionesReales = [];

        if (carrera?.nombre) {
          accionesReales.push({
            id: 1,
            tipo: "Creaciones",
            descripcion: `Se creó la carrera ${carrera.nombre}`,
            fecha: new Date().toISOString().split("T")[0],
          });
        }

        if (inscripcion?.alumno_nombre && inscripcion?.carrera_nombre) {
          accionesReales.push({
            id: 2,
            tipo: "Inscripciones",
            descripcion: `Se inscribió a ${inscripcion.alumno_nombre} en ${inscripcion.carrera_nombre}`,
            fecha: new Date().toISOString().split("T")[0],
          });
        }

        if (pago?.alumno && pago?.monto && pago?.mes) {
          accionesReales.push({
            id: 3,
            tipo: "Pagos",
            descripcion: `Se registró pago de cuota de ${pago.alumno} por $${pago.monto}`,
            fecha: pago.fecha || new Date().toISOString().split("T")[0],
          });
        }

        if (usuario?.firstName && usuario?.lastName) {
          accionesReales.push({
            id: 4,
            tipo: "Usuarios",
            descripcion: `Se creó el usuario ${usuario.firstName} ${usuario.lastName}`,
            fecha:
              usuario.fecha_creacion || new Date().toISOString().split("T")[0],
          });
        }

        setAcciones(accionesReales);
        setUltimoPago(pago);
        console.log("Acciones cargadas:", accionesReales);
      } catch (error) {
        console.error("Error al cargar acciones reales:", error);
      }
    };

    fetchUltimosDatos();
  }, []);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    const updatedUser = { ...user, ...formData };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  if (!user) {
    return <div className="text-center mt-5">Cargando perfil...</div>;
  }

  return (
    <div className="container-fluid py-4 min-vh-100 d-flex flex-column">
      <div className="row g-4 flex-grow-1">
        <div className="col-12 col-lg-4">
          <div className="fade-in-green text-center h-100 d-flex flex-column justify-content-between">
            <div>
              <h2 className="mb-3 text-success fw-bold">Perfil</h2>
              <p>
                <strong>Nombre:</strong> {user.firstName} {user.lastName}
              </p>
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              <p>
                <strong>Tipo de Usuario:</strong> {user.type}
              </p>
              <hr className="my-4" />
              <p className="text-muted">
                Accedé a la sección "Carreras" para gestionar inscripciones,
                pagos y más.
              </p>
            </div>
            <button
              className="btn btn-outline-secondary mt-3"
              data-bs-toggle="modal"
              data-bs-target="#editarPerfilModal"
            >
              Editar Perfil
            </button>
          </div>
        </div>

        <div className="col-12 col-lg-8">
          <div className="row g-3">
            {user.type === "Admin" &&
              secciones.map((seccion) => (
                <div key={seccion.tipo} className="col-12">
                  <div className="fade-in-green">
                    <h5 className="text-dark fw-bold mb-3">{seccion.titulo}</h5>
                    <ul className="list-group">
                      {acciones
                        .filter((a) => a.tipo === seccion.tipo)
                        .map((accion) => (
                          <li
                            key={accion.id}
                            className="list-group-item d-flex justify-content-between align-items-center"
                          >
                            {accion.descripcion}
                            <div className="d-flex align-items-center gap-2">
                              <span className="badge bg-secondary mb-0">
                                {accion.fecha}
                              </span>
                              <button
                                onClick={() =>
                                  navigate(rutasPorTipo[seccion.tipo])
                                }
                                className="btn btn-sm btn-outline-success px-2 py-0"
                                style={{
                                  fontSize: "0.75rem",
                                  borderRadius: "999px",
                                }}
                              >
                                ver
                              </button>
                            </div>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              ))}

            {user.type === "Alumno" && ( // Quitamos '&& ultimoPago' de aquí para poder mostrar el mensaje
              <div className="col-12">
                <div className="fade-in-green">
                  <h5 className="text-dark fw-bold mb-3">Tu último pago</h5>
                  <ul className="list-group">
                    {/* Aquí agregamos la condición para mostrar el pago o el mensaje */}
                    {ultimoPago ? (
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        {`Mes: ${"Julio"} - Monto: $ 10000
                        - Carrera: ${"Ingeniería Civil"}`}
                       
                      </li>
                    ) : (
                      <li className="list-group-item text-muted">
                        No se encontraron pagos recientes.
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer
        className="text-center py-3 border-top mt-5"
        style={{ backgroundColor: "#f8f9fa" }}
      >
        <small>
          Colegio Secundario Mariano Moreno | Av. Libertad 1234, Buenos Aires |
          (011) 1234-5678 | contacto@marianomoreno.edu.ar
        </small>
      </footer>

      <div
        className="modal fade"
        id="editarPerfilModal"
        tabIndex={-1}
        aria-labelledby="editarPerfilModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <form onSubmit={handleSubmit}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="editarPerfilModalLabel">
                  Editar Perfil
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Cerrar"
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Nombre</label>
                  <input
                    type="text"
                    className="form-control"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Apellido</label>
                  <input
                    type="text"
                    className="form-control"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-bs-dismiss="modal"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  data-bs-dismiss="modal"
                >
                  Guardar cambios
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Perfil;

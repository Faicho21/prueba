import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

function Perfil() {
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [acciones, setAcciones] = useState<any[]>([]);

  useEffect(() => {
    const style = document.createElement('style');
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
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setFormData({
        firstName: parsedUser.firstName,
        lastName: parsedUser.lastName,
        email: parsedUser.email
      });
    }

    const accionesSimuladas = [
      { id: 1, tipo: 'Creaciones', descripcion: 'Creó la carrera Ingeniería en Software', fecha: '2025-07-03' },
      { id: 2, tipo: 'Inscripciones', descripcion: 'Inscribió a Juan Pérez en Contador Público', fecha: '2025-07-02' },
      { id: 3, tipo: 'Pagos', descripcion: 'Registró pago de cuota de María López', fecha: '2025-07-01' },
      { id: 4, tipo: 'Usuarios', descripcion: 'Creó usuario Pedro García', fecha: '2025-06-30' },
    ];
    setAcciones(accionesSimuladas);
  }, []);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    const updatedUser = { ...user, ...formData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  if (!user) {
    return <div className="text-center mt-5">Cargando perfil...</div>;
  }

  const secciones = ['Creaciones', 'Inscripciones', 'Pagos', 'Usuarios'];

  return (
    <div className="container-fluid py-4 min-vh-100 d-flex flex-column">
      <div className="row g-4 flex-grow-1">
        <div className="col-12 col-lg-4">
          <div className="fade-in-green text-center h-100 d-flex flex-column justify-content-between">
            <div>
              <h2 className="mb-3 text-success fw-bold">Perfil</h2>
              <p><strong>Nombre:</strong> {user.firstName} {user.lastName}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Tipo de Usuario:</strong> {user.type}</p>
              <hr className="my-4" />
              <p className="text-muted">Accedé a la sección "Carreras" para gestionar inscripciones, pagos y más.</p>
            </div>
            <button className="btn btn-outline-secondary mt-3" data-bs-toggle="modal" data-bs-target="#editarPerfilModal">Editar Perfil</button>
          </div>
        </div>

        <div className="col-12 col-lg-8">
          <div className="row g-3">
            {secciones.map((tipo) => (
              <div key={tipo} className="col-12">
                <div className="fade-in-green">
                  <h5 className="text-dark fw-bold mb-3">{`Últimas ${tipo.toLowerCase()}`}</h5>
                  <ul className="list-group">
                    {acciones.filter(a => a.tipo === tipo).map((accion) => (
                      <li key={accion.id} className="list-group-item d-flex justify-content-between align-items-center">
                        {accion.descripcion}
                        <span className="badge bg-secondary">{accion.fecha}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="text-center py-3 border-top mt-5" style={{ backgroundColor: '#f8f9fa' }}>
        <small>
          Colegio Secundario Mariano Moreno | Av. Libertad 1234, Buenos Aires |
          (011) 1234-5678 | contacto@marianomoreno.edu.ar
        </small>
      </footer>

      <div className="modal fade" id="editarPerfilModal" tabIndex={-1} aria-labelledby="editarPerfilModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <form onSubmit={handleSubmit}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="editarPerfilModalLabel">Editar Perfil</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Nombre</label>
                  <input type="text" className="form-control" name="firstName" value={formData.firstName} onChange={handleChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Apellido</label>
                  <input type="text" className="form-control" name="lastName" value={formData.lastName} onChange={handleChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" className="btn btn-success" data-bs-dismiss="modal">Guardar cambios</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Perfil;

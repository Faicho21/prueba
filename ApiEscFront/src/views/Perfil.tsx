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
  }, []);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    // Aquí va la lógica para enviar los datos al backend
    console.log('Datos actualizados:', formData);
    // Simulamos el cambio en el estado local (opcional)
    setUser({ ...user, ...formData });
    localStorage.setItem('user', JSON.stringify({ ...user, ...formData }));
  };

  if (!user) {
    return <div className="text-center mt-5">Cargando perfil...</div>;
  }

  return (
    <div
      className="d-flex flex-column min-vh-100"
      style={{
        backgroundImage: `url('/colegio.png')`,
        backgroundSize: '100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="flex-grow-1 d-flex justify-content-center align-items-center">
        <div
          className="card p-4 shadow-lg text-center"
          style={{
            maxWidth: '500px',
            width: '90%',
            backgroundColor: 'rgba(255,255,255,0.95)',
          }}
        >
          <h2 className="mb-4">Perfil</h2>
          <p><strong>Nombre:</strong> {user.firstName} {user.lastName}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Tipo de Usuario:</strong> {user.type}</p>

          {/* Botón para abrir modal */}
          <button
            className="btn btn-primary mt-3"
            data-bs-toggle="modal"
            data-bs-target="#editarPerfilModal"
          >
            Editar Perfil
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer
        className="text-center py-3 border-top"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
        }}
      >
        <small>
          Colegio Secundario Mariano Moreno | Av. Libertad 1234, Buenos Aires |
          (011) 1234-5678 | contacto@marianomoreno.edu.ar
        </small>
      </footer>

      {/* Modal Bootstrap */}
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
                <h5 className="modal-title" id="editarPerfilModalLabel">Editar Perfil</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
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

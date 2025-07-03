import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

function Perfil() {
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [showMessage, setShowMessage] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideFadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .fade-in-green {
        animation: slideFadeIn 0.6s ease-out forwards;
        border: 2px solid #3ab397;
        border-radius: 15px;
        background-color: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(6px);
        padding: 2rem;
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
        firstName: parsedUser.userdetail?.firstName || '',
        lastName: parsedUser.userdetail?.lastName || '',
        email: parsedUser.userdetail?.email || '',
      });
    }
  }, []);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token || !user?.id) return;

    try {
      const response = await fetch(`http://localhost:8000/users/${user.id}/details`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error("Error al actualizar perfil");

      const updated = {
        ...user,
        userdetail: {
          ...user.userdetail,
          ...formData
        }
      };

      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      setLastUpdated(new Date().toLocaleString());
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    } catch (error) {
      alert("No se pudo actualizar el perfil");
      console.error(error);
    }
  };

  const handlePasswordChange = async () => {
    if (!user?.id || !newPassword || !confirmPassword) {
      alert("Completá todos los campos");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    const actual = prompt("Por seguridad, ingresá tu contraseña actual:");
    if (!actual) return;

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`http://localhost:8000/users/${user.id}/cambiar-password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ actual, nueva: newPassword }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Error al cambiar contraseña");
      }

      alert("Contraseña actualizada exitosamente");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      alert("Error: " + error.message);
      console.error(error);
    }
  };

  if (!user) {
    return <div className="text-center mt-5">Cargando perfil...</div>;
  }

  const getBadgeColor = (type: string) => {
    if (type === "Admin") return "bg-danger";
    if (type === "Alumno") return "bg-success";
    if (type === "Profesor") return "bg-primary";
    return "bg-secondary";
  };

  return (
    <div
      className="d-flex flex-column min-vh-100"
      style={{
        backgroundImage: `url('/colegio.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="flex-grow-1 d-flex justify-content-center align-items-center">
        <div className="fade-in-green text-center" style={{ maxWidth: '500px', width: '90%' }}>
          <h2 className="mb-4 text-success fw-bold">Perfil</h2>
          <p><strong>Nombre:</strong> {user.userdetail?.firstName} {user.userdetail?.lastName}</p>
          <p><strong>Email:</strong> {user.userdetail?.email}</p>
          <p>
            <strong>Tipo de Usuario:</strong>{" "}
            <span className={`badge ${getBadgeColor(user.userdetail?.type)} text-white`}>
              {user.userdetail?.type}
            </span>
          </p>
          {lastUpdated && <p className="text-muted"><em>Última modificación: {lastUpdated}</em></p>}

          {showMessage && (
            <div className="alert alert-success mt-3 py-2">
              Perfil actualizado correctamente
            </div>
          )}

          <button
            className="btn btn-success mt-3"
            data-bs-toggle="modal"
            data-bs-target="#editarPerfilModal"
          >
            Editar Perfil
          </button>

          <button
            className="btn btn-outline-secondary mt-2 ms-2"
            data-bs-toggle="modal"
            data-bs-target="#cambiarPasswordModal"
          >
            Cambiar Contraseña
          </button>
        </div>
      </div>

      <footer className="text-center py-3 border-top bg-light bg-opacity-75">
        <small>
          Colegio Secundario Mariano Moreno | Av. Libertad 1234, Buenos Aires |
          (011) 1234-5678 | contacto@marianomoreno.edu.ar
        </small>
      </footer>

      {/* Modal editar perfil */}
      <div className="modal fade" id="editarPerfilModal" tabIndex={-1}>
        <div className="modal-dialog">
          <form onSubmit={handleSubmit}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Editar Perfil</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
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

      {/* Modal cambiar contraseña (real) */}
      <div className="modal fade" id="cambiarPasswordModal" tabIndex={-1}>
        <div className="modal-dialog">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handlePasswordChange();
            }}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Cambiar Contraseña</h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label>Nueva Contraseña</label>
                  <input
                    type="password"
                    className="form-control"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label>Confirmar Contraseña</label>
                  <input
                    type="password"
                    className="form-control"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <small className="text-muted">Se te pedirá la contraseña actual al confirmar.</small>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-bs-dismiss="modal"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success">
                  Guardar nueva contraseña
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

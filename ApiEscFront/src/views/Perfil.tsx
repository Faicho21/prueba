import React, { useEffect, useState } from 'react';

function Perfil() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  if (!user) {
    return <div className="text-center mt-5">Cargando perfil...</div>;
  }

  return (
      <div
        className="d-flex flex-column min-vh-100"
        style={{
          backgroundImage: `url('/colegio.png')`,
          backgroundSize: '100%',              // ← 🔁 Acá se aleja
          backgroundPosition: 'center',        // Opcional: podés ajustar tipo 'center top'
          backgroundRepeat: 'no-repeat',
        }}
      >
      {/* Contenido centrado */}
      <div className="flex-grow-1 d-flex justify-content-center align-items-center">
        <div
          className="card p-4 shadow-lg text-center"
          style={{
            maxWidth: '500px',
            width: '90%',
            backgroundColor: 'rgba(255,255,255,0.95)',
          }}
        >
          <h2 className="mb-4">Perfil de Usuario</h2>
          <p><strong>Nombre:</strong> {user.firstName} {user.lastName}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Tipo de Usuario:</strong> {user.type}</p>
        </div>
      </div>

      {/* Footer fijo abajo */}
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
    </div>
  );
}

export default Perfil;

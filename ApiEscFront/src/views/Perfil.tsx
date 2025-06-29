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
    return <div>Cargando perfil...</div>;
  }

  return (
    <div className="container mt-5">
      <h1>Perfil de Usuario</h1>
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Información del Usuario</h5>
          <p><strong>Nombre:</strong> {user.firstName} {user.lastName}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Tipo de Usuario:</strong> {user.type}</p>
        </div>
      </div>
    </div>
  );
}

export default Perfil;
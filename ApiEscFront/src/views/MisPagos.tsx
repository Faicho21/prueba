// Vista MisPagos para el Alumno con opción de exportar a PDF
import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Pago {
  id: number;
  carrera_id: number;
  monto: number;
  mes: string;
  carrera?: {
    nombre: string;
  };
}

const MisPagos: React.FC = () => {
  const BACKEND_IP = "localhost";
  const BACKEND_PORT = "8000";
  const token = localStorage.getItem('token');

  const [pagos, setPagos] = useState<Pago[]>([]);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [tipoUsuario, setTipoUsuario] = useState<string>("");
  const [nombreAlumno, setNombreAlumno] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");

  useEffect(() => {
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setTipoUsuario(payload.type);
      setNombreAlumno(payload.username || "Alumno");

      const userLocal = localStorage.getItem("user");
      if (userLocal) {
        const user = JSON.parse(userLocal);
        setFirstName(user.firstName || "");
        setLastName(user.lastName || "");
      }
    }
  }, [token]);

  useEffect(() => {
    if (tipoUsuario === 'Alumno') {
      fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/pago/mis_pagos`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => {
          if (!res.ok) throw new Error("Error al obtener los pagos.");
          return res.json();
        })
        .then(data => setPagos(data))
        .catch(error => {
          console.error(error);
          setMensaje("No se pudieron cargar tus pagos.");
        });
    }
  }, [tipoUsuario]);

  const exportarPDF = () => {
    const fechaActual = new Date().toLocaleDateString();
    const doc = new jsPDF();
    doc.text(`Nombre: ${firstName}`, 14, 10);
    doc.text(`Apellido: ${lastName}`, 14, 18);
    doc.text(`Colegio: _______________________`, 14, 26); // Para completar luego
    doc.text(`Fecha: ${fechaActual}`, 14, 34);
    doc.text("Mis Pagos", 14, 42);
    autoTable(doc, {
      startY: 46,
      head: [['ID', 'Carrera', 'Monto', 'Mes']],
      body: pagos.map(p => [
        p.id,
        p.carrera?.nombre || p.carrera_id,
        `$${p.monto}`,
        p.mes,
      ]),
    });
    doc.save(`pagos_${nombreAlumno}.pdf`);
  };

  if (tipoUsuario !== "Alumno") {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center">
          No tienes permiso para ver esta sección.
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h2 className="mb-4 text-center">Mis Pagos</h2>

      {mensaje && <div className="alert alert-danger text-center">{mensaje}</div>}

      <div className="mb-3 text-end">
        <button className="btn btn-outline-primary" onClick={exportarPDF}>
          Descargar PDF
        </button>
      </div>

      <table className="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Carrera</th>
            <th>Monto</th>
            <th>Mes</th>
          </tr>
        </thead>
        <tbody>
          {pagos.length > 0 ? (
            pagos.map(p => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.carrera?.nombre || p.carrera_id}</td>
                <td>${p.monto}</td>
                <td>{p.mes}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="text-center">No hay pagos registrados.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default MisPagos;

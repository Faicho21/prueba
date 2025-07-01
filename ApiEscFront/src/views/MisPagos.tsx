import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion } from 'framer-motion';

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
  const [loading, setLoading] = useState<boolean>(true);
  const [descargando, setDescargando] = useState<boolean>(false);

  useEffect(() => {
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setTipoUsuario(payload.type);
      setNombreAlumno(payload.username || "Alumno");

      const userLocal = localStorage.getItem("user");
      if (userLocal) {
        const user = JSON.parse(userLocal);
        setFirstName(user.userdetail?.firstName || "");
        setLastName(user.userdetail?.lastName || "");
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
        })
        .finally(() => setLoading(false));
    }
  }, [tipoUsuario]);

  const exportarPDF = () => {
    setDescargando(true);
    const fechaActual = new Date().toLocaleDateString();
    const doc = new jsPDF();
    doc.text(`Nombre: ${firstName}`, 14, 10);
    doc.text(`Apellido: ${lastName}`, 14, 18);
    doc.text(`Colegio: _______________________`, 14, 26);
    doc.text(`Fecha: ${fechaActual}`, 14, 34);
    doc.text("Mis Pagos", 14, 42);
    autoTable(doc, {
      startY: 46,
      head: [['ID', 'Carrera', 'Monto', 'Mes']],
      body: pagos.map(p => [
        p.id,
        p.carrera?.nombre || p.carrera_id,
        `${p.monto}`,
        p.mes,
      ]),
    });
    doc.save(`pagos_${nombreAlumno}.pdf`);
    setTimeout(() => setDescargando(false), 1000);
  };

  if (tipoUsuario !== "Alumno") {
    return (
      <div className="container mt-5">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="alert alert-danger text-center"
        >
          No tienes permiso para ver esta sección.
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      className="container mt-5"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-4 mb-4 bg-success bg-opacity-10 border-start border-4 border-success rounded shadow-sm">
        <h2 className="text-success m-0 text-center">Mis Pagos</h2>
      </div>

      {mensaje && (
        <motion.div
          className="alert alert-danger text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {mensaje}
        </motion.div>
      )}

      <div className="mb-3 text-end">
        <button
          className="btn btn-outline-success"
          onClick={exportarPDF}
          disabled={descargando}
        >
          {descargando ? "Descargando..." : "Descargar PDF"}
        </button>
      </div>

      {loading ? (
        <div className="text-center">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : (
        <motion.table
          className="table table-hover table-striped"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <thead className="table-success">
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
                <motion.tr key={p.id} whileHover={{ scale: 1.02 }}>
                  <td>{p.id}</td>
                  <td>{p.carrera?.nombre || p.carrera_id}</td>
                  <td>${p.monto}</td>
                  <td>{p.mes}</td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center">No hay pagos registrados.</td>
              </tr>
            )}
          </tbody>
        </motion.table>
      )}
    </motion.div>
  );
};

export default MisPagos;

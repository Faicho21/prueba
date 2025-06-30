import React, { useEffect, useState } from 'react';

interface Usuario {
    id: number;
    username: string;
    userdetail: {
        email: string;
        dni: string; // lo pasamos como string para evitar problemas de validación
        firstName: string;
        lastName: string;
        type: string;
    };
}

interface NuevoUsuario {
    username: string;
    password: string;
    email: string;
    dni: string; // lo pasamos como string para evitar problemas de validación
    firstName: string;
    lastName: string;
    type: string;
}

interface ErroresValidacion {
    username?: string;
    password?: string;
    email?: string;
    dni?: string;
    firstName?: string;
    lastName?: string;
    type?: string;
}

function Alumnos() {
    const BACKEND_IP = "localhost";
    const BACKEND_PORT = "8000";

    const [alumnos, setAlumnos] = useState<Usuario[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [nuevoUsuario, setNuevoUsuario] = useState<NuevoUsuario>({
        username: '',
        password: '',
        email: '',
        dni: '',
        firstName: '',
        lastName: '',
        type: '',
    });

    const [erroresValidacion, setErroresValidacion] = useState<ErroresValidacion>({});
    const [backendError, setBackendError] = useState<string | null>(null);
    const [mensajeExito, setMensajeExito] = useState<string | null>(null);

    const token = localStorage.getItem('token');
    const [tipoUsuario, setTipoUsuario] = useState<string>('');

    useEffect(() => {
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setTipoUsuario(payload.type);
            } catch (e) {
                console.error("Error decodificando token:", e);
            }
        }
    }, [token]);

    const fetchUsuarios = async () => {
        if (tipoUsuario !== 'Admin') {
            return;
        }
        try {
            const res = await fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/users/all`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Error al obtener usuarios: ${res.status} - ${errorText}`);
            }
            const data = await res.json();
            if (Array.isArray(data)) {
                setAlumnos(data);
            } else {
                console.error("Los datos recibidos no son válidos:", data);
                setBackendError("Formato de datos de usuarios inválido recibido del servidor.");
            }
        } catch (error) {
            console.error("Error al obtener los alumnos:", error);
            setBackendError("No se pudieron cargar los usuarios. Revisa tu conexión o permisos.");
        }
    };

    useEffect(() => {
        if (tipoUsuario === 'Admin') {
            fetchUsuarios();
        }
    }, [tipoUsuario, token]);

    const eliminarUsuario = async (id: number) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario? ')) {
            return;
        }

        setBackendError(null);
        setMensajeExito(null);

        try {
            const res = await fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/users/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                setAlumnos(alumnos.filter(alumno => alumno.id !== id));
                setMensajeExito('Usuario eliminado exitosamente.');
            } else {
                let errorData;
                try {
                    errorData = await res.json();
                } catch (jsonError) {
                    errorData = { detail: res.statusText || `Error al eliminar el usuario (Status: ${res.status}).` };
                }
                
                console.error("Error al eliminar el usuario:", errorData);

                if (errorData.detail && typeof errorData.detail === 'string') {
                    if (errorData.detail.includes("ForeignKeyViolation") || errorData.detail.includes("IntegrityError")) {
                        setBackendError("No se puede eliminar el usuario. Está asociado a otros registros (ej. pagos, carreras). Desvinculelos primero");
                    } else {
                        setBackendError(errorData.detail);
                    }
                } else {
                    setBackendError('Error desconocido al eliminar el usuario.');
                }
            }
        } catch (error) {
            console.error("Error de red al eliminar el usuario:", error);
            setBackendError("Error de conexión al servidor al intentar eliminar el usuario.");
        }
    };

    const editarUsuario = (id: number) => {
        console.log(`Editar usuario con ID: ${id}`);
    };

    const validateField = (fieldName: keyof NuevoUsuario, value: string | number): string | undefined => {
        const stringValue = String(value).trim();

        switch (fieldName) {
            case 'username':
                if (!stringValue) return 'El nombre de usuario es obligatorio.';
                if (stringValue.length < 3) return 'El nombre de usuario debe tener al menos 3 caracteres.';
                return undefined;
            case 'password':
                if (!stringValue) return 'La contraseña es obligatoria.';
                if (stringValue.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
                return undefined;
            case 'email':
                if (!stringValue) return 'El email es obligatorio.';
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stringValue)) return 'El email no es válido (ejemplo@ejemplo.com).';
                return undefined;
            case 'dni':
                if (!stringValue) return 'El DNI es obligatorio.';
                if (!/^\d{7,9}$/.test(stringValue)) return 'El DNI debe contener solo 7 a 9 dígitos numéricos.';
                return undefined;
            case 'firstName':
                if (!stringValue) return 'El nombre es obligatorio.';
                return undefined;
            case 'lastName':
                if (!stringValue) return 'El apellido es obligatorio.';
                return undefined;
            case 'type':
                if (!stringValue) return 'Debe seleccionar un tipo de usuario.';
                return undefined;
            default:
                return undefined;
        }
    };

    const validateForm = () => {
        let newErrors: ErroresValidacion = {};
        let isValid = true;
        (Object.keys(nuevoUsuario) as (keyof NuevoUsuario)[]).forEach(key => {
            const error = validateField(key, nuevoUsuario[key]);
            if (error) {
                newErrors[key] = error;
                isValid = false;
            }
        });
        setErroresValidacion(newErrors);
        return isValid;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNuevoUsuario(prev => ({ ...prev, [name]: value }));

        setErroresValidacion(prev => {
            const { [name as keyof ErroresValidacion]: removedError, ...rest } = prev;
            return rest;
        });
        setBackendError(null);
        setMensajeExito(null);
    };

    //  MODIFICACIÓN Función crearUsuario 
    const crearUsuario = async () => {
        setErroresValidacion({}); // Limpia errores previos de validación de frontend
        setBackendError(null); // Limpia errores previos del backend
        setMensajeExito(null); // Limpia mensajes de éxito previos

        const isValid = validateForm();

        if (!isValid) {
            console.log("Errores de validación en el formulario (frontend):", erroresValidacion);
            return;
        }

        try {
            const res = await fetch(`http://${BACKEND_IP}:${BACKEND_PORT}/users/register/full`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...nuevoUsuario,
                    dni: Number(nuevoUsuario.dni)  //parseamos el DNI a numero que es lo que espera el backend
                }),
            });

            let responseData;
            try {
                responseData = await res.json(); //Parsea la respuesta JSON del servidor
            } catch (jsonError) {
                console.warn("La respuesta del servidor no es JSON o está vacía:", jsonError); 
                // Si no se puede parsear, crea una respuesta genérica para mostrar un error.
                responseData = { detail: res.statusText || `Error inesperado del servidor (Status: ${res.status}).` };
            }

            if (res.ok) {
                // Si la respuesta es OK (status 200), el usuario se creó exitosamente
                setMensajeExito(responseData.message || 'Usuario creado exitosamente.');
                setShowModal(false);
                // Resetea el formulario para futuros usos
                setNuevoUsuario({
                    username: '',
                    password: '',
                    email: '',
                    dni: '',
                    firstName: '',
                    lastName: '',
                    type: '',
                });
                fetchUsuarios(); // Recarga la lista para mostrar el nuevo usuario
            } else {
                // Si la respuesta NO es OK (status 400 o 500),  es porque hubo un error en el backend
                console.error("Error al crear el usuario (backend):", responseData);
                const errorMessage = responseData.detail || responseData.message || 'Error desconocido al crear el usuario.';

                //Manejo de errores específicos del backend 
                if (typeof errorMessage === 'string') {
                    if (errorMessage.includes("username already exists") || errorMessage.includes("El nombre de usuario ya existe")) {
                        setErroresValidacion(prev => ({ ...prev, username: "Este nombre de usuario ya está en uso." }));
                    } else if (errorMessage.includes("DNI already exists") || errorMessage.includes("El DNI ya existe")) {
                        setErroresValidacion(prev => ({ ...prev, dni: "Este DNI ya está registrado." }));
                    } else if (errorMessage.includes("email already exists") || errorMessage.includes("El email ya existe")) {
                        setErroresValidacion(prev => ({ ...prev, email: "Este email ya está registrado." }));
                    } else {
                        setBackendError(errorMessage);
                    }
                } 
                
                else {
                    // Si el formato de error es inesperado, muestra un mensaje genérico.
                    setBackendError('Error desconocido del servidor al crear el usuario.');
                }
            }
        } catch (err) {
            // 4. Manejo de errores de red (ej. servidor no responde, CORS)
            console.error("Error de red al crear usuario:", err);
            setBackendError('Error de conexión al servidor. Por favor, intenta de nuevo más tarde.');
        }
    };

    
    if (tipoUsuario !== 'Admin') {
        return (
            <div className="container mt-5">
                <div className="alert alert-danger text-center">
                    No tienes permiso para acceder a esta sección. Por favor, inicia sesión con una cuenta de Administrador.
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-5">
            <h2 className="mb-4 text-center">Gestión de Usuarios</h2>

            {mensajeExito && <div className="alert alert-success">{mensajeExito}</div>}
            {backendError && <div className="alert alert-danger">{backendError}</div>}


            <table className="table table-striped table-hover">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>DNI</th>
                        <th>Nombre</th>
                        <th>Apellido</th>
                        <th>Tipo</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {alumnos.length > 0 ? (
                        alumnos.map(alumno => (
                            <tr key={alumno.id}>
                                <td>{alumno.id}</td>
                                <td>{alumno.username}</td>
                                <td>{alumno.userdetail.email}</td>
                                <td>{alumno.userdetail.dni}</td>
                                <td>{alumno.userdetail.firstName}</td>
                                <td>{alumno.userdetail.lastName}</td>
                                <td>{alumno.userdetail.type}</td>
                                <td>
                                    <button
                                        className="btn btn-sm btn-primary me-2"
                                        onClick={() => editarUsuario(alumno.id)}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        className="btn btn-sm btn-danger"
                                        onClick={() => eliminarUsuario(alumno.id)}
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={8} className="text-center">No hay usuarios registrados.</td>
                        </tr>
                    )}
                </tbody>
            </table>

            <button className="btn btn-success"
                style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    borderRadius: '50%',
                    width: '60px',
                    height: '60px',
                    fontSize: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#198754',
                    color: 'white',
                    border: 'none',
                    zIndex: 1050
                }}
                onClick={() => {
                    setShowModal(true);
                    setErroresValidacion({});
                    setBackendError(null);
                    setMensajeExito(null);
                    setNuevoUsuario({
                        username: '',
                        password: '',
                        email: '',
                        dni: '',
                        firstName: '',
                        lastName: '',
                        type: '',
                    });
                }}>
                +
            </button>
            {showModal && (
                <div className="modal show fade d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Nuevo Usuario</h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                {backendError && <div className="alert alert-danger">{backendError}</div>}

                                <label className="form-label">USUARIO</label>
                                <input
                                    className={`form-control mb-1 ${erroresValidacion.username ? 'is-invalid' : ''}`}
                                    name="username"
                                    placeholder="Username"
                                    value={nuevoUsuario.username}
                                    onChange={handleChange}
                                />
                                {erroresValidacion.username && <div className="invalid-feedback d-block mb-2">{erroresValidacion.username}</div>}

                                <label className="form-label">CONTRASEÑA</label>
                                <input
                                    className={`form-control mb-1 ${erroresValidacion.password ? 'is-invalid' : ''}`}
                                    name="password"
                                    type="password"
                                    placeholder="Password"
                                    value={nuevoUsuario.password}
                                    onChange={handleChange}
                                />
                                {erroresValidacion.password && <div className="invalid-feedback d-block mb-2">{erroresValidacion.password}</div>}

                                <label className="form-label">EMAIL</label>
                                <input
                                    className={`form-control mb-1 ${erroresValidacion.email ? 'is-invalid' : ''}`}
                                    name="email"
                                    placeholder="Email"
                                    value={nuevoUsuario.email}
                                    onChange={handleChange}
                                />
                                {erroresValidacion.email && <div className="invalid-feedback d-block mb-2">{erroresValidacion.email}</div>}

                                <label className="form-label">DNI</label>
                                <input
                                    className={`form-control mb-1 ${erroresValidacion.dni ? 'is-invalid' : ''}`}
                                    name="dni"
                                    placeholder="DNI"
                                    value={nuevoUsuario.dni}
                                    onChange={handleChange}
                                    type="text"
                                    inputMode="numeric"
                                    pattern="\d*"
                                />
                                {erroresValidacion.dni && <div className="invalid-feedback d-block mb-2">{erroresValidacion.dni}</div>}

                                <label className="form-label">NOMBRE</label>
                                <input
                                    className={`form-control mb-1 ${erroresValidacion.firstName ? 'is-invalid' : ''}`}
                                    name="firstName"
                                    placeholder="Nombre"
                                    value={nuevoUsuario.firstName}
                                    onChange={handleChange}
                                />
                                {erroresValidacion.firstName && <div className="invalid-feedback d-block mb-2">{erroresValidacion.firstName}</div>}

                                <label className="form-label">APELLIDO</label>
                                <input
                                    className={`form-control mb-1 ${erroresValidacion.lastName ? 'is-invalid' : ''}`}
                                    name="lastName"
                                    placeholder="Apellido"
                                    value={nuevoUsuario.lastName}
                                    onChange={handleChange}
                                />
                                {erroresValidacion.lastName && <div className="invalid-feedback d-block mb-2">{erroresValidacion.lastName}</div>}

                                <label className="form-label">TIPO DE USUARIO</label>
                                <select
                                    className={`form-select mb-2 ${erroresValidacion.type ? 'is-invalid' : ''}`}
                                    name="type"
                                    value={nuevoUsuario.type}
                                    onChange={handleChange}
                                >
                                    <option value="">Selecciona un tipo</option>
                                    <option value="Alumno">Alumno</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Profesor">Profesor</option>
                                </select>
                                {erroresValidacion.type && <div className="invalid-feedback d-block mb-2">{erroresValidacion.type}</div>}
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button className="btn btn-primary" onClick={crearUsuario}>Crear</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Alumnos;
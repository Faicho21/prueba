import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Registro from "./Registro";

function Login() {
  const BACKEND_IP = "localhost";
  const BACKEND_PORT = "8000";
  const ENDPOINT = "users/loginUser";
  const LOGIN_URL = `http://${BACKEND_IP}:${BACKEND_PORT}/${ENDPOINT}`;
  
  const navigate = useNavigate();

  const userInputRef = useRef<HTMLInputElement>(null);
  const passInputRef = useRef<HTMLInputElement>(null);

  const [message, setMessage] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);

  // Decodificar el payload del token JWT
  function parseJwt(token: string): any {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch (e) {
      return null;
    }
  }

  function loginProcess(dataObject: any) {
    if (dataObject.success) {
      const token = dataObject.token;
      localStorage.setItem("token", token);

      const payload = parseJwt(token);
      if (payload) {
        localStorage.setItem("user", JSON.stringify(payload));
        setMessage("Inicio de sesión exitoso...");
        navigate("/home");
      } else {
        setMessage("Error al leer datos del token.");
      }
    } else {
      setMessage(dataObject.message ?? "Usuario o contraseña incorrectos.");
    }
  }

  function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const username = userInputRef.current?.value ?? "";
    const password = passInputRef.current?.value ?? "";

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({ username, password });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
    };

    fetch(LOGIN_URL, requestOptions)
      .then((respond) => respond.json())
      .then((dataObject) => loginProcess(dataObject))
      .catch((error) => {
        console.log("error", error);
        setMessage("Error de conexión con el servidor.");
      });
  }

  // Vista de registro (opcional)
  if (showRegister) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: "url('/colegio.png')",
          backgroundSize: "cover",
        }}
      >
        <div
          className="card p-4 shadow-lg"
          style={{
            maxWidth: "400px",
            width: "100%",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(10px)",
            borderRadius: "15px",
          }}
        >
          <Registro />
          <button
            className="btn btn-link mt-3"
            onClick={() => setShowRegister(false)}
            style={{ color: "#3ab397" }}
          >
            ¿Ya tienes cuenta? Inicia sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: "url('/colegio.png')",
        backgroundSize: "cover",
      }}
    >
      <div
        className="card p-4 shadow-lg"
        style={{
          maxWidth: "400px",
          width: "100%",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(10px)",
          borderRadius: "15px",
        }}
      >
        <h1 className="text-center mb-3" style={{ fontWeight: 700, color: "#3ab397" }}>
          LOGIN
        </h1>
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label htmlFor="inputUser" className="form-label">
              Usuario
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="Ingresa tu usuario"
              id="inputUser"
              ref={userInputRef}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="inputPassword" className="form-label">
              Contraseña
            </label>
            <input
              type="password"
              className="form-control"
              placeholder="Ingresa tu contraseña"
              id="inputPassword"
              ref={passInputRef}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", backgroundColor: "#3ab397", borderColor: "#3ab397" }}
          >
            Ingresar
          </button>

          {message && (
            <div className="mt-3 text-center" style={{ color: "#e74c3c" }}>
              {message}
            </div>
          )}

          <div className="mt-3">
            <button
              type="button"
              className="btn btn-link"
              onClick={() => setShowRegister(true)}
            >
              ¿No tienes cuenta? Regístrate aquí
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;

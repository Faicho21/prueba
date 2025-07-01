import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Registro from "./Registro";

type LoginProcessResponse = {
  status: string;
  token?: string;
  user?: unknown;
  message?: string;
};

function Login() {
  const BACKEND_IP = "localhost";
  const BACKEND_PORT = "8000";
  const ENDPOINT = "users/login";
  const LOGIN_URL = `http://${BACKEND_IP}:${BACKEND_PORT}/${ENDPOINT}`;
  
  const navigate = useNavigate();

  const userInputRef = useRef<HTMLInputElement>(null);
  const passInputRef = useRef<HTMLInputElement>(null);

  const [message, setMessage] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);

  function loginProcess(dataObject: LoginProcessResponse) {
    if (dataObject.status === "success"){
      localStorage.setItem("token", dataObject.token ?? ""); 
      localStorage.setItem("user", JSON.stringify(dataObject.user));
      setMessage("Iniciando Sesion...");
      navigate("/home");
    } else {
      setMessage(dataObject.message || (dataObject as any).detail || "Error desconocido en el login.");
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
      .catch((error) => console.log("error", error));
  }

  if (showRegister) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: "url('https://images.unsplash.com/photo-1564981797816-1043664bf78d?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
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
            position: "relative", 
            zIndex: 1,
            border: "none",
            borderRadius: "15px"
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
        backgroundImage: "url('https://images.unsplash.com/photo-1564981797816-1043664bf78d?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
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
          position: "relative", 
          zIndex: 1,
          border: "none",
          borderRadius: "15px"
        }}
      >
        <h1 className="text-center mb-3" style={{fontWeight: 700, letterSpacing: 1, color: "#3ab397" }} >LOGIN</h1>
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label htmlFor="inputUser" className="form-label" >
              Usuario
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="Ingresa tu usuario"
              id="inputUser"
              ref={userInputRef}
              aria-describedby="userHelp"
            />
            <div id="userHelp" className="form-text">
              ¡Nunca compartas tus datos con nadie!
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="exampleInputContraseña " className="form-label">
              Contraseña
            </label>
            <input
              type="password"
              className="form-control"
              placeholder="Ingresa tu contraseña"
              id="exampleInputPassword1"
              ref={passInputRef}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", backgroundColor: "#3ab397", borderColor: "#3ab397" }}>
            Ingresar
          </button>
          <span className="ms-3">{message}</span>
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

import { useRef, useState } from "react";

type RegisterProcessResponse = {
  status: string;
  message?: string;
};

function Registro() {
  const BACKEND_IP = "localhost";
  const BACKEND_PORT = "8000";
  const ENDPOINT = "users/register";
  const REGISTER_URL = `http://${BACKEND_IP}:${BACKEND_PORT}/${ENDPOINT}`;

  const emailInputRef = useRef<HTMLInputElement>(null);
  const userInputRef = useRef<HTMLInputElement>(null);
  const passInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  function registerProcess(dataObject: RegisterProcessResponse) {
    if (dataObject.status === "success") {
      setMessage("Registro exitoso. Ahora puedes iniciar sesión.");
    } else {
      setMessage(dataObject.message ?? "Error desconocido");
    }
  }

  function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = emailInputRef.current?.value ?? "";
    const username = userInputRef.current?.value ?? "";
    const password = passInputRef.current?.value ?? "";
    const myHeaders = new Headers();

    myHeaders.append("Content-Type", "application/json");
    const raw = JSON.stringify({ email, username, password });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
    };

    fetch(REGISTER_URL, requestOptions)
      .then((respond) => respond.json())
      .then((dataObject) => registerProcess(dataObject))
      .catch((error) => setMessage("Error de red"));
  }

  return (
    <>
      <h1 className="text-center mb-3" style={{fontWeight: 700, letterSpacing: 1, color: "#3ab397" }}>
        REGISTRO
      </h1>
      <form onSubmit={handleRegister}>
        <div className="mb-3">
          <label htmlFor="registerEmail" className="form-label">
            Email
          </label>
          <input
            type="email"
            className="form-control"
            placeholder="Ingresa tu email"
            id="registerEmail"
            ref={emailInputRef}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="registerUser" className="form-label">
            Usuario
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="Ingresa tu usuario"
            id="registerUser"
            ref={userInputRef}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="registerPassword" className="form-label">
            Contraseña
          </label>
          <input
            type="password"
            className="form-control"
            placeholder="Ingresa tu contraseña"
            id="registerPassword"
            ref={passInputRef}
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: "100%", backgroundColor: "#3ab397", borderColor: "#3ab397" }}>
          Registrarme
        </button>
        <span className="ms-3">{message}</span>
      </form>
    </>
  );
}

export default Registro;

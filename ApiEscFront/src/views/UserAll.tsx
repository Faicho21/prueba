import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";



function UserAll() {
  const userName = JSON.parse(localStorage.getItem("user") || "{}").firstName;

  const BACKEND_IP = "localhost";
  const BACKEND_PORT = "8000";
  const ENDPOINT = "users/all";
  const LOGIN_URL = `http://${BACKEND_IP}:${BACKEND_PORT}/${ENDPOINT}`;

  type User = { username: string; [key: string]: any };
  const [data, setData] = useState<User[]>([]);

  function mostrar_datos(data: any) {
    console.log("data", data);
    if (!data.message) setData(data);
    else setData([]);
  }

  function get_users_all() {
    const token = localStorage.getItem("token");
    var myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${token}`);
    myHeaders.append("Content-Type", "application/json");

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
    };

    fetch(LOGIN_URL, requestOptions)
      .then((respond) => respond.json())
      .then((data) => mostrar_datos(data))
      .catch((error) => console.log("error", error));
  }

  useEffect(() => {
    get_users_all();
  }, []);

  return (
    <div>
      <h2>UserAll</h2>
      <div>Bienvenido {userName}!</div>
      <table className="table-primary">
        <thead>
          <td>NOMBRE</td>
          <td>APELLIDO</td>
          <td>TIPO</td>
          <td>EMAIL</td>
        </thead>
        <tbody>
          {data.map((pepe) => { 
            return (
              <tr key={pepe.id}>
                <td>{pepe.userdetail.firstName}</td>
                <td>{pepe.userdetail.lastName}</td>
                <td>{pepe.userdetail.type}</td>
                <td>{pepe.userdetail.email}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div>
        <button onClick={get_users_all}>Recargar datos</button>
      </div>
    </div>
  );
}

export default UserAll;
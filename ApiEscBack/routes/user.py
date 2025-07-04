from fastapi import APIRouter, Request, Depends, HTTPException, Body
from models.user import (
    session, InputUser, User, InputLogin, UserDetail,
    InputUserDetail, InputRegister, UserDetailUpdate,
    UserOut, UserDetailOut
)
from fastapi.responses import JSONResponse
from psycopg2 import IntegrityError
from auth.seguridad import obtener_usuario_desde_token, Seguridad
from sqlalchemy.orm import joinedload
from typing import List
from models.carrera import Carrera
from models.carreraUsuario import UsuarioCarrera
from models.pago import Pago

user = APIRouter()
userDetail = APIRouter()

# -------------------- NUEVA RUTA: Asignar alumno a carrera --------------------
@user.post("/usuario-carrera")
def asignar_usuario_a_carrera(
    user_id: int,
    carrera_id: int,
    estado_alumno: str = "Cursando",
    payload: dict = Depends(obtener_usuario_desde_token)
):
    if payload["type"] != "Admin":
        raise HTTPException(status_code=403, detail="Solo el Admin puede asignar carreras")
    
    try:
        inscripcion_existente = session.query(UsuarioCarrera).filter_by(
            user_id=user_id, carrera_id=carrera_id
        ).first()

        if inscripcion_existente:
            raise HTTPException(status_code=400, detail="El alumno ya está inscripto en esa carrera")

        nueva_inscripcion = UsuarioCarrera(
            user_id=user_id,
            carrera_id=carrera_id,
            estado_alumno=estado_alumno
        )
        session.add(nueva_inscripcion)
        session.commit()
        return {"msg": "Carrera asignada correctamente al alumno"}

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Error al asignar carrera: {str(e)}")
    finally:
        session.close()

# -------------------- Actualizar detalles de un usuario --------------------
@user.patch("/users/{user_id}/details", response_model=dict)
def actualizar_parcial_userdetail(
    user_id: int,
    cambios: UserDetailUpdate,
    payload: dict = Depends(obtener_usuario_desde_token),
):
    try:
        user = session.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        if payload["type"] != "Admin" and int(payload["sub"]) != user_id:
            raise HTTPException(status_code=403, detail="No autorizado")

        if not user.userdetail:
            raise HTTPException(status_code=404, detail="Este usuario no tiene detalles aún")

        datos_a_actualizar = cambios.dict(exclude_unset=True)

        if payload["type"] != "Admin":
            datos_a_actualizar.pop("type", None)

        for campo, valor in datos_a_actualizar.items():
            setattr(user.userdetail, campo, valor)

        session.commit()
        return {"msg": "Actualizado correctamente"}

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail="Error interno del servidor")
    finally:
        session.close()

# -------------------- Crear usuario (simple) --------------------
@user.post("/users/register")
def crear_usuario(user: InputRegister, payload: dict = Depends(obtener_usuario_desde_token)):
    if payload["type"] not in ["Admin"]:
        raise HTTPException(status_code=403, detail="No tienes permiso para registrar usuarios")
    try:
        if validate_username(user.username):
            if validate_email(user.email):
                new_user = User(username=user.username, password=user.password)
                new_detail = UserDetail(
                    dni=None,
                    firstName=None,
                    lastName=None,
                    type="Admin",
                    email=user.email,
                )
                session.add(new_detail)
                session.flush()
                new_user.id_userdetail = new_detail.id
                session.add(new_user)
                session.commit()
                return "Usuario registrado correctamente"
            else:
                return "El email ya existe"
        else:
            return "El usuario ya existe"

    except IntegrityError as e:
        session.rollback()
        return JSONResponse(status_code=400, content={"detail": "Error de integridad: " + str(e)})
    except Exception as e:
        session.rollback()
        return JSONResponse(status_code=500, content={"detail": f"Error inesperado: {str(e)}"})
    finally:
        session.close()

# -------------------- Crear usuario completo --------------------
@user.post("/users/register/full")
def crear_usuario_completo(user: InputUser, payload: dict = Depends(obtener_usuario_desde_token)):
    if payload["type"] not in ["Admin"]:
        raise HTTPException(status_code=403, detail="No tienes permiso para registrar usuarios")
    try:
        if validate_username(user.username):
            if validate_email(user.email):
                new_user = User(username=user.username, password=user.password)
                new_detail = UserDetail(
                    dni=user.dni,
                    firstName=user.firstName,
                    lastName=user.lastName,
                    type=user.type,
                    email=user.email,
                )
                session.add(new_detail)
                session.flush()
                new_user.id_userdetail = new_detail.id
                session.add(new_user)
                session.commit()
                return "Usuario registrado correctamente"
            else:
                return "El email ya existe"
        else:
            return "El usuario ya existe"

    except IntegrityError as e:
        session.rollback()
        return JSONResponse(status_code=400, content={"detail": "Error de integridad: " + str(e)})
    except Exception as e:
        session.rollback()
        return JSONResponse(status_code=500, content={"detail": f"Error inesperado: {str(e)}"})
    finally:
        session.close()

# -------------------- Obtener usuarios (Admin only) --------------------
@user.get("/users/all", response_model=List[UserOut])
def obtener_usuarios(payload: dict = Depends(obtener_usuario_desde_token)):
    if payload["type"] not in ["Admin"]:
        raise HTTPException(status_code=403, detail="No tienes permiso para ver los usuarios")
    try:
        usuarios = session.query(User).options(joinedload(User.userdetail)).all()
        return usuarios
    finally:
        session.close()

# -------------------- Login principal --------------------
@user.post("/users/loginUser")
def login_post(userIn: InputLogin):
    try:
        user = session.query(User).filter(User.username == userIn.username).first()
        if not user or user.password != userIn.password:
            return JSONResponse(
                status_code=401,
                content={"success": False, "message": "Usuario y/o password incorrectos!"},
            )

        authDat = Seguridad.generar_token(user)
        if not authDat:
            return JSONResponse(status_code=401, content={"success": False, "message": "Error generando token!"})

        return JSONResponse(status_code=200, content={"success": True, "token": authDat})

    except Exception as e:
        return JSONResponse(
            status_code=500, content={"success": False, "message": "Error interno del servidor"}
        )

# -------------------- Rutas que ya estaban en tu código --------------------
@user.post("/users/login")
def login_user(us: InputLogin):
    try:
        user = session.query(User).filter(User.username == us.username).first()
        if user and user.password == us.password:
            token = Seguridad.generar_token(user)
            res = {
                "status": "success",
                "token": token,
                "user": user.userdetail,
                "message": "User logged in successfully!",
            }
            return res
        else:
            res = {"message": "Invalid username or password"}
            return JSONResponse(status_code=401, content=res)
    except Exception as ex:
        print("Error ---->> ", ex)
    finally:
        session.close()

@user.get("/users/all/NOSOTROS")
def obtener_usuario_detalle(req: Request):
    try:
        has_access = Seguridad.verificar_token(req.headers)
        if "iat" in has_access:
            usuarios = session.query(User).options(joinedload(User.userdetail)).all()
            usuarios_con_detalles = []
            for usuario in usuarios:
                usuario_con_detalle = {
                    "id": usuario.id,
                    "username": usuario.username,
                    "dni": usuario.userdetail.dni,
                    "first_Name": usuario.userdetail.firstName,
                    "last_Name": usuario.userdetail.lastName,
                    "type": usuario.userdetail.type,
                    "email": usuario.userdetail.email,
                }
                usuarios_con_detalles.append(usuario_con_detalle)
            return JSONResponse(status_code=200, content=usuarios_con_detalles)
        else:
            return JSONResponse(status_code=403, content=has_access)
    except Exception as e:
        print("Error al obtener usuarios:", e)
        return JSONResponse(status_code=500, content={"detail": "Error al obtener usuarios"})

@user.post("/users/Register")
def crear_usuario_sin_token(user: InputRegister):
    try:
        if validate_username(user.username):
            if validate_email(user.email):
                newUser = User(user.username, user.password)
                newUserDetail = UserDetail(user.dni, user.firstName, user.lastName, user.type, user.email)
                newUser.userdetail = newUserDetail
                session.add(newUser)
                session.commit()
                return "Usuario agregado"
            else:
                return "El email ya existe"
        else:
            return "El usuario ya existe"
    except IntegrityError as e:
        if "username" in str(e):
            return JSONResponse(status_code=400, content={"detail": "Username ya existe"})
        else:
            print("Error de integridad inesperado:", e)
            return JSONResponse(status_code=500, content={"detail": "Error al agregar usuario"})
    except Exception as e:
        session.rollback()
        print("Error al agregar usuario:", e)
        return JSONResponse(status_code=500, content={"detail": "Error al agregar usuario"})
    finally:
        session.close()

# -------------------- Validaciones auxiliares --------------------
def validate_username(value):
    existing_user = session.query(User).filter(User.username == value).first()
    session.close()
    return None if existing_user else value

def validate_email(value):
    existing_email = session.query(UserDetail).filter(UserDetail.email == value).first()
    session.close()
    return None if existing_email else value

@user.get("/users/{user_id}", response_model=UserOut)
def obtener_usuario(user_id: int, payload: dict = Depends(obtener_usuario_desde_token)):
    if int(payload["sub"]) != user_id and payload["type"] != "Admin":
        raise HTTPException(status_code=403, detail="No autorizado")

    try:
        usuario = (
            session.query(User)
            .options(joinedload(User.userdetail))
            .filter(User.id == user_id)
            .first()
        )
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        return usuario
    finally:
        session.close()


from fastapi import Body

@user.patch("/users/{user_id}/cambiar-password")
def cambiar_password(
    user_id: int,
    data: dict = Body(...),
    payload: dict = Depends(obtener_usuario_desde_token)
):
    actual = data.get("actual")
    nueva = data.get("nueva")

    if not actual or not nueva:
        raise HTTPException(status_code=400, detail="Faltan datos obligatorios.")

    if payload["type"] != "Admin" and int(payload["sub"]) != user_id:
        raise HTTPException(status_code=403, detail="No autorizado")

    try:
        usuario = session.query(User).filter(User.id == user_id).first()
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        if payload["type"] != "Admin" and usuario.password != actual:
            raise HTTPException(status_code=401, detail="Contraseña actual incorrecta")

        usuario.password = nueva
        session.commit()

        return {"msg": "Contraseña actualizada correctamente"}
    except Exception as e:
        session.rollback()
        print("Error cambiando contraseña:", e)
        raise HTTPException(status_code=500, detail="Error interno del servidor")
    finally:
        session.close()




# -------------------- Eliminar usuario --------------------
@user.delete("/users/{user_id}", response_model=dict)
def eliminar_usuario(user_id: int, payload: dict = Depends(obtener_usuario_desde_token)):
    try:
        if payload["type"] != "Admin":
            raise HTTPException(status_code=403, detail="No tienes permiso para eliminar usuarios")

        user = session.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        session.query(UsuarioCarrera).filter_by(user_id=user_id).delete()
        session.query(Carrera).filter_by(user_id=user_id).delete()
        session.query(Pago).filter_by(user_id=user_id).delete()
        if user.id_userdetail:
            session.query(UserDetail).filter(UserDetail.id == user.id_userdetail).delete()

        session.delete(user)
        session.commit()

        return {"msg": "Usuario y datos asociados eliminados correctamente"}

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
    finally:
        session.close()

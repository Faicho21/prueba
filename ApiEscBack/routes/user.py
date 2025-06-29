from fastapi import APIRouter, Request, Depends, HTTPException
from models.user import (session,InputUser,User,InputLogin,UserDetail,InputUserDetail,InputRegister,UserDetailUpdate, UserOut, UserDetailOut)
from fastapi.responses import JSONResponse
from psycopg2 import IntegrityError
from auth.seguridad import obtener_usuario_desde_token, Seguridad
from sqlalchemy.orm import (joinedload,load_only)
from typing import List
from models.carrera import Carrera
from models.carreraUsuario import UsuarioCarrera
from models.pago import Pago


user = APIRouter()
userDetail = APIRouter()


# Pruba
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

        # Solo permite si:
        # - el usuario es admin
        # - o el usuario es el mismo que quiere editarse
        if payload["type"] != "Admin" and int(payload["sub"]) != user_id:
            raise HTTPException(status_code=403, detail="No autorizado")

        if not user.userdetail:
            raise HTTPException(status_code=404, detail="Este usuario no tiene detalles aún")

        datos_a_actualizar = cambios.dict(exclude_unset=True)

        # Si no es admin, no permitir modificar el campo 'type'
        if payload["type"] != "Admin":
            datos_a_actualizar.pop("type", None)

        for campo, valor in datos_a_actualizar.items():
            setattr(user.userdetail, campo, valor)

        session.commit()
        return {"msg": "Actualizado correctamente"}

    except Exception as e:
        session.rollback()
        print("Error:", e)
        raise HTTPException(status_code=500, detail="Error interno del servidor")

    finally:
        session.close()

# prueba
@user.post("/users/register")
def crear_usuario(user: InputRegister, payload: dict = Depends(obtener_usuario_desde_token)):
    if payload["type"] not in ["Admin"]:
        raise HTTPException(status_code=403, detail="No tienes permiso para registrar usuarios")
    try:
        # Validar si el username ya existe
        if validate_username(user.username):
            if validate_email(user.email):
                new_user = User(
                    username=user.username,
                    password=user.password,  # Asegurate de tener esta función
                )
                new_detail = UserDetail(
                    dni=None,
                    firstName=None,
                    lastName=None,
                    type="Alumno",  # Podés dejar esto en blanco o poner un valor por defecto
                    email=user.email,
                )

                session.add(new_detail)
                session.flush()  # Para que se genere el ID antes de asociar

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
        return JSONResponse(
            status_code=400, content={"detail": "Error de integridad: " + str(e)}
        )
    except Exception as e:
        session.rollback()
        return JSONResponse(
            status_code=500, content={"detail": f"Error inesperado: {str(e)}"}
        )
    finally:
        session.close()

#Crear usuario completo
# Esta ruta permite a un usuario con rol Admin registrar un nuevo usuario con todos los detalles
@user.post("/users/register/full")
def crear_usuario_completo(user: InputUser, payload: dict = Depends(obtener_usuario_desde_token)):
    if payload["type"] not in ["Admin"]:
        raise HTTPException(status_code=403, detail="No tienes permiso para registrar usuarios")
    try:
        # Validar si el username ya existe
        if validate_username(user.username):
            if validate_email(user.email):
                new_user = User(
                    username=user.username,
                    password=user.password,  # Asegurate de tener esta función
                )
                new_detail = UserDetail(
                    dni=user.dni,
                    firstName=user.firstName,
                    lastName=user.lastName,
                    type=user.type,
                    email=user.email,
                )

                session.add(new_detail)
                session.flush()  # Para que se genere el ID antes de asociar

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
        return JSONResponse(
            status_code=400, content={"detail": "Error de integridad: " + str(e)}
        )
    except Exception as e:
        session.rollback()
        return JSONResponse(
            status_code=500, content={"detail": f"Error inesperado: {str(e)}"}
        )
    finally:
        session.close()

@user.get("/users/all", response_model=List[UserOut])  # Ruta protegida con token
def obtener_usuarios(payload: dict = Depends(obtener_usuario_desde_token)):
    if payload["type"] not in ["Admin"]:
        raise HTTPException(status_code=403, detail="No tienes permiso para ver los usuarios")
    try:
        usuarios = (
            session.query(User)
            .options(joinedload(User.userdetail))  # Carga los detalles del usuario
            .all()
        )
        return usuarios
    finally:
        session.close()

@user.get("/")
def welcome():
    return "Bienvenido!!"

@user.get("/users/login/{n}")
def get_users_id(n: str):
    try:
        return session.query(User).filter(User.username == n).first()
    except Exception as ex:
        return ex


@user.post("/users/loginUser")
def login_post(userIn: InputLogin):
    try:
        user = session.query(User).filter(User.username == userIn.username).first()
        if not user.password == userIn.password:
            return JSONResponse(
                status_code=401,
                content={
                    "success": False,
                    "message": "Usuario y/o password incorrectos!",
                },
            )
        else:
            authDat = Seguridad.generar_token(user)  # Genera el token de autenticación
            if not authDat:
                return JSONResponse(
                    status_code=401,
                    content={
                        "success": False,
                        "message": "Error de generación de token!",
                    },
                )
            else:
                return JSONResponse(
                    status_code=200, content={"success": True, "token": authDat}
                )

    except Exception as e:
        print(e)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Error interno del servidor",
            },
        )


def validate_username(value):
    existing_user = session.query(User).filter(User.username == value).first()
    session.close()
    if existing_user:
        return None
        ##raise ValueError("Username already exists")
    else:
        return value


def validate_email(value):
    existing_email = session.query(UserDetail).filter(UserDetail.email == value).first()
    session.close()
    if existing_email:
        ##raise ValueError("Email already exists")
        return None
    else:
        return value


# region de userDetail
@userDetail.get("/userdetail/all")
def get_userDetails():
    try:
        return session.query(UserDetail).all()
    except Exception as e:
        print(e)


@userDetail.post("/userdetail/add")
def add_usuarDetail(userDet: InputUserDetail):
    usuNuevo = UserDetail(
        userDet.dni, userDet.firstName, userDet.lastName, userDet.type, userDet.email
    )

    session.add(usuNuevo)
    session.commit()
    return "usuario detail agregado"


# endregion de userDetail
#region rutas sin uso
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
            usuarios_con_detalles = (
                []
            )  # Convierte los usuarios en una lista de diccionarios
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
        return JSONResponse(
            status_code=500, content={"detail": "Error al obtener usuarios"}
        )
        
@user.post("/users/Register")
def crear_usuario(user: InputRegister):
    try:
        if validate_username(user.username):
            if validate_email(user.email):
                newUser = User(
                    user.username,
                    user.password,
                )
                newUserDetail = UserDetail(
                    user.dni, user.firstname, user.lastname, user.type, user.email
                )
                newUser.userdetail = newUserDetail
                session.add(newUser)
                session.commit()
                return "Usuario agregado"
            else:
                return "El email ya existe"
        else:
            return "el usuario ya existe"
    except IntegrityError as e:
        # Suponiendo que el msj de error contiene "username" para el campo duplicado
        if "username" in str(e):
            return JSONResponse(
                status_code=400, content={"detail": "Username ya existe"}
            )
        else:
            # Maneja otros errores de integridad
            print("Error de integridad inesperado:", e)
            return JSONResponse(
                status_code=500, content={"detail": "Error al agregar usuario"}
            )
    except Exception as e:
        session.rollback()
        print("Error al eliminar usuario:", e)
        return JSONResponse(
            status_code=500, content={"detail": "Error al agregar usuario"}
        )
    finally:
        session.close()

@user.delete("/users/{user_id}", response_model=dict)
def eliminar_usuario(user_id: int, payload: dict = Depends(obtener_usuario_desde_token)):
    try:
        if payload["type"] != "Admin":
            raise HTTPException(status_code=403, detail="No tienes permiso para eliminar usuarios")

        user = session.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        # Eliminar entradas de la tabla pivote (carreraUsuario)
        pivotes = session.query(UsuarioCarrera).filter(UsuarioCarrera.user_id == user_id).all()
        for pivote in pivotes:
            session.delete(pivote)

        # Eliminar carreras creadas por el usuario (si es Admin o similar)
        carreras_creadas = session.query(Carrera).filter(Carrera.user_id == user_id).all()
        for carrera in carreras_creadas:
            session.delete(carrera)

        # Eliminar pagos asociados al usuario
        pagos = session.query(Pago).filter(Pago.user_id == user_id).all()
        for pago in pagos:
            session.delete(pago)

        # Eliminar UserDetail si existe
        if user.id_userdetail:
            detalle = session.query(UserDetail).filter(UserDetail.id == user.id_userdetail).first()
            if detalle:
                session.delete(detalle)

        #  Finalmente eliminar el usuario
        session.delete(user)
        session.commit()

        return {"msg": "Usuario y datos asociados eliminados correctamente"}

    except Exception as e:
        session.rollback()
        print("Error al eliminar usuario:", e)
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
    finally:
        session.close()


#endregion rutas sin uso
from fastapi import APIRouter, Request, Depends, HTTPException, status 
from models.user import (session,InputUser,User,InputLogin,UserDetail,InputUserDetail,InputRegister,UserDetailUpdate, UserOut, UserDetailOut)
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError # Usamos IntegrityError de SQLAlchemy, no de psycopg2 directamente
from models.carrera import Carrera
from models.pago import Pago
from models.carreraUsuario import UsuarioCarrera
from auth.seguridad import obtener_usuario_desde_token, Seguridad
from sqlalchemy.orm import (joinedload,load_only)
from typing import List

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
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

        # Solo permite si:
        # - el usuario es admin
        # - o el usuario es el mismo que quiere editarse
        if payload["type"] != "Admin" and int(payload["sub"]) != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")

        if not user.userdetail:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Este usuario no tiene detalles aún")

        datos_a_actualizar = cambios.dict(exclude_unset=True)

        # Si no es admin, no permitir modificar el campo 'type'
        if payload["type"] != "Admin":
            datos_a_actualizar.pop("type", None)

        for campo, valor in datos_a_actualizar.items():
            setattr(user.userdetail, campo, valor)

        session.commit()
        return {"msg": "Actualizado correctamente"}

    except HTTPException as e: # Captura y relanza las HTTPException
        session.rollback()
        raise e
    except Exception as e:
        session.rollback()
        print("Error:", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")
    finally:
        session.close()

# prueba
@user.post("/users/register")
def crear_usuario(user: InputRegister, payload: dict = Depends(obtener_usuario_desde_token)):
    if payload["type"] not in ["Admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permiso para registrar usuarios")
    try:
        # Validar si el username ya existe
        if validate_username(user.username): 
            if validate_email(user.email): 
                new_user = User(
                    username=user.username,
                    password=user.password,  
                )
                new_detail = UserDetail(
                    dni=None,
                    firstName=None,
                    lastName=None,
                    type="Alumno",  #valor por defecto
                    email=user.email,
                )
                session.add(new_detail)
                session.flush()  # Para que se genere el ID antes de asociar
                new_user.id_userdetail = new_detail.id
                session.add(new_user)
                session.commit()
                return JSONResponse(status_code=status.HTTP_201_CREATED, content={"message": "Usuario registrado correctamente"})
            else:                
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El email ya existe")
        else:           
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El usuario ya existe")
            
    except HTTPException as http_exc:
        session.rollback() #Hace rollback si una HTTPException fue lanzada antes del commit
        raise http_exc # Relanza la excepción HTTP para que FastAPI la maneje
    except IntegrityError as e:
        session.rollback()
        
        error_message = str(e.orig) if hasattr(e, 'orig') else str(e)
        if "unique constraint" in error_message.lower():
            if "username" in error_message.lower():
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El nombre de usuario ya existe (DB)")
            elif "email" in error_message.lower():
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El email ya existe (DB)")
            elif "dni" in error_message.lower(): # Si el DNI puede ser único aquí
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El DNI ya existe (DB)")
        # Si no se pudo identificar el tipo de violación de unicidad específica
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Error de integridad: " + error_message)
    except Exception as e:
        session.rollback()
        print(f"Error inesperado: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error inesperado: {str(e)}")
    finally:
        session.close() # Mantener session.close() aquí

#Crear usuario completo
# Esta ruta permite a un usuario con rol Admin registrar un nuevo usuario con todos los detalles
@user.post("/users/register/full")
def crear_usuario_completo(user: InputUser, payload: dict = Depends(obtener_usuario_desde_token)): 
    if payload["type"] not in ["Admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permiso para registrar usuarios")
    try:
        # Valida si el username ya existe, Si validate_username devuelve un valor (no None), significa que no existe
        if validate_username(user.username): 
            # Si validate_email devuelve un valor (no None), significa que no existe
            if validate_email(user.email):
                
                if validate_dni(user.dni): 
                    new_user = User(
                        username=user.username,
                        password=user.password,  
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
                    # --- CORRECCIÓN AQUÍ: Devolver JSONResponse con 201 Created ---
                    return JSONResponse(status_code=status.HTTP_201_CREATED, content={"message": "Usuario registrado correctamente", "user_id": new_user.id})
                else:
                    # --- NUEVA CORRECCIÓN: Lanzar HTTPException para DNI existente ---
                    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El DNI ya existe")
            else:
                # --- CORRECCIÓN AQUÍ: Lanzar HTTPException para email existente ---
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El email ya existe")
        else:
            # --- CORRECCIÓN AQUÍ: Lanzar HTTPException para usuario existente ---
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El usuario ya existe")
            
    except HTTPException as http_exc:
        session.rollback() # Asegúrate de hacer rollback si una HTTPException fue lanzada antes del commit
        raise http_exc # Relanza la excepción HTTP para que FastAPI la maneje
    except IntegrityError as e:
        session.rollback()
        # Puedes intentar parsear 'e' para ser más específico con el DNI/Email/Username duplicado
        # Esto depende mucho del dialecto SQL y cómo está configurado tu ORM/DB
        error_message = str(e.orig) if hasattr(e, 'orig') else str(e)
        if "unique constraint" in error_message.lower():
            if "username" in error_message.lower():
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El nombre de usuario ya existe (DB)")
            elif "email" in error_message.lower():
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El email ya existe (DB)")
            elif "dni" in error_message.lower():
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El DNI ya existe (DB)")
        
        # Si no se pudo identificar el tipo de violación de unicidad específica
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Error de integridad en la base de datos: {error_message}")
    except Exception as e:
        session.rollback()
        print(f"Error inesperado en crear_usuario_completo: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error inesperado en el servidor: {str(e)}")
    finally:
        session.close() # Mantener session.close() aquí

@user.get("/users/all", response_model=List[UserOut]) 
def obtener_usuarios(payload: dict = Depends(obtener_usuario_desde_token)):
    if payload["type"] not in ["Admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permiso para ver los usuarios")
    try:
        usuarios = (
            session.query(User)
            .options(joinedload(User.userdetail)) 
            .all()
        )
        return usuarios
    except Exception as e:
        print(f"Error al obtener usuarios: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al obtener usuarios")
    finally:
        session.close() # Mantener session.close() aquí

@user.get("/")
def welcome():
    return "Bienvenido!!"

@user.get("/users/login/{n}")
def get_users_id(n: str):
    try:
        user_db = session.query(User).filter(User.username == n).first() # Renombrado a user_db
        if not user_db: # Añadir manejo si el usuario no se encuentra
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
        return user_db
    except HTTPException as e:
        raise e
    except Exception as ex:
        print(f"Error en get_users_id: {ex}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al obtener usuario")
    finally:
        session.close() # Mantener session.close() aquí


@user.post("/users/loginUser")
def login_post(userIn: InputLogin):
    try:
        user = session.query(User).filter(User.username == userIn.username).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario y/o password incorrectos!")
        if not user.password == userIn.password: 
             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario y/o password incorrectos!")
        
        authDat = Seguridad.generar_token(user)
        if not authDat:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Error de generación de token!")
        else:
            return JSONResponse(status_code=status.HTTP_200_OK, content={"success": True, "token": authDat})

    except HTTPException as e:
        # Si ya es una HTTPException, relanzarla
        raise e
    except Exception as e:
        print(f"Error en login_post: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")
    finally:
        session.close() 

def validate_username(value):
    existing_user = session.query(User).filter(User.username == value).first()
    if existing_user:
        return None # Devuelve None si el usuario existe
    else:
        return value # Devuelve el valor si no existe (indicando que es válido)

def validate_email(value):
    existing_email = session.query(UserDetail).filter(UserDetail.email == value).first()
    if existing_email:
        return None # Devuelve None si el email existe
    else:
        return value # Devuelve el valor si no existe (indicando que es válido)

def validate_dni(value):
    existing_dni = session.query(UserDetail).filter(UserDetail.dni == value).first()   
     
    if existing_dni:
        return None
    else:
        return value


# region de userDetail
@userDetail.get("/userdetail/all")
def get_userDetails():
    try:
        return session.query(UserDetail).all()
    except Exception as e:
        print(f"Error en get_userDetails: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al obtener detalles de usuario")
    finally:
        session.close() 

@userDetail.post("/userdetail/add")
def add_usuarDetail(userDet: InputUserDetail): 
    try:
        # Valida si el email y DNI ya existen
        if not validate_email(userDet.email):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El email ya existe")
        if not validate_dni(userDet.dni): 
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El DNI ya existe")

        usuNuevo = UserDetail(
            userDet.dni, userDet.firstName, userDet.lastName, userDet.type, userDet.email
        )

        session.add(usuNuevo)
        session.commit()
        return JSONResponse(status_code=status.HTTP_201_CREATED, content={"message": "usuario detail agregado"})
    except HTTPException as e:
        session.rollback()
        raise e
    except IntegrityError as e:
        session.rollback()
        error_message = str(e.orig) if hasattr(e, 'orig') else str(e)
        if "unique constraint" in error_message.lower():
            if "email" in error_message.lower():
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El email ya existe (DB)")
            elif "dni" in error_message.lower():
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El DNI ya existe (DB)")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Error de integridad: {error_message}")
    except Exception as e:
        session.rollback()
        print(f"Error en add_usuarDetail: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error inesperado: {str(e)}")
    finally:
        session.close()

# endregion de userDetail
@user.post("/users/login")
def login_user(us: InputLogin):
    try:
        user = session.query(User).filter(User.username == us.username).first()
        if not user:
          raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
       
        if not user.password == us.password: 
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
      
        token = Seguridad.generar_token(user)
        if not token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Error de generación de token!")
        
        res_content = {
            "status": "success",
            "token": token,
            "user": UserDetailOut.from_orm(user.userdetail) if user.userdetail else None, 
            "message": "User logged in successfully!",
        }
        return JSONResponse(status_code=status.HTTP_200_OK, content=res_content)

    except HTTPException as e:
        raise e
    except Exception as ex:
        print("Error ---->> ", ex)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")
    finally:
        session.close()

@user.get("/users/all/NOSOTROS")
def obtener_usuario_detalle(req: Request):
    try:
        has_access = Seguridad.verificar_token(req.headers)
        if "iat" not in has_access: # Si 'iat' no está, significa que hay un error de token
           raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso no autorizado: Token inválido o expirado")
        
        usuarios = session.query(User).options(joinedload(User.userdetail)).all()
        usuarios_con_detalles = [] 
        for usuario in usuarios:
            usuario_con_detalle = {
                "id": usuario.id,
                "username": usuario.username,
                "dni": usuario.userdetail.dni if usuario.userdetail else None,
                "first_Name": usuario.userdetail.firstName if usuario.userdetail else None,
                "last_Name": usuario.userdetail.lastName if usuario.userdetail else None,
                "type": usuario.userdetail.type if usuario.userdetail else None,
                "email": usuario.userdetail.email if usuario.userdetail else None,
            }
            usuarios_con_detalles.append(usuario_con_detalle)
        return JSONResponse(status_code=status.HTTP_200_OK, content=usuarios_con_detalles)
    except HTTPException as e:
        raise e
    except Exception as e:
        print("Error al obtener usuarios:", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al obtener usuarios")
    finally:
        session.close()
        
@user.post("/users/Register") 
def crear_usuario_simple(user: InputRegister): 
    try:
        if not validate_username(user.username): # Si validate_username devuelve None, el usuario ya existe
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El usuario ya existe")
        
        if not validate_email(user.email): # Si validate_email devuelve None, el email ya existe
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El email ya existe")

        newUser = User(
            username=user.username,
            password=user.password, 
        )
        newUserDetail = UserDetail(
            dni=user.dni, 
            firstName=user.firstName, 
            lastName=user.lastName,   
            type=user.type, 
            email=user.email
        )
        newUser.userdetail = newUserDetail 
        session.add(newUser)
        session.commit()
        return JSONResponse(status_code=status.HTTP_201_CREATED, content={"message": "Usuario agregado"})
    except IntegrityError as e:
        session.rollback()
        error_message = str(e.orig) if hasattr(e, 'orig') else str(e)
        if "unique constraint" in error_message.lower():
            if "username" in error_message.lower():
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username ya existe (DB)")
            elif "email" in error_message.lower():
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email ya existe (DB)")
            elif "dni" in error_message.lower(): # Si el DNI puede ser único aquí
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="DNI ya existe (DB)")
        print("Error de integridad inesperado:", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al agregar usuario")
    except Exception as e:
        session.rollback()
        print("Error inesperado:", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al agregar usuario")
    finally:
        session.close()

@user.delete("/users/{user_id}", response_model=dict)
def eliminar_usuario(user_id: int, payload: dict = Depends(obtener_usuario_desde_token)):
    try:
        if payload["type"] != "Admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permiso para eliminar usuarios")

        user_to_delete = session.query(User).filter(User.id == user_id).first()
        if not user_to_delete:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

        # Eliminar entradas de la tabla pivote (carreraUsuario)
        session.query(UsuarioCarrera).filter(UsuarioCarrera.user_id == user_id).delete(synchronize_session=False)

        # Eliminar carreras creadas por el usuario (si es Admin o similar)
        session.query(Carrera).filter(Carrera.user_id == user_id).delete(synchronize_session=False)

        # Eliminar pagos asociados al usuario
        session.query(Pago).filter(Pago.user_id == user_id).delete(synchronize_session=False)

        # Eliminar UserDetail si existe
        if user_to_delete.id_userdetail:
            session.query(UserDetail).filter(UserDetail.id == user_to_delete.id_userdetail).delete(synchronize_session=False)
        
        session.delete(user_to_delete)
        session.commit()

        return {"msg": "Usuario y datos asociados eliminados correctamente"}

    except IntegrityError as e: # Captura si hay FKs que impiden la eliminación
        session.rollback()
        
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"No se puede eliminar el usuario. Está asociado a otros registros o hay un error de integridad: {str(e.orig)}")
    except Exception as e:
        session.rollback()
        print("Error al eliminar usuario:", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error interno: {str(e)}")
    finally:
        session.close()
#endregion rutas sin uso
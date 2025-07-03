from typing import List
from fastapi import APIRouter, Depends, HTTPException
from auth.seguridad import obtener_usuario_desde_token
from models.carreraUsuario import UsuarioCarrera, UserCarreraCreate
from models.carrera import Carrera, NuevaCarrera, CarreraOutConUsuarios, session
from models.user import User
from models.carreraUsuario import UserCarreraResponse
from fastapi.responses import JSONResponse
from psycopg2 import IntegrityError
from sqlalchemy.orm import (
   joinedload,
)
carrera = APIRouter()

@carrera.post("/nuevaCarrera")
def nueva_carrera(carrera: NuevaCarrera, payload: dict = Depends(obtener_usuario_desde_token)):
    if payload["type"] != "Admin":
        raise HTTPException(status_code=403, detail="Solo el administrador puede crear carreras")
    
    try:
        nueva_carrera = Carrera(
            nombre=carrera.nombre,
            estado=carrera.estado,
            user_id=payload["sub"]  # El ID del admin creador
        )
        session.add(nueva_carrera)
        session.commit()
        return JSONResponse(status_code=200, content={"message": "Carrera creada exitosamente"})
    except IntegrityError:
        session.rollback()
        return JSONResponse(status_code=400, content={"message": "Error al crear la carrera"})
    finally:
        session.close()

@carrera.get("/misCarreras", response_model=List[UserCarreraResponse])
def ver_mis_carreras(payload: dict = Depends(obtener_usuario_desde_token)):
    try:
        carreras = session.query(UsuarioCarrera).filter_by(user_id=payload["sub"]).all()
        return carreras
    finally:
        session.close()


@carrera.post("/asignarCarrera")
def asignar_carrera(datos: UserCarreraCreate, payload: dict = Depends(obtener_usuario_desde_token)):
    if payload["type"] != "Admin":
        raise HTTPException(status_code=403, detail="Solo el administrador puede asignar carreras")

    try:
        nueva_asignacion = UsuarioCarrera(
            user_id=datos.user_id,
            carrera_id=datos.carrera_id,
            estado=datos.estado
        )
        session.add(nueva_asignacion)
        session.commit()
        return JSONResponse(status_code=200, content={"message": "Carrera asignada al usuario exitosamente"})
    except IntegrityError:
        session.rollback()
        return JSONResponse(status_code=400, content={"message": "Error al asignar carrera"})
    finally:
        session.close()


@carrera.get("/carrera/todas", response_model=List[CarreraOutConUsuarios])
def ver_todas_las_carreras(payload: dict = Depends(obtener_usuario_desde_token)):
    if payload["type"] not in ["Admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    try:
        carreras = session.query(Carrera).options(
            joinedload(Carrera.usuarios_asociados)
            .joinedload(UsuarioCarrera.user)
            .joinedload(User.userdetail)  # 👈 carga también los datos personales
        ).all()
        return carreras
    finally:
        session.close()

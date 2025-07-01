from typing import List
from fastapi import APIRouter, Depends, HTTPException
from auth.seguridad import obtener_usuario_desde_token
from models.carrera import Carrera, CarreraOut, NuevaCarrera, session
from fastapi.responses import JSONResponse
from psycopg2 import IntegrityError
from sqlalchemy.orm import joinedload  # ya lo tenías importado
from models.user import User


carrera = APIRouter()

@carrera.post("/nuevaCarrera")
def nueva_carrera(carrera: NuevaCarrera):
    try:
        nueva_carrera = Carrera(
            nombre=carrera.nombre,
            estado=carrera.estado,
            user_id=carrera.user_id
        )
        session.add(nueva_carrera)
        session.commit()
        return JSONResponse(status_code=200, content={"message": "Carrera creada exitosamente"})
    except IntegrityError:
        session.rollback()
        return JSONResponse(status_code=400, content={"message": "Error al crear la carrera"})
    finally:
        session.close()

@carrera.get("/carrera/todas", response_model=List[CarreraOut])  # para que el ADMIN vea TODAS las carreras
def ver_todas_las_carreras(payload: dict = Depends(obtener_usuario_desde_token)):
    if payload["type"] not in ["Admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    try:
        carreras = session.query(Carrera).options(
            joinedload(Carrera.user).joinedload(User.userdetail)  # ← para traer nombre/apellido
        ).all()
        return carreras
    finally:
        session.close()

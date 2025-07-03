from typing import List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from auth.seguridad import obtener_usuario_desde_token
from sqlalchemy.orm import joinedload
from psycopg2 import IntegrityError

from models.carrera import Carrera, CarreraOut, NuevaCarrera, session
from models.user import User

carrera = APIRouter()

# Crear nueva carrera (Admin only)
@carrera.post("/nuevaCarrera")
def nueva_carrera(carrera: NuevaCarrera, payload: dict = Depends(obtener_usuario_desde_token)):
    if payload["type"] != "Admin":
        raise HTTPException(status_code=403, detail="Solo el Admin puede crear carreras")

    try:
        nueva = Carrera(
            nombre=carrera.nombre,
            estado=carrera.estado or "activa",  # ⚠ estado opcional
            user_id=carrera.user_id
        )
        session.add(nueva)
        session.commit()
        return JSONResponse(status_code=200, content={"message": "Carrera creada exitosamente"})
    except IntegrityError:
        session.rollback()
        return JSONResponse(status_code=400, content={"message": "Error al crear la carrera"})
    except Exception as e:
        session.rollback()
        return JSONResponse(status_code=500, content={"message": f"Error inesperado: {str(e)}"})
    finally:
        session.close()

# Obtener todas las carreras (solo Admin)
@carrera.get("/carrera/todas", response_model=List[CarreraOut])
def ver_todas_las_carreras(payload: dict = Depends(obtener_usuario_desde_token)):
    if payload["type"] != "Admin":
        raise HTTPException(status_code=403, detail="No autorizado")
    
    try:
        carreras = session.query(Carrera).options(
            joinedload(Carrera.user).joinedload(User.userdetail)  # ← trae nombre/apellido del creador
        ).all()
        return carreras
    finally:
        session.close()

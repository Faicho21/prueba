from models.carrera import Carrera
from pydantic import BaseModel
from sqlalchemy.orm import joinedload
from typing import List
from fastapi import Depends, HTTPException
from auth.seguridad import obtener_usuario_desde_token
from models.carreraUsuario import UsuarioCarrera, session
from fastapi import APIRouter

router = APIRouter()

class CarreraInscriptoOut(BaseModel):
    inscripcion_id: int
    carrera_id: int
    nombre_carrera: str
    estado_alumno: str

    class Config:
        orm_mode = True

@router.get("/mis-carreras", response_model=List[CarreraInscriptoOut])
def ver_mis_carreras(payload: dict = Depends(obtener_usuario_desde_token)):
    if payload["type"] != "Alumno":
        raise HTTPException(status_code=403, detail="Solo los alumnos pueden ver sus carreras")

    try:
        inscripciones = (
            session.query(UsuarioCarrera)
            .options(joinedload(UsuarioCarrera.carrera))
            .filter(UsuarioCarrera.user_id == payload["sub"])
            .all()
        )

        resultado = []
        for i in inscripciones:
            resultado.append(CarreraInscriptoOut(
                inscripcion_id=i.id,
                carrera_id=i.carrera.id,
                nombre_carrera=i.carrera.nombre,
                estado_alumno=i.estado_alumno  # ✅ corregido: igual, no guion
            ))

        return resultado

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Error al obtener tus carreras: {str(e)}")
    finally:
        session.close()

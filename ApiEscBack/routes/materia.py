from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from models.materia import Materia, InputMateria, session
from auth.seguridad import obtener_usuario_desde_token
from sqlalchemy.orm import joinedload
from typing import List
from pydantic import BaseModel

materia = APIRouter()

# ------------------------
# Crear materia (solo Admin o Profesor)
@materia.post("/materias")
def ingresar_materia(materia_data: InputMateria, payload: dict = Depends(obtener_usuario_desde_token)):
    if payload["type"] not in ["Admin", "Profesor"]:
        raise HTTPException(status_code=403, detail="No tienes permiso para registrar materias")

    try:
        new_materia = Materia(
            materia_data.nombre,
            materia_data.estado,
            materia_data.user_id,
            materia_data.career_id
        )
        session.add(new_materia)
        session.commit()
        return {"message": "Materia agregada correctamente"}
    except Exception as e:
        session.rollback()
        print("Error inesperado:", e)
        return JSONResponse(status_code=500, content={"detail": "Error al agregar materia"})
    finally:
        session.close()

# ------------------------
# Modelo de respuesta
class MateriaOut(BaseModel):
    id: int
    nombre: str
    estado: str
    user_id: int
    career_id: int

    class Config:
        orm_mode = True

# Obtener todas las materias (solo Admin)
@materia.get("/materias", response_model=List[MateriaOut])
def consultar_materias(payload: dict = Depends(obtener_usuario_desde_token)):
    if payload["type"] != "Admin":
        raise HTTPException(status_code=403, detail="No autorizado")
    
    try:
        materias = session.query(Materia).options(joinedload(Materia.usuario)).all()
        return materias
    except Exception as e:
        print("Error al obtener materias:", e)
        raise HTTPException(status_code=500, detail="Error al obtener materias")
    finally:
        session.close()

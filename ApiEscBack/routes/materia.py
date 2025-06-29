from fastapi import APIRouter
from models.materia import Materia, InputMateria, session
from fastapi.responses import JSONResponse
from sqlalchemy.orm import joinedload

materia = APIRouter()

@materia.post("/RMateria")
def ingresar_materia(materia: InputMateria):
    try:
        new_materia = Materia(materia.nombre, materia.estado, materia.user_id, materia.career_id)
        session.add(new_materia)
        session.commit()
        return "materia agregada"
    except Exception as e:
       session.rollback()
       print("Error inesperado:", e)
       return JSONResponse(
           status_code=500, content={"detail": "Error al agregar materia"}
       )
    finally:
       session.close()

@materia.get("/misMaterias")
def consultar_materias():
    try:
        materias = session.query(Materia).options(joinedload(Materia.usuario)).all()
        ver_materias = []
        for materia in materias:
            ver_materia = {
                "id": materia.id,
                "nombre": materia.nombre,
                "estado": materia.estado,
                "user_id": materia.user_id,
                "career_id": materia.career_id,
            }
            ver_materias.append(ver_materia)
        return JSONResponse(status_code=200, content=ver_materias)
    except Exception as e:
        print("Error al obtener materias:", e)
        return JSONResponse(
            status_code=500, content={"detail": "Error al obtener materias"}
        ) 
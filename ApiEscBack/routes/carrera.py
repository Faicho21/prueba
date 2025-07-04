from typing import List
from fastapi import APIRouter, Depends, HTTPException
from auth.seguridad import obtener_usuario_desde_token
from models.pago import Pago  # Asegúrate de que este modelo esté importado
from models.carrera import Carrera, CarreraOut, NuevaCarrera, CarreraUpdate, session
from models.carreraUsuario import UsuarioCarrera, UserCarreraCreate
from fastapi.responses import JSONResponse
from psycopg2 import IntegrityError
from sqlalchemy.orm import joinedload  # ya lo tenías importado
from models.user import User, UserDetail


carrera = APIRouter()

@carrera.post("/nuevaCarrera")
def nueva_carrera(carrera: NuevaCarrera):
    try:
        nueva_carrera = Carrera(
            nombre=carrera.nombre,
            estado=carrera.estado,
            
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

@carrera.post("/carrera/inscribir-alumno", response_model=dict)
def inscribir_alumno_carrera(
    inscripcion: UserCarreraCreate,
    payload: dict = Depends(obtener_usuario_desde_token)
):
    
    # **Verificación de autorización modificada: Solo 'Admin' puede usar esta ruta.**
    if payload["type"] != "Admin":
        raise HTTPException(status_code=403, detail="No tienes permiso para inscribir alumnos en carreras. Solo los administradores pueden realizar esta acción.")

    try:
        # Verificar si la carrera existe
        carrera_existente = session.query(Carrera).filter(Carrera.id == inscripcion.carrera_id).first()
        if not carrera_existente:
            raise HTTPException(status_code=404, detail="Carrera no encontrada.")

        # Verificar si el usuario existe y obtener su tipo
        alumno_a_inscribir = session.query(User).options(joinedload(User.userdetail)).filter(User.id == inscripcion.user_id).first()
        if not alumno_a_inscribir:
            raise HTTPException(status_code=404, detail="Alumno no encontrado.")

        # Opcional: Asegurarse de que solo los usuarios de tipo 'Alumno' puedan ser inscritos (siempre lo verifica el Admin)
        if alumno_a_inscribir.userdetail and alumno_a_inscribir.userdetail.type != "Alumno":
             raise HTTPException(status_code=400, detail=f"Solo se pueden inscribir usuarios de tipo 'Alumno'. El usuario '{alumno_a_inscribir.username}' es de tipo '{alumno_a_inscribir.userdetail.type}'.")

        # Verificar si el alumno ya está inscrito en esta carrera
        inscripcion_existente = session.query(UsuarioCarrera).filter(
            UsuarioCarrera.user_id == inscripcion.user_id,
            UsuarioCarrera.carrera_id == inscripcion.carrera_id
        ).first()

        if inscripcion_existente:
            raise HTTPException(status_code=409, detail="El alumno ya está inscrito en esta carrera.")

        # Crear la nueva entrada en la tabla pivote
        nueva_inscripcion = UsuarioCarrera(
            user_id=inscripcion.user_id,
            carrera_id=inscripcion.carrera_id
        )
        session.add(nueva_inscripcion)
        session.commit()
        return {"message": "Alumno inscrito en la carrera exitosamente."}

    except HTTPException as e:
        session.rollback()
        raise e
    except IntegrityError as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=f"Error de base de datos al inscribir alumno: {str(e)}")
    except Exception as e:
        session.rollback()
        print(f"Error inesperado al inscribir alumno: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor al inscribir alumno.")
    finally:
        session.close()
        
        
@carrera.patch("/carrera/{carrera_id}", response_model=dict)
def actualizar_parcial_carrera(
    carrera_id: int,
    cambios: CarreraUpdate, # Usamos el modelo Pydantic para los cambios
    payload: dict = Depends(obtener_usuario_desde_token),
):
    """
    Actualiza parcialmente los detalles de una carrera existente.
    Solo los usuarios con rol 'Admin' pueden realizar esta acción.
    """
    
    if payload["type"] != "Admin":
        raise HTTPException(status_code=403, detail="No tienes permiso para editar carreras. Solo los administradores pueden realizar esta acción.")

    try:        
        carrera_a_actualizar = session.query(Carrera).filter(Carrera.id == carrera_id).first()
        if not carrera_a_actualizar:
            raise HTTPException(status_code=404, detail="Carrera no encontrada.")
        # 3. Obtener los datos a actualizar que no son None (es decir, los que se enviaron en la solicitud)
        datos_a_actualizar = cambios.dict(exclude_unset=True)

        for campo, valor in datos_a_actualizar.items():
            setattr(carrera_a_actualizar, campo, valor)

        session.commit()
        
        session.refresh(carrera_a_actualizar)

        return {"message": "Carrera actualizada correctamente."}

    except HTTPException as e:
        session.rollback() # Asegurarse de hacer rollback si hay una HTTPException
        raise e
    except Exception as e:
        session.rollback() # Hacer rollback en caso de cualquier otro error
        print(f"Error al actualizar la carrera: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor al actualizar la carrera: {str(e)}")
    finally:
        session.close()
        
@carrera.delete("/eliminarCarrera/{carrera_id}", response_model=dict)
def eliminar_carrera(
    carrera_id: int,
    payload: dict = Depends(obtener_usuario_desde_token),
):
    """
    Elimina una carrera existente y sus asociaciones.
    Solo los usuarios con rol 'Admin' pueden realizar esta acción.
    """
    # 1. **Verificación de Autorización:** Solo Admin
    if payload["type"] != "Admin":
        raise HTTPException(status_code=403, detail="No tienes permiso para eliminar carreras. Solo los administradores pueden realizar esta acción.")

    try:
        # 2. Buscar la carrera por su ID
        carrera_a_eliminar = session.query(Carrera).filter(Carrera.id == carrera_id).first()

        if not carrera_a_eliminar:
            raise HTTPException(status_code=404, detail="Carrera no encontrada.")

        
        session.query(UsuarioCarrera).filter(UsuarioCarrera.carrera_id == carrera_id).delete(synchronize_session=False)
        session.query(Pago).filter(Pago.carrera_id == carrera_id).delete(synchronize_session=False)
        session.delete(carrera_a_eliminar)
        session.commit()

        return {"message": "Carrera eliminada correctamente."}

    except HTTPException as e:
        session.rollback() # Asegurarse de hacer rollback si hay una HTTPException
        raise e
    except IntegrityError as e:
        session.rollback()
        # Este error se manejaría si olvidaste eliminar alguna tabla asociada (FK)
        raise HTTPException(status_code=400, detail=f"Error de integridad al eliminar la carrera. Puede haber datos relacionados no eliminados: {str(e)}")
    except Exception as e:
        session.rollback() # Hacer rollback en caso de cualquier otro error
        print(f"Error al eliminar la carrera: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor al eliminar la carrera: {str(e)}")
    finally:
        session.close()
      
@carrera.get("/carrera/{carrera_id}/alumnos")
def alumnos_por_carrera(
    carrera_id: int,
    payload: dict = Depends(obtener_usuario_desde_token)
):
    if payload["type"] not in ["Admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")

    try:
        alumnos = (
            session.query(User)
            .join(UsuarioCarrera, UsuarioCarrera.user_id == User.id)
            .join(UserDetail, User.id_userdetail == UserDetail.id)
            .filter(UsuarioCarrera.carrera_id == carrera_id)
            .all()
        )

        return [
            {
                "id": alumno.id,
                "username": alumno.username,
                "userdetail": {
                    "firstName": alumno.userdetail.firstName,
                    "lastName": alumno.userdetail.lastName
                }
            }
            for alumno in alumnos
        ]
    except Exception as e:
        print("Error al obtener alumnos de la carrera:", e)
        raise HTTPException(status_code=500, detail="Error al obtener alumnos")
    finally:
        session.close()       
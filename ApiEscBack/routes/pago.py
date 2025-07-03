from fastapi import APIRouter, Request, Depends, HTTPException
from typing import List
from auth.seguridad import obtener_usuario_desde_token
from models.pago import Pago, NuevoPago, session, PagoOut, EditarPago
from models.user import User
from fastapi.responses import JSONResponse
from psycopg2 import IntegrityError
from sqlalchemy.orm import joinedload

pago = APIRouter()

# Crear un nuevo pago (solo Admin)
@pago.post("/pago/nuevo")
def nuevo_pago(pago: NuevoPago, payload: dict = Depends(obtener_usuario_desde_token)):
    if payload["type"] != "Admin":
        return JSONResponse(status_code=403, content={"message": "No tienes permiso para ingresar pagos"})

    try:
        nuevo_pago = Pago(
            carrera_id=pago.carrera_id,
            user_id=pago.user_id,
            monto=pago.monto,
            mes=pago.mes
        )
        session.add(nuevo_pago)
        session.commit()
        return JSONResponse(status_code=200, content={"message": "Pago creado exitosamente"})
    except IntegrityError:
        session.rollback()
        return JSONResponse(status_code=400, content={"message": "Error al crear el pago"})
    finally:
        session.close()

# Eliminar un pago (solo Admin)
@pago.delete("/pago/{pago_id}")
def eliminar_pago(pago_id: int, payload: dict = Depends(obtener_usuario_desde_token)):
    if payload["type"] != "Admin":
        return JSONResponse(status_code=403, content={"message": "Solo el administrador puede eliminar pagos"})

    try:
        pago_obj = session.query(Pago).filter_by(id=pago_id).first()
        if not pago_obj:
            return JSONResponse(status_code=404, content={"message": "Pago no encontrado"})

        session.delete(pago_obj)
        session.commit()
        return {"message": "Pago eliminado"}
    finally:
        session.close()

# Modificar un pago completo (solo Admin)
@pago.put("/pago/{pago_id}")
def modificar_pago(pago_id: int, pago: NuevoPago, payload: dict = Depends(obtener_usuario_desde_token)):
    if payload["type"] != "Admin":
        return JSONResponse(status_code=403, content={"message": "Solo el administrador puede modificar pagos"})

    try:
        pago_existente = session.query(Pago).filter_by(id=pago_id).first()
        if not pago_existente:
            return JSONResponse(status_code=404, content={"message": "Pago no encontrado"})

        pago_existente.carrera_id = pago.carrera_id
        pago_existente.user_id = pago.user_id
        pago_existente.monto = pago.monto
        pago_existente.mes = pago.mes
        session.commit()

        return {"message": "Pago modificado correctamente"}
    finally:
        session.close()

# Modificar un pago parcialmente (solo Admin)
@pago.patch("/pago/{pago_id}")
def editar_pago_parcial(pago_id: int, datos_actualizados: EditarPago, payload: dict = Depends(obtener_usuario_desde_token)):
    if payload["type"] != "Admin":
        return JSONResponse(status_code=403, content={"message": "Solo el administrador puede modificar pagos"})

    try:
        pago_existente = session.query(Pago).filter_by(id=pago_id).first()
        if not pago_existente:
            return JSONResponse(status_code=404, content={"message": "Pago no encontrado"})

        if datos_actualizados.user_id is not None:
            pago_existente.user_id = datos_actualizados.user_id
        if datos_actualizados.carrera_id is not None:
            pago_existente.carrera_id = datos_actualizados.carrera_id
        if datos_actualizados.monto is not None:
            pago_existente.monto = datos_actualizados.monto
        if datos_actualizados.mes is not None:
            pago_existente.mes = datos_actualizados.mes

        session.commit()
        return {"message": "Pago modificado parcialmente"}
    finally:
        session.close()

# Ver todos los pagos (solo Admin)
@pago.get("/pago/todos", response_model=List[PagoOut])
def ver_todos_los_pagos(payload: dict = Depends(obtener_usuario_desde_token)):
    if payload["type"] != "Admin":
        raise HTTPException(status_code=403, detail="No autorizado")

    try:
        pagos = session.query(Pago).all()
        return pagos
    finally:
        session.close()

# Ver los pagos del alumno autenticado
@pago.get("/pago/mis_pagos", response_model=List[PagoOut])
def ver_mis_pagos(payload: dict = Depends(obtener_usuario_desde_token)):
    if payload["type"] != "Alumno":
        raise HTTPException(status_code=403, detail="Solo los alumnos pueden ver estos pagos")

    try:
        pagos = session.query(Pago).filter(Pago.user_id == payload["sub"]).all()
        return pagos
    finally:
        session.close()

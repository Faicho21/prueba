from fastapi import APIRouter, Request, Depends, HTTPException
from typing import List
from auth.seguridad import obtener_usuario_desde_token
from models.pago import Pago, NuevoPago, session, PagoOut, EditarPago
from models.user import User
from auth.seguridad import Seguridad
from fastapi.responses import JSONResponse
from psycopg2 import IntegrityError
from sqlalchemy.orm import (
   joinedload,
)

pago = APIRouter()

@pago.post("/nuevoPago") # Ruta protegida para que el ADMIN ingrese un nuevo pago
def nuevo_pago(pago: NuevoPago, payload: dict = Depends(obtener_usuario_desde_token)):
    if payload["type"] != "Admin":
        raise JSONResponse(status_code=403, detail="No tienes permiso para ingresar pagos")
        
    
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

@pago.delete("/eliminarPago/{pago_id}") # Ruta protegida para que el ADMIN elimine un pago
def eliminar_pago(pago_id: int, payload: dict = Depends(obtener_usuario_desde_token)):
    
    if payload["type"] != "Admin":
        raise JSONResponse(status_code=403, detail="Solo el administrador puede eliminar pagos")

    try:
        pago = session.query(Pago).filter_by(id=pago_id).first()
        if not pago:
            return JSONResponse(status_code=404, content={"message": "Pago no encontrado"})

        session.delete(pago)
        session.commit()
        return {"message": "Pago eliminado"}
    finally:
        session.close()

@pago.put("/editarPago/{pago_id}") # Ruta protegida para que el ADMIN modifique un pago
def modificar_pago(pago_id: int, pago: NuevoPago, payload: dict = Depends(obtener_usuario_desde_token)):
    if payload["type"] != "Admin":
        raise JSONResponse(status_code=403, detail="Solo el administrador puede modificar pagos")
    
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

@pago.get("/pago/todos", response_model=List[PagoOut])       #para que el ADMIN vea TODOS los pagos
def ver_todos_los_pagos(payload: dict = Depends(obtener_usuario_desde_token)):
    if payload["type"] not in ["Admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    try:
        pagos = session.query(Pago).all()
        return pagos
    finally:
        session.close()
        
@pago.get("/pago/mis_pagos")
def ver_mis_pagos(payload: dict = Depends(obtener_usuario_desde_token)):
    if payload["type"] != "Alumno":
        raise HTTPException(status_code=403, detail="Solo los alumnos pueden ver estos pagos")
    
    try:
        user = session.query(User).filter_by(id=payload["sub"]).first()
        if user:
            return user.pago
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    finally:
        session.close()

@pago.patch("/editarPago/{pago_id}")  # Ruta protegida para modificación parcial
def editar_pago_parcial(
    pago_id: int,
    datos_actualizados: EditarPago,
    payload: dict = Depends(obtener_usuario_desde_token)
):
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

# routes/pagos_search.py
from __future__ import annotations
from typing import Any, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import cast, String

from config.db import get_db
from utils.pagination import apply_search_ilike, apply_sort, paginate, build_response
from routes.pagination_types import PaginatedRequest

# ⚠️ Ajustá estos imports si tus modelos están en otro archivo o tienen otro nombre
from models.pago import Pago
from models.carrera import Carrera   # solo si tu Pago tiene FK a Carrera

router = APIRouter(prefix="/pagos", tags=["Pagos - Search"])

# Campos permitidos para ordenar
ALLOWED_SORT = {
    "id": Pago.id,
    "monto": Pago.monto,
    "mes": Pago.mes,
}
DEFAULT_SORT = ("id", Pago.id)

# Columnas para búsqueda
SEARCH_COLS = [
    cast(Pago.monto, String),
    Pago.mes,
]

def serialize_pago(p: Pago) -> Dict[str, Any]:
    return {
        "id": p.id,
        "monto": float(p.monto) if hasattr(p.monto, "quantize") else p.monto,
        "mes": p.mes,
        "carrera": getattr(p, "carrera", None) and {
            "id": p.carrera.id,
            "nombre": p.carrera.nombre
        },
    }

@router.post("/search")
def search_pagos(req: PaginatedRequest, db: Session = Depends(get_db)):
    # joinedload para traer Carrera de una vez (sacalo si no tenés relación)
    q = db.query(Pago).options(joinedload(Pago.carrera))
    q = apply_search_ilike(q, req.search or "", SEARCH_COLS)
    q = apply_sort(q, req.sort.dict() if req.sort else None, ALLOWED_SORT, DEFAULT_SORT)
    items, total = paginate(q, req.page, req.page_size)
    data = [serialize_pago(x) for x in items]
    return build_response(data, total, req.page, req.page_size)

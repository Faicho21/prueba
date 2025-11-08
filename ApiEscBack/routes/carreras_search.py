# routes/carreras_search.py
from __future__ import annotations
from typing import Any, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from config.db import get_db
from utils.pagination import apply_search_ilike, apply_sort, paginate, build_response
from routes.pagination_types import PaginatedRequest

# ⚠️ Ajustá el import si tu modelo está en otro archivo/nombre
from models.carrera import Carrera

router = APIRouter(prefix="/carreras", tags=["Carreras - Search"])

# Campos permitidos para ordenar
ALLOWED_SORT = {
    "id": Carrera.id,
    "nombre": Carrera.nombre,
    # Incluí estado si existe en tu modelo:
    # "estado": Carrera.estado,
}
DEFAULT_SORT = ("nombre", Carrera.nombre)

# Columnas para búsqueda (por nombre)
SEARCH_COLS = [Carrera.nombre]

def serialize_carrera(c: Carrera) -> Dict[str, Any]:
    return {
        "id": c.id,
        "nombre": c.nombre,
        # "estado": getattr(c, "estado", None),
    }

@router.post("/search")
def search_carreras(req: PaginatedRequest, db: Session = Depends(get_db)):
    q = db.query(Carrera)
    q = apply_search_ilike(q, req.search or "", SEARCH_COLS)
    q = apply_sort(q, req.sort.dict() if req.sort else None, ALLOWED_SORT, DEFAULT_SORT)
    items, total = paginate(q, req.page, req.page_size)
    data = [serialize_carrera(x) for x in items]
    return build_response(data, total, req.page, req.page_size)

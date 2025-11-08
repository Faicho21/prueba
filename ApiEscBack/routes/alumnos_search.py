# routes/alumnos_search.py
from __future__ import annotations
from typing import Any, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from config.db import get_db
from utils.pagination import apply_search_ilike, apply_sort, paginate, build_response
from routes.pagination_types import PaginatedRequest  # lo creamos antes

# ⚠️ Si tu modelo se llama distinto, ajustá este import:
from models.alumno import Alumno

router = APIRouter(prefix="/alumnos", tags=["Alumnos - Search"])

# Campos permitidos para ordenar (whitelist)
ALLOWED_SORT = {
    "id": Alumno.id,
    "apellido": Alumno.apellido,
    "nombre": Alumno.nombre,
    "dni": Alumno.dni,
}
DEFAULT_SORT = ("apellido", Alumno.apellido)

# Columnas donde aplicar búsqueda ILIKE
SEARCH_COLS = [Alumno.apellido, Alumno.nombre, Alumno.dni]

def serialize_alumno(a: Alumno) -> Dict[str, Any]:
    return {
        "id": a.id,
        "apellido": a.apellido,
        "nombre": a.nombre,
        "dni": a.dni,
    }

@router.post("/search")
def search_alumnos(req: PaginatedRequest, db: Session = Depends(get_db)):
    q = db.query(Alumno)
    q = apply_search_ilike(q, req.search or "", SEARCH_COLS)
    q = apply_sort(q, req.sort.dict() if req.sort else None, ALLOWED_SORT, DEFAULT_SORT)
    items, total = paginate(q, req.page, req.page_size)
    data = [serialize_alumno(x) for x in items]
    return build_response(data, total, req.page, req.page_size)

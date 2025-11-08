from __future__ import annotations  # 👈 debe ser la PRIMERA línea

from typing import Any, Dict, Iterable, Mapping, Tuple
from sqlalchemy.orm import Query
from sqlalchemy import or_, asc, desc

# Búsqueda ILIKE sobre columnas whitelist
def apply_search_ilike(query: Query, search: str, columns: Iterable[Any]) -> Query:
    if not search:
        return query
    s = (search or "").strip()
    if not s:
        return query
    conds = [col.ilike(f"%{s}%") for col in columns if col is not None]
    return query.filter(or_(*conds)) if conds else query

# Orden seguro por columnas permitidas
def apply_sort(
    query: Query,
    sort_spec: Dict[str, Any] | None,
    allowed: Mapping[str, Any],
    default: Tuple[str, Any] | None = None
) -> Query:
    if sort_spec:
        field = sort_spec.get("field")
        direction = (sort_spec.get("dir") or "asc").lower()
        if field in allowed:
            col = allowed[field]
            return query.order_by(desc(col) if direction == "desc" else asc(col))
    if default:
        _, col = default
        return query.order_by(col)
    return query

# Paginación simple (count + offset/limit)
def paginate(query: Query, page: int, page_size: int) -> tuple[list[Any], int]:
    total = query.count()
    page = max(1, page or 1)
    page_size = max(1, min(page_size or 20, 200))
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return items, total

# Respuesta estandarizada
def build_response(items: list[Dict[str, Any]] | list[Any], total: int, page: int, page_size: int) -> Dict[str, Any]:
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }

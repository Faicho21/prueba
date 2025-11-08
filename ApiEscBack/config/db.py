# config/db.py
from __future__ import annotations

import os
from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import declarative_base, sessionmaker

# --------------------------------------------------------------------
# 1) DATABASE URL (lee de env; mantiene tu valor por defecto)
#    Ejemplos de uso:
#      - Windows (PowerShell):  $env:DATABASE_URL="postgresql://postgres:1234@localhost:5432/escuela"
#      - Linux/Mac (bash):      export DATABASE_URL="postgresql://postgres:1234@localhost:5432/escuela"
# --------------------------------------------------------------------
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:1234@localhost:5432/escuela",
)

# --------------------------------------------------------------------
# 2) Naming convention para constraints (FK/PK/IX) — clave con tablas pivote
#    Evita nombres raros y hace migraciones de Alembic más predecibles.
# --------------------------------------------------------------------
NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}
metadata = MetaData(naming_convention=NAMING_CONVENTION)

# --------------------------------------------------------------------
# 3) Base y Engine
# --------------------------------------------------------------------
Base = declarative_base(metadata=metadata)

# pool_pre_ping ayuda a recuperar conexiones caídas
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    future=True,          # SQLAlchemy 2.0-style
)

# --------------------------------------------------------------------
# 4) Session factory (sin autocommit/autoflush)
# --------------------------------------------------------------------
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    future=True,
)

# --------------------------------------------------------------------
# 5) Dependencia para FastAPI (inyección de sesión por request)
# --------------------------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --------------------------------------------------------------------
# 6) Init opcional: crear tablas (si no usás Alembic aún)
#    Llamar una sola vez o desde un script de setup:
#       from config.db import init_db
#       init_db()
# --------------------------------------------------------------------
def init_db():
    # IMPORTANTE: importar los modelos aquí para que Base conozca todas las tablas,
    # incluidas las tablas pivote/association.
    # Ejemplo (ajustá a tus rutas reales):
    # from models.user import User, UserDetail
    # from models.carrera import Carrera
    # from models.materia import Materia
    # from models.pago import Pago
    # from models.carreraUsuario import UsuarioCarrera  # <— tu tabla pivote
    Base.metadata.create_all(bind=engine)

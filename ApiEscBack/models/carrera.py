from config.db import engine, Base
from sqlalchemy import Integer, ForeignKey, String, Column
from sqlalchemy.orm import sessionmaker, relationship
from pydantic import BaseModel
from typing import Optional

# ───── MODELO SQLALCHEMY ─────
class Carrera(Base):
    __tablename__ = "carreras"

    id = Column("id", Integer, primary_key=True)
    nombre = Column("nombre", String)
    estado = Column("estado", String)  # ⚠️ Obsoleto, mantener por compatibilidad
    user_id = Column(ForeignKey("usuarios.id"))

    materias = relationship("Materia", back_populates="carrera")
    userspivote = relationship("UsuarioCarrera", back_populates="carrera")

    user = relationship("User")  # Permite acceder a user.userdetail desde carrera

    def __init__(self, nombre, estado, user_id):
        self.nombre = nombre
        self.estado = estado
        self.user_id = user_id

# ───── Pydantic Schemas ─────

class NuevaCarrera(BaseModel):
    nombre: str
    estado: Optional[str] = "activa"  # ⚠️ Lo dejamos opcional para evitar errores
    user_id: int

class UserDetailOut(BaseModel):
    firstName: Optional[str]
    lastName: Optional[str]

class UserOut(BaseModel):
    id: int
    userdetail: Optional[UserDetailOut]

class CarreraOut(BaseModel):
    id: int
    nombre: str
    estado: Optional[str]
    user_id: int
    user: Optional[UserOut]

    class Config:
        orm_mode = True

# ───── Sesión ─────
Session = sessionmaker(bind=engine)
session = Session()

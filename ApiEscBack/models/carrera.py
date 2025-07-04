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
    estado = Column("estado", String)
    user_id = Column(ForeignKey("usuarios.id"))

    # Relaciones existentes
    materias = relationship("Materia", back_populates="carrera")
    userspivote = relationship("UsuarioCarrera", back_populates="carrera")

    # 🚨 Nueva relación: para acceder al usuario creador
    user = relationship("User")  # Esto permite acceder a user.userdetail desde carrera

    def __init__(self, nombre, estado):
        self.nombre = nombre
        self.estado = estado
        

# ───── Pydantic Schemas ─────

class NuevaCarrera(BaseModel):
    nombre: str
    estado: str
    

# Para mostrar el nombre/apellido del responsable
class UserDetailOut(BaseModel):
    firstName: Optional[str]
    lastName: Optional[str]

class UserOut(BaseModel):
    id: int
    userdetail: Optional[UserDetailOut]

# Carrera extendida
class CarreraOut(BaseModel):
    id: int
    nombre: str
    estado: str    
    user: Optional[UserOut]  # ← Esto habilita mostrar nombre/apellido en el frontend

    class Config:
        orm_mode = True

class CarreraUpdate(BaseModel):
    nombre: Optional[str] = None
    estado: Optional[str] = None
        
    class Config:
        orm_mode = True
        

# ───── Sesión ─────
Session = sessionmaker(bind=engine)
session = Session()

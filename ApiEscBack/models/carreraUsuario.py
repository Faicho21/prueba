from config.db import engine, Base
from sqlalchemy import Column, Integer,  ForeignKey, String
from sqlalchemy.orm import sessionmaker, relationship
from typing import Optional
from models.user import UserDetailOut
from pydantic import BaseModel

class UsuarioCarrera(Base):
    __tablename__ = "carrera_usuario"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    carrera_id = Column(Integer, ForeignKey("carreras.id"), nullable=False)
    estado = Column(String, default="cursando")  # ejemplo: "cursando", "egresado", "baja"

    user = relationship("User", back_populates="carreras_asociadas")
    carrera = relationship("Carrera", back_populates="usuarios_asociados")

    def __init__(self, user_id, carrera_id, estado="cursando"):
        self.user_id = user_id
        self.carrera_id = carrera_id
        self.estado = estado

class UserCarreraCreate(BaseModel): 
    user_id: int
    carrera_id: int
    estado: str = "cursando"

class UserCarreraResponse(BaseModel):
    id: int
    user_id: int
    carrera_id: int
    estado: str
    user: Optional["UserOutSimple"]  # 👈 incluimos datos básicos del usuario

    class Config:
        orm_mode = True

class UserOutSimple(BaseModel):
    id: int
    userdetail: Optional[UserDetailOut]

    class Config:
        orm_mode = True

Session = sessionmaker(bind=engine)
session = Session()
UserCarreraResponse.update_forward_refs()

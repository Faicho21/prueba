from config.db import engine, Base
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import sessionmaker, relationship
from pydantic import BaseModel

class UsuarioCarrera(Base):
    __tablename__ = "carreraUsuario"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("usuarios.id"))
    carrera_id = Column(Integer, ForeignKey("carreras.id"))
    estado_alumno = Column(String, default="Cursando")  # Nuevo campo

    user = relationship("User", back_populates="pivoteCarrera")
    carrera = relationship("Carrera", back_populates="userspivote")

class UserCarreraCreate(BaseModel): 
    user_id: int
    carrera_id: int
    estado_alumno: str = "Cursando"

class UserCarreraResponse(BaseModel):
    id: int
    user_id: int
    carrera_id: int
    estado_alumno: str

Session = sessionmaker(bind=engine)
session = Session()

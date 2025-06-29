from config.db import engine, Base
from sqlalchemy import Integer, ForeignKey, String, Column
from sqlalchemy.orm import sessionmaker, relationship
from pydantic import BaseModel

class Carrera(Base):
    
    __tablename__ = "carreras"

    id = Column("id", Integer, primary_key=True)
    nombre = Column("nombre", String)
    estado = Column("estado", String)
    user_id = Column(ForeignKey("usuarios.id"))
    materias = relationship("Materia", back_populates="carrera")
    userspivote = relationship("UsuarioCarrera", back_populates="carrera")

    def __init__(self, nombre, estado, user_id):
        self.nombre = nombre
        self.estado = estado
        self.user_id = user_id
        
class NuevaCarrera(BaseModel):
    nombre: str
    estado: str
    user_id: int

class CarreraOut(BaseModel):
    id: int
    nombre: str
    estado: str
    user_id: int

    class Config:
        orm_mode = True

# Eliminamos la creación de tablas de aquí
Session = sessionmaker(bind=engine)
session = Session()
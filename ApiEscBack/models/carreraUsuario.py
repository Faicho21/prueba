from config.db import engine, Base
from sqlalchemy import Column, Integer,  ForeignKey
from sqlalchemy.orm import sessionmaker, relationship
from pydantic import BaseModel

class UsuarioCarrera(Base):
    
    __tablename__ = "carreraUsuario"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("usuarios.id"))
    carrera_id = Column(Integer, ForeignKey("carreras.id"))

    user = relationship("User", back_populates="pivoteCarrera")
    carrera = relationship("Carrera", back_populates="userspivote")
    
    def __init__(self, user_id, carrera_id):
        self.user_id = user_id
        self.carrera_id = carrera_id

class UserCarreraCreate(BaseModel): 
    user_id: int
    carrera_id: int
    
   

class UserCarreraResponse(BaseModel):
    id: int
    user_id: int
    carrera_id: int

   


Session = sessionmaker(bind=engine)
session = Session()
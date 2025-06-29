from config.db import engine, Base
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship, sessionmaker
from pydantic import BaseModel

class Materia(Base):
   
   __tablename__ = "materias"
   
   id = Column("id", Integer, primary_key=True)
   nombre = Column("nombre", String)
   estado = Column("estado", String)
   user_id = Column("user_id", Integer, ForeignKey("usuarios.id"))
   career_id = Column("career_id", Integer, ForeignKey("carreras.id"), nullable=True)
   usuario = relationship("User", back_populates="rmateria")
   carrera = relationship("Carrera", back_populates="materias", uselist=False)

   def __init__(self, nombre, estado, user_id, career_id):
      self.nombre = nombre
      self.estado = estado
      self.user_id = user_id
      self.career_id = career_id

class InputMateria(BaseModel):
   nombre: str
   estado: str
   user_id: int
   career_id: int

# Crear la sesión
Session = sessionmaker(bind=engine)
session = Session() 
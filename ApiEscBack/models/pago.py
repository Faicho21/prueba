from config.db import engine, Base
from sqlalchemy import Integer, ForeignKey, DateTime, Column
from sqlalchemy.orm import sessionmaker, relationship
from pydantic import BaseModel
import datetime

class Pago(Base):
   
   __tablename__ = "pagos"

   id = Column("id", Integer, primary_key=True)
   carrera_id = Column(ForeignKey("carreras.id"))
   user_id = Column(ForeignKey("usuarios.id"))
   monto = Column(Integer)
   mes = Column(DateTime)
   creado_en = Column(DateTime, default=datetime.datetime.now())
   user = relationship("User", uselist=False, back_populates="pago")
   carrera = relationship("Carrera", uselist=False)

   def __init__(self, carrera_id, user_id, monto, mes):
       self.carrera_id = carrera_id
       self.user_id = user_id
       self.monto = monto
       self.mes = mes
       
class NuevoPago(BaseModel):
   carrera_id: int
   user_id: int
   monto: int
   mes: datetime.datetime
   creado_en: datetime.datetime = datetime.datetime.now()

class VerPagos(BaseModel):
    id: int
    carrera_id: int
    user_id: int
    monto: int
    mes: datetime.datetime
    creado_en: datetime.datetime

class PagoOut(BaseModel): # Modelo de salida para Pago
    id: int
    user_id: int
    carrera_id: int
    monto: int
    mes: datetime.datetime

    class Config:
        orm_mode = True  # Permite convertir desde un modelo SQLAlchemy

Session = sessionmaker(bind=engine)
session = Session()
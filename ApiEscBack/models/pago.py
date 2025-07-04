from config.db import engine, Base
from sqlalchemy import Integer, ForeignKey, DateTime, Column
from sqlalchemy.orm import sessionmaker, relationship
from pydantic import BaseModel, ConfigDict
from typing import Optional
import datetime

class Pago(Base):
    __tablename__ = "pagos"

    id = Column(Integer, primary_key=True)
    carrera_id = Column(ForeignKey("carreras.id"))
    user_id = Column(ForeignKey("usuarios.id"))
    monto = Column(Integer)
    mes = Column(DateTime)
    creado_en = Column(DateTime, default=datetime.datetime.now)
    
    user = relationship("User", uselist=False, back_populates="pago")
    carrera = relationship("Carrera", uselist=False)

    def __init__(self, carrera_id, user_id, monto, mes):
        self.carrera_id = carrera_id
        self.user_id = user_id
        self.monto = monto
        self.mes = mes
        
class CarreraBase(BaseModel):
    id: int
    nombre: str

    class Config:
        orm_mode = True

class PagoOut(BaseModel):
    id: int
    user_id: int
    carrera_id: int
    monto: int
    mes: str
    carrera: Optional[CarreraBase]  # ✅ Este campo es el que habilita .carrera.nombre

    class Config:
        orm_mode = True
        
        
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

class EditarPago(BaseModel):
    user_id: Optional[int] = None
    carrera_id: Optional[int] = None
    monto: Optional[float] = None
    mes: Optional[str] = None

Session = sessionmaker(bind=engine)
session = Session()

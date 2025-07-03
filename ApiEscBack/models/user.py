from config.db import engine, Base
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import sessionmaker, relationship
from pydantic import BaseModel
from typing import Optional

#regionUSER
class User(Base):
   __tablename__ = "usuarios"

   id = Column("id", Integer, primary_key=True)
   username = Column("username", String)
   password = Column("password", String)
   id_userdetail = Column(Integer, ForeignKey("userdetails.id"))
   userdetail = relationship("UserDetail", backref="user", uselist=False)
   rmateria = relationship("Materia", back_populates="usuario", uselist=True)
   pago = relationship("Pago", back_populates="user", uselist=True)
   pivoteCarrera = relationship("UsuarioCarrera", back_populates="user")

   def __init__(self, username, password):
       self.username = username
       self.password = password
#endregion

#regionUSERDETAIL
class UserDetail(Base):
   __tablename__ = "userdetails"

   id = Column("id", Integer, primary_key=True)
   dni = Column("dni", Integer)
   firstName = Column("firstName", String)
   lastName = Column("lastName", String)
   type = Column("type", String(50))  # "alumno", "profesor", etc.
   email = Column("email", String(80), nullable=False, unique=True)

   def __init__(self, dni, firstName, lastName, type, email):
       self.dni = dni
       self.firstName = firstName
       self.lastName = lastName
       self.type = type
       self.email = email
#endRegion

#region PYDANTIC
class InputUser(BaseModel):
   username: str
   password: str
   email: str
   dni: int
   firstName: str
   lastName: str
   type: str

class InputLogin(BaseModel):
   username: str
   password: str

class InputUserDetail(BaseModel):
   dni: int
   firstName: str
   lastName: str
   type: str
   email: str

class UserDetailUpdate(BaseModel):
   dni: Optional[int] = None
   firstName: Optional[str] = None
   lastName: Optional[str] = None
   type: Optional[str] = None
   email: Optional[str] = None

class InputRegister(BaseModel):
   username: str
   password: str
   email: str

class UserDetailOut(BaseModel):
   email: str
   dni: int
   firstName: str
   lastName: str
   type: str

   class Config:
       orm_mode = True

class UserOut(BaseModel):
   id: int
   username: str
   userdetail: UserDetailOut

   class Config:
       orm_mode = True
#endregion

Session = sessionmaker(bind=engine)
session = Session()

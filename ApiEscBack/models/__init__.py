from config.db import engine, Base
# Primero importamos las tablas base
from models.user import User, UserDetail
# Luego importamos las tablas que dependen de las anteriores
from models.carrera import Carrera
from models.materia import Materia
from models.pago import Pago
from models.carreraUsuario import UsuarioCarrera

# Crear todas las tablas en el orden correcto
def init_db():
    # Primero creamos las tablas base
    Base.metadata.create_all(bind=engine, tables=[
        User.__table__,
        UserDetail.__table__,
        Carrera.__table__,
        Materia.__table__,
        Pago.__table__,
        UsuarioCarrera.__table__
    ]) 
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Configuración de la base de datos (base de desarrollo)
DATABASE_URL = "postgresql://postgres:1648@localhost:5432/escuela_test"

# Crear el engine de SQLAlchemy
engine = create_engine(DATABASE_URL)

# Base para los modelos declarativos
Base = declarative_base()

# Crear la sesión (puede ser usada desde cualquier módulo)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

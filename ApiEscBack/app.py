from fastapi import FastAPI
from routes.user import user, userDetail
from routes.materia import materia
from routes.pago import pago
from routes.carrera import carrera
from fastapi.middleware.cors import CORSMiddleware
from models import init_db

# Inicializar la base de datos
init_db()

api_escu = FastAPI()

api_escu.include_router(user)
api_escu.include_router(userDetail)
api_escu.include_router(materia)
api_escu.include_router(pago)
api_escu.include_router(carrera)

# Middleware para permitir CORS
api_escu.add_middleware(
   CORSMiddleware,
   allow_origins=["*"],
   allow_credentials=True,
   allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
   allow_headers=["*"],
)
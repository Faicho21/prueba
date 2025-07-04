from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.user import user, userDetail
from routes.materia import materia
from routes.pago import pago
from routes.carrera import carrera
from models import init_db

# Crear instancia FastAPI
api_escu = FastAPI()

# Middleware CORS — debe ir ANTES de los routers
api_escu.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Podés cambiarlo por ["http://localhost:5173"] si querés restringir
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar la base de datos
init_db()

# Rutas
api_escu.include_router(user)
api_escu.include_router(userDetail)
api_escu.include_router(materia)
api_escu.include_router(pago)
api_escu.include_router(carrera)

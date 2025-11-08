from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Routers existentes (los tuyos)
from routes.user import user, userDetail
from routes.materia import materia
from routes.pago import pago
from routes.carrera import carrera

# Routers nuevos (POST /search) — ADITIVOS
from routes.alumnos_search import router as alumnos_search_router
from routes.pagos_search import router as pagos_search_router
from routes.carreras_search import router as carreras_search_router

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

# Rutas existentes
api_escu.include_router(user)
api_escu.include_router(userDetail)
api_escu.include_router(materia)
api_escu.include_router(pago)
api_escu.include_router(carrera)

# Rutas NUEVAS (paginación por POST, no rompen nada de lo anterior)
api_escu.include_router(alumnos_search_router)
api_escu.include_router(pagos_search_router)
api_escu.include_router(carreras_search_router)

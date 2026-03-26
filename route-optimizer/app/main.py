"""
API FastAPI para el servicio de optimización de rutas.
Expone endpoints REST para integración con el backend NestJS.
"""

import os
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional

import structlog
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .models import (
    OptimizationRequest,
    OptimizationResponse,
    OptimizationConfig,
    Appointment,
    Stylist,
    Location,
    TimeWindow,
    StylistWorkSchedule,
)
from .solver import optimize_routes

# Cargar variables de entorno
load_dotenv()

# Configurar logging estructurado
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ]
)
logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager para la aplicación."""
    logger.info("route_optimizer_starting", version="1.0.0")
    yield
    logger.info("route_optimizer_stopping")


# Crear aplicación FastAPI
app = FastAPI(
    title="Route Optimizer Service",
    description="Microservicio de optimización de rutas para citas a domicilio usando OR-Tools",
    version="1.0.0",
    lifespan=lifespan,
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ========== ENDPOINTS ==========

@app.get("/health")
async def health_check():
    """Endpoint de salud para monitoreo."""
    return {
        "status": "healthy",
        "service": "route-optimizer",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.post("/optimize", response_model=OptimizationResponse)
async def optimize(request: OptimizationRequest):
    """
    Optimiza las rutas de citas para los estilistas.
    
    Recibe una lista de citas con sus ventanas de tiempo y estilistas disponibles,
    y retorna la asignación óptima que minimiza tiempos de traslado respetando
    las restricciones.
    
    Args:
        request: Solicitud con citas, estilistas y configuración
        
    Returns:
        Rutas optimizadas para cada estilista
    """
    logger.info(
        "optimize_request_received",
        clinic_id=request.clinic_id,
        num_appointments=len(request.appointments),
        num_stylists=len(request.stylists),
    )
    
    try:
        response = optimize_routes(request)
        
        logger.info(
            "optimize_completed",
            success=response.success,
            assigned=response.total_appointments_assigned,
            unassigned=len(response.unassigned_appointments),
            solve_time=response.solve_time_seconds,
        )
        
        return response
        
    except Exception as e:
        logger.error("optimize_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/optimize/validate")
async def validate_request(request: OptimizationRequest):
    """
    Valida una solicitud de optimización sin ejecutar el solver.
    Útil para verificar datos antes de enviar a optimización.
    """
    warnings = []
    
    # Verificar que hay al menos una cita
    if len(request.appointments) == 0:
        return {"valid": False, "error": "No hay citas para optimizar"}
    
    # Verificar que hay al menos un estilista
    if len(request.stylists) == 0:
        return {"valid": False, "error": "No hay estilistas disponibles"}
    
    # Verificar coordenadas
    for appt in request.appointments:
        if appt.location.lat == 0 and appt.location.lng == 0:
            warnings.append(f"Cita {appt.id} tiene coordenadas (0, 0)")
    
    # Verificar que las citas con estilista requerido tienen un estilista válido
    stylist_ids = {s.id for s in request.stylists}
    for appt in request.appointments:
        if appt.required_stylist_id and appt.required_stylist_id not in stylist_ids:
            return {
                "valid": False, 
                "error": f"Cita {appt.id} requiere estilista {appt.required_stylist_id} que no está disponible"
            }
    
    # Verificar que hay capacidad suficiente
    total_capacity = sum(s.max_appointments for s in request.stylists)
    if total_capacity < len(request.appointments):
        warnings.append(
            f"Capacidad total ({total_capacity}) es menor que número de citas ({len(request.appointments)})"
        )
    
    return {
        "valid": True,
        "warnings": warnings,
        "summary": {
            "appointments": len(request.appointments),
            "stylists": len(request.stylists),
            "total_capacity": total_capacity,
        }
    }


@app.get("/config/defaults")
async def get_config_defaults():
    """
    Retorna los valores por defecto de configuración del optimizador.
    Útil para mostrar opciones en UI.
    """
    return {
        "first_solution_strategies": [
            "PATH_CHEAPEST_ARC",
            "PATH_MOST_CONSTRAINED_ARC",
            "SAVINGS",
            "SWEEP",
            "CHRISTOFIDES",
            "PARALLEL_CHEAPEST_INSERTION",
        ],
        "local_search_metaheuristics": [
            "GUIDED_LOCAL_SEARCH",
            "SIMULATED_ANNEALING",
            "TABU_SEARCH",
            "GENERIC_TABU_SEARCH",
        ],
        "defaults": OptimizationConfig().model_dump(),
    }


# ========== EJEMPLO DE USO ==========

@app.get("/example")
async def get_example():
    """
    Retorna un ejemplo de solicitud para referencia.
    """
    from datetime import time
    
    example_date = datetime(2024, 3, 15, 8, 0)  # 15 de marzo, 8:00 AM
    
    example_request = OptimizationRequest(
        clinic_id="clinic-001",
        date=example_date,
        appointments=[
            Appointment(
                id="appt-001",
                client_id="client-001",
                client_name="María García",
                pet_name="Luna",
                location=Location(lat=19.4326, lng=-99.1332, address="Col. Centro"),
                time_window=TimeWindow(
                    start=datetime(2024, 3, 15, 9, 0),
                    end=datetime(2024, 3, 15, 11, 0),
                ),
                duration_minutes=60,
            ),
            Appointment(
                id="appt-002",
                client_id="client-002",
                client_name="Juan López",
                pet_name="Max",
                location=Location(lat=19.4200, lng=-99.1500, address="Col. Roma"),
                time_window=TimeWindow(
                    start=datetime(2024, 3, 15, 10, 0),
                    end=datetime(2024, 3, 15, 12, 0),
                ),
                duration_minutes=45,
            ),
            Appointment(
                id="appt-003",
                client_id="client-003",
                client_name="Ana Martínez",
                pet_name="Rocky",
                location=Location(lat=19.4400, lng=-99.1200, address="Col. Condesa"),
                time_window=TimeWindow(
                    start=datetime(2024, 3, 15, 11, 0),
                    end=datetime(2024, 3, 15, 14, 0),
                ),
                duration_minutes=90,
                required_skills=["large_dogs"],
            ),
        ],
        stylists=[
            Stylist(
                id="stylist-001",
                name="Carlos Rodríguez",
                start_location=Location(lat=19.4326, lng=-99.1332, address="Clínica Central"),
                work_schedule=StylistWorkSchedule(
                    start_time=time(8, 0),
                    end_time=time(17, 0),
                ),
                max_appointments=6,
                skills=["basic", "large_dogs"],
                avg_speed_kmh=25,
            ),
            Stylist(
                id="stylist-002",
                name="Laura Sánchez",
                start_location=Location(lat=19.4326, lng=-99.1332, address="Clínica Central"),
                work_schedule=StylistWorkSchedule(
                    start_time=time(9, 0),
                    end_time=time(18, 0),
                ),
                max_appointments=5,
                skills=["basic", "special_cuts"],
                avg_speed_kmh=30,
            ),
        ],
        config=OptimizationConfig(
            max_solve_time_seconds=10,
            allow_unassigned=True,
        ),
    )
    
    return example_request.model_dump()


# ========== MAIN ==========

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8001)),
        reload=os.getenv("ENV", "development") == "development",
    )

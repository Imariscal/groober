"""
Modelos de datos para el optimizador de rutas.
Define las estructuras para citas, estilistas y solicitudes/respuestas de optimización.
"""

from datetime import datetime, time
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class Location(BaseModel):
    """Coordenadas geográficas de una ubicación."""
    lat: float = Field(..., description="Latitud", ge=-90, le=90)
    lng: float = Field(..., description="Longitud", ge=-180, le=180)
    address: Optional[str] = Field(None, description="Dirección legible")


class TimeWindow(BaseModel):
    """Ventana de tiempo para una cita o disponibilidad."""
    start: datetime = Field(..., description="Inicio de la ventana")
    end: datetime = Field(..., description="Fin de la ventana")

    @field_validator("end")
    @classmethod
    def end_after_start(cls, v, info):
        if "start" in info.data and v <= info.data["start"]:
            raise ValueError("end debe ser posterior a start")
        return v


class AppointmentPriority(str, Enum):
    """Prioridad de la cita para el algoritmo."""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class Appointment(BaseModel):
    """
    Representa una cita a domicilio que debe ser asignada y optimizada.
    """
    id: str = Field(..., description="ID único de la cita")
    client_id: str = Field(..., description="ID del cliente")
    client_name: Optional[str] = Field(None, description="Nombre del cliente")
    pet_name: Optional[str] = Field(None, description="Nombre de la mascota")
    
    # Ubicación
    location: Location = Field(..., description="Ubicación del domicilio")
    
    # Tiempo
    time_window: TimeWindow = Field(..., description="Ventana de tiempo preferida por el cliente")
    duration_minutes: int = Field(
        default=60, 
        description="Duración estimada del servicio en minutos",
        ge=15,
        le=480
    )
    
    # Prioridad y restricciones
    priority: AppointmentPriority = Field(
        default=AppointmentPriority.NORMAL,
        description="Prioridad de la cita"
    )
    
    # Pre-asignación opcional
    preferred_stylist_id: Optional[str] = Field(
        None, 
        description="ID del estilista preferido (si hay)"
    )
    required_stylist_id: Optional[str] = Field(
        None,
        description="ID del estilista requerido (obligatorio, no puede cambiarse)"
    )
    
    # Servicios requeridos (para matching con skills de estilistas)
    required_skills: list[str] = Field(
        default_factory=list,
        description="Habilidades requeridas (ej: 'large_dogs', 'special_cuts')"
    )


class StylistWorkSchedule(BaseModel):
    """Horario de trabajo de un estilista para el día."""
    start_time: time = Field(..., description="Hora de inicio de trabajo")
    end_time: time = Field(..., description="Hora de fin de trabajo")
    break_start: Optional[time] = Field(None, description="Inicio de descanso")
    break_end: Optional[time] = Field(None, description="Fin de descanso")


class Stylist(BaseModel):
    """
    Representa un estilista/groomer disponible para asignar citas.
    """
    id: str = Field(..., description="ID único del estilista")
    name: str = Field(..., description="Nombre del estilista")
    
    # Ubicación de inicio (puede ser la clínica o su casa)
    start_location: Location = Field(..., description="Punto de inicio de la ruta")
    end_location: Optional[Location] = Field(
        None, 
        description="Punto final de la ruta (si None, usa start_location)"
    )
    
    # Disponibilidad
    work_schedule: StylistWorkSchedule = Field(
        ..., 
        description="Horario de trabajo del día"
    )
    
    # Capacidad
    max_appointments: int = Field(
        default=10,
        description="Número máximo de citas por día",
        ge=1,
        le=50
    )
    
    # Habilidades
    skills: list[str] = Field(
        default_factory=list,
        description="Habilidades del estilista"
    )
    
    # Velocidad promedio (km/h) para calcular tiempos de traslado
    avg_speed_kmh: float = Field(
        default=30.0,
        description="Velocidad promedio de traslado en km/h",
        ge=5,
        le=100
    )


class OptimizationRequest(BaseModel):
    """
    Solicitud de optimización de rutas.
    """
    clinic_id: str = Field(..., description="ID de la clínica")
    date: datetime = Field(..., description="Fecha para optimizar")
    
    # Datos de entrada
    appointments: list[Appointment] = Field(
        ..., 
        description="Lista de citas a optimizar",
        min_length=1
    )
    stylists: list[Stylist] = Field(
        ..., 
        description="Lista de estilistas disponibles",
        min_length=1
    )
    
    # Configuración del algoritmo
    config: "OptimizationConfig" = Field(
        default_factory=lambda: OptimizationConfig(),
        description="Configuración del algoritmo"
    )


class OptimizationConfig(BaseModel):
    """
    Parámetros de configuración para el algoritmo de optimización.
    """
    # Pesos para la función objetivo
    weight_travel_time: float = Field(
        default=1.0,
        description="Peso para minimizar tiempo de traslado",
        ge=0
    )
    weight_time_window_violations: float = Field(
        default=100.0,
        description="Penalización por violar ventanas de tiempo",
        ge=0
    )
    weight_balance_load: float = Field(
        default=10.0,
        description="Peso para balancear carga entre estilistas",
        ge=0
    )
    
    # Límites del solver
    max_solve_time_seconds: int = Field(
        default=30,
        description="Tiempo máximo de ejecución del solver",
        ge=1,
        le=300
    )
    
    # Estrategia de primera solución
    first_solution_strategy: str = Field(
        default="PATH_CHEAPEST_ARC",
        description="Estrategia para encontrar solución inicial"
    )
    
    # Metaheurística
    local_search_metaheuristic: str = Field(
        default="GUIDED_LOCAL_SEARCH",
        description="Metaheurística para mejora local"
    )
    
    # Permitir citas no asignadas?
    allow_unassigned: bool = Field(
        default=True,
        description="Permitir que algunas citas queden sin asignar si no hay capacidad"
    )


class RouteStop(BaseModel):
    """Una parada en la ruta optimizada."""
    appointment_id: str
    stop_order: int = Field(..., description="Orden en la ruta (0-indexed)")
    
    # Tiempos planificados
    planned_arrival: datetime
    planned_departure: datetime
    
    # Métricas
    travel_time_minutes: float = Field(..., description="Tiempo de traslado desde la parada anterior")
    travel_distance_km: float = Field(..., description="Distancia desde la parada anterior")
    waiting_time_minutes: float = Field(
        default=0, 
        description="Tiempo de espera antes de poder iniciar (si llega antes de la ventana)"
    )
    
    # Flags
    time_window_violated: bool = Field(
        default=False,
        description="Si llegó fuera de la ventana de tiempo"
    )
    violation_minutes: float = Field(
        default=0,
        description="Minutos de violación (positivo = tarde, negativo = temprano)"
    )


class OptimizedRoute(BaseModel):
    """Ruta optimizada para un estilista."""
    stylist_id: str
    stylist_name: str
    
    # Paradas
    stops: list[RouteStop] = Field(default_factory=list)
    
    # Métricas totales
    total_stops: int
    total_travel_time_minutes: float
    total_travel_distance_km: float
    total_service_time_minutes: float
    total_waiting_time_minutes: float
    
    # Horarios
    route_start_time: Optional[datetime] = None
    route_end_time: Optional[datetime] = None
    
    # Flags de calidad
    has_time_window_violations: bool = False
    utilization_percent: float = Field(
        ..., 
        description="% de capacidad utilizada del estilista"
    )


class OptimizationResponse(BaseModel):
    """Respuesta del optimizador de rutas."""
    success: bool
    message: str
    
    # Rutas optimizadas
    routes: list[OptimizedRoute] = Field(default_factory=list)
    
    # Citas no asignadas
    unassigned_appointments: list[str] = Field(
        default_factory=list,
        description="IDs de citas que no pudieron ser asignadas"
    )
    
    # Métricas globales
    total_appointments_assigned: int = 0
    total_travel_time_minutes: float = 0
    total_travel_distance_km: float = 0
    
    # Metadatos del solver
    solve_time_seconds: float = 0
    solver_status: str = ""
    algorithm_version: str = "v1.0-ortools-vrptw"


# Actualizar forward references
OptimizationRequest.model_rebuild()

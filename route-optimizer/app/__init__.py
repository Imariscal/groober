"""
Route Optimizer - Microservicio de optimización de rutas con OR-Tools.
"""

from .models import (
    Appointment,
    Stylist,
    Location,
    TimeWindow,
    StylistWorkSchedule,
    OptimizationRequest,
    OptimizationResponse,
    OptimizationConfig,
    OptimizedRoute,
    RouteStop,
)
from .solver import optimize_routes, RouteOptimizer

__all__ = [
    "Appointment",
    "Stylist",
    "Location",
    "TimeWindow",
    "StylistWorkSchedule",
    "OptimizationRequest",
    "OptimizationResponse",
    "OptimizationConfig",
    "OptimizedRoute",
    "RouteStop",
    "optimize_routes",
    "RouteOptimizer",
]

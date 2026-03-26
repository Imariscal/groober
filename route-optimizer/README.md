# 🚀 Route Optimizer - Microservicio de Optimización de Rutas

Microservicio Python que utiliza **Google OR-Tools** para resolver el problema VRPTW (Vehicle Routing Problem with Time Windows) - optimización de rutas para citas a domicilio de estilistas.

## 📋 Características

- ✅ **OR-Tools VRPTW**: Algoritmo de optimización de última generación
- ✅ **Ventanas de tiempo**: Respeta las preferencias horarias de los clientes  
- ✅ **Múltiples estilistas**: Asigna citas balanceando cargas de trabajo
- ✅ **Restricciones de habilidades**: Solo asigna a estilistas con las skills requeridas
- ✅ **Pre-asignaciones**: Soporta citas con estilista obligatorio o preferido
- ✅ **API REST**: Integración simple con cualquier backend
- ✅ **Modular y extensible**: Fácil de personalizar y expandir

## 🏗️ Arquitectura

```
route-optimizer/
├── app/
│   ├── __init__.py       # Exportaciones
│   ├── main.py           # API FastAPI
│   ├── models.py         # Modelos Pydantic
│   └── solver.py         # Solver OR-Tools VRPTW
├── Dockerfile            # Containerización
├── requirements.txt      # Dependencias Python
└── README.md             # Esta documentación
```

## 🚀 Inicio Rápido

### Opción 1: Docker (Recomendado)

```bash
# Desde la raíz del proyecto VibraLive
docker-compose up route-optimizer
```

El servicio estará disponible en `http://localhost:8001`

### Opción 2: Local

```bash
# Crear entorno virtual
cd route-optimizer
python -m venv venv
source venv/bin/activate  # Linux/Mac
# o: venv\Scripts\activate  # Windows

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar
python -m app.main
```

## 📡 API Endpoints

### Health Check
```http
GET /health
```

### Optimizar Rutas
```http
POST /optimize
Content-Type: application/json

{
  "clinic_id": "clinic-001",
  "date": "2024-03-15T08:00:00",
  "appointments": [...],
  "stylists": [...],
  "config": {...}
}
```

### Validar Datos
```http
POST /optimize/validate
```

### Configuración por Defecto
```http
GET /config/defaults
```

### Ejemplo de Solicitud
```http
GET /example
```

## 📝 Ejemplo de Uso

### Request
```json
{
  "clinic_id": "clinic-001",
  "date": "2024-03-15T08:00:00",
  "appointments": [
    {
      "id": "appt-001",
      "client_id": "client-001",
      "client_name": "María García",
      "pet_name": "Luna",
      "location": {
        "lat": 19.4326,
        "lng": -99.1332,
        "address": "Col. Centro"
      },
      "time_window": {
        "start": "2024-03-15T09:00:00",
        "end": "2024-03-15T11:00:00"
      },
      "duration_minutes": 60
    },
    {
      "id": "appt-002",
      "client_id": "client-002",
      "location": {
        "lat": 19.4200,
        "lng": -99.1500
      },
      "time_window": {
        "start": "2024-03-15T10:00:00",
        "end": "2024-03-15T12:00:00"
      },
      "duration_minutes": 45
    }
  ],
  "stylists": [
    {
      "id": "stylist-001",
      "name": "Carlos Rodríguez",
      "start_location": {
        "lat": 19.4326,
        "lng": -99.1332
      },
      "work_schedule": {
        "start_time": "08:00",
        "end_time": "17:00"
      },
      "max_appointments": 6,
      "skills": ["basic", "large_dogs"],
      "avg_speed_kmh": 25
    },
    {
      "id": "stylist-002",
      "name": "Laura Sánchez",
      "start_location": {
        "lat": 19.4326,
        "lng": -99.1332
      },
      "work_schedule": {
        "start_time": "09:00",
        "end_time": "18:00"
      },
      "max_appointments": 5
    }
  ],
  "config": {
    "max_solve_time_seconds": 30,
    "allow_unassigned": true
  }
}
```

### Response
```json
{
  "success": true,
  "message": "Optimización completada. 2 citas asignadas a 1 estilistas.",
  "routes": [
    {
      "stylist_id": "stylist-001",
      "stylist_name": "Carlos Rodríguez",
      "stops": [
        {
          "appointment_id": "appt-001",
          "stop_order": 0,
          "planned_arrival": "2024-03-15T09:00:00",
          "planned_departure": "2024-03-15T10:00:00",
          "travel_time_minutes": 15.5,
          "travel_distance_km": 6.45,
          "waiting_time_minutes": 0,
          "time_window_violated": false
        },
        {
          "appointment_id": "appt-002",
          "stop_order": 1,
          "planned_arrival": "2024-03-15T10:20:00",
          "planned_departure": "2024-03-15T11:05:00",
          "travel_time_minutes": 20.0,
          "travel_distance_km": 8.3,
          "waiting_time_minutes": 0,
          "time_window_violated": false
        }
      ],
      "total_stops": 2,
      "total_travel_time_minutes": 35.5,
      "total_travel_distance_km": 14.75,
      "total_service_time_minutes": 105,
      "utilization_percent": 45.2
    }
  ],
  "unassigned_appointments": [],
  "total_appointments_assigned": 2,
  "solve_time_seconds": 0.234
}
```

## ⚙️ Configuración del Algoritmo

| Parámetro | Default | Descripción |
|-----------|---------|-------------|
| `weight_travel_time` | 1.0 | Peso para minimizar tiempo de traslado |
| `weight_time_window_violations` | 100.0 | Penalización por violar ventanas de tiempo |
| `weight_balance_load` | 10.0 | Peso para balancear carga entre estilistas |
| `max_solve_time_seconds` | 30 | Tiempo máximo del solver |
| `first_solution_strategy` | PATH_CHEAPEST_ARC | Estrategia de solución inicial |
| `local_search_metaheuristic` | GUIDED_LOCAL_SEARCH | Metaheurística de mejora |
| `allow_unassigned` | true | Permitir citas sin asignar |

## 🔧 Integración con NestJS

El módulo `RoutesModule` en el backend NestJS se conecta automáticamente con este microservicio.

### Configuración Backend

Agregar en `.env` del backend:
```env
ROUTE_OPTIMIZER_URL=http://localhost:8001
```

### Uso en Controlador
```typescript
@Post('optimize')
async optimizeRoutes(@Body() body: { clinic_id: string; date: string }) {
  return this.routesService.optimizeRoutesForDate(
    body.clinic_id,
    new Date(body.date),
  );
}
```

## 📊 Algoritmo OR-Tools

El solver utiliza:

1. **Primera solución**: `PATH_CHEAPEST_ARC` - Encuentra una solución inicial rápida
2. **Mejora local**: `GUIDED_LOCAL_SEARCH` - Optimiza iterativamente
3. **Dimensiones**: 
   - Tiempo (con ventanas)
   - Capacidad (máx citas por estilista)
4. **Callbacks personalizados** para distancia y tiempo de servicio

### Fórmula de Distancia (Haversine)
```python
d = 2R × arcsin(√(sin²((φ₂-φ₁)/2) + cos(φ₁) × cos(φ₂) × sin²((λ₂-λ₁)/2)))
```

## 🧪 Testing

```bash
# Tests unitarios
pytest app/tests/

# Test de integración
curl -X POST http://localhost:8001/optimize \
  -H "Content-Type: application/json" \
  -d @example_request.json
```

## 📈 Métricas de Performance

| Citas | Estilistas | Tiempo Típico |
|-------|------------|---------------|
| 10    | 2          | < 1s          |
| 50    | 5          | < 5s          |
| 100   | 10         | < 15s         |
| 200   | 15         | < 30s         |

## 🔮 Roadmap

- [ ] Integración con Google Maps Distance Matrix API para tiempos reales
- [ ] Soporte para múltiples depósitos (clínicas)
- [ ] Restricciones de vehículos (tamaño, equipamiento)
- [ ] Visualización de rutas en frontend
- [ ] Caché de distancias
- [ ] Webhook para notificaciones de optimización completada

## 📚 Referencias

- [OR-Tools Documentation](https://developers.google.com/optimization)
- [VRPTW Guide](https://developers.google.com/optimization/routing/vrptw)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

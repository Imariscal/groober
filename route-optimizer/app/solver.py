"""
Solver OR-Tools para el problema VRPTW (Vehicle Routing Problem with Time Windows).
Optimiza la asignación de citas a estilistas minimizando tiempos de traslado
y respetando ventanas de tiempo.
"""

import math
import time as time_module
from datetime import datetime, timedelta
from typing import Optional

from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

from .models import (
    Appointment,
    Stylist,
    OptimizationConfig,
    OptimizationRequest,
    OptimizationResponse,
    OptimizedRoute,
    RouteStop,
    Location,
)


class RouteOptimizer:
    """
    Optimizador de rutas usando OR-Tools VRPTW.
    
    El problema se modela como:
    - Vehículos = Estilistas
    - Nodos = Citas + depósitos (ubicación inicial de cada estilista)
    - Ventanas de tiempo = Preferencias horarias de clientes
    - Capacidad = Máximo de citas por estilista
    """

    def __init__(self, request: OptimizationRequest):
        self.request = request
        self.config = request.config
        self.appointments = request.appointments
        self.stylists = request.stylists
        self.date = request.date
        
        # Número de nodos: citas + 1 depósito por estilista
        self.num_appointments = len(self.appointments)
        self.num_stylists = len(self.stylists)
        
        # Índices de nodos:
        # 0 to num_appointments-1: citas
        # num_appointments to num_appointments+num_stylists-1: depósitos (start/end)
        self.depot_start_index = self.num_appointments
        
        # Mapeo de índice de nodo a appointment/stylist
        self._build_index_maps()
        
        # Pre-calcular matriz de distancias y tiempos
        self._build_distance_matrix()
        self._build_time_matrix()
        self._build_time_windows()
        
    def _build_index_maps(self):
        """Construye mapeos entre índices y objetos."""
        self.node_to_appointment: dict[int, Optional[Appointment]] = {}
        self.appointment_id_to_node: dict[str, int] = {}
        
        for i, appt in enumerate(self.appointments):
            self.node_to_appointment[i] = appt
            self.appointment_id_to_node[appt.id] = i
        
        # Depósitos no tienen citas asociadas
        for i in range(self.num_stylists):
            depot_idx = self.depot_start_index + i
            self.node_to_appointment[depot_idx] = None
    
    def _haversine_distance(self, loc1: Location, loc2: Location) -> float:
        """
        Calcula la distancia en km entre dos coordenadas usando la fórmula de Haversine.
        """
        R = 6371  # Radio de la Tierra en km
        
        lat1, lng1 = math.radians(loc1.lat), math.radians(loc1.lng)
        lat2, lng2 = math.radians(loc2.lat), math.radians(loc2.lng)
        
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c
    
    def _get_node_location(self, node_index: int) -> Location:
        """Obtiene la ubicación de un nodo."""
        if node_index < self.num_appointments:
            return self.appointments[node_index].location
        else:
            # Es un depósito - usar ubicación de inicio del estilista
            stylist_idx = node_index - self.depot_start_index
            return self.stylists[stylist_idx].start_location
    
    def _build_distance_matrix(self):
        """
        Construye la matriz de distancias entre todos los nodos.
        Distancias en metros para OR-Tools (prefiere enteros).
        """
        total_nodes = self.num_appointments + self.num_stylists
        self.distance_matrix = [[0] * total_nodes for _ in range(total_nodes)]
        
        for i in range(total_nodes):
            for j in range(total_nodes):
                if i != j:
                    loc_i = self._get_node_location(i)
                    loc_j = self._get_node_location(j)
                    dist_km = self._haversine_distance(loc_i, loc_j)
                    # Convertir a metros y redondear
                    self.distance_matrix[i][j] = int(dist_km * 1000)
    
    def _build_time_matrix(self):
        """
        Construye la matriz de tiempos de traslado.
        Tiempos en minutos.
        """
        total_nodes = self.num_appointments + self.num_stylists
        self.time_matrix = [[0] * total_nodes for _ in range(total_nodes)]
        
        # Velocidad promedio general (usaremos la del estilista en el callback)
        avg_speed_kmh = 30.0
        
        for i in range(total_nodes):
            for j in range(total_nodes):
                if i != j:
                    dist_km = self.distance_matrix[i][j] / 1000
                    time_hours = dist_km / avg_speed_kmh
                    time_minutes = int(time_hours * 60)
                    self.time_matrix[i][j] = max(1, time_minutes)  # Mínimo 1 minuto
    
    def _datetime_to_minutes(self, dt: datetime) -> int:
        """Convierte datetime a minutos desde medianoche."""
        return dt.hour * 60 + dt.minute
    
    def _minutes_to_datetime(self, minutes: int) -> datetime:
        """Convierte minutos desde medianoche a datetime."""
        hours = minutes // 60
        mins = minutes % 60
        return self.date.replace(hour=hours, minute=mins, second=0, microsecond=0)
    
    def _build_time_windows(self):
        """
        Construye las ventanas de tiempo para cada nodo.
        Formato: (min_desde_medianoche, max_desde_medianoche)
        """
        self.time_windows = []
        
        # Ventanas para citas
        for appt in self.appointments:
            start_min = self._datetime_to_minutes(appt.time_window.start)
            end_min = self._datetime_to_minutes(appt.time_window.end)
            self.time_windows.append((start_min, end_min))
        
        # Ventanas para depósitos (horario de trabajo del estilista)
        for stylist in self.stylists:
            schedule = stylist.work_schedule
            start_min = schedule.start_time.hour * 60 + schedule.start_time.minute
            end_min = schedule.end_time.hour * 60 + schedule.end_time.minute
            self.time_windows.append((start_min, end_min))
    
    def _get_service_time(self, node_index: int) -> int:
        """Obtiene el tiempo de servicio en un nodo (minutos)."""
        if node_index < self.num_appointments:
            return self.appointments[node_index].duration_minutes
        return 0  # Depósitos no tienen tiempo de servicio
    
    def solve(self) -> OptimizationResponse:
        """
        Ejecuta el algoritmo de optimización y retorna las rutas.
        """
        start_time = time_module.time()
        
        total_nodes = self.num_appointments + self.num_stylists
        
        # Crear el manager de índices
        manager = pywrapcp.RoutingIndexManager(
            total_nodes,
            self.num_stylists,
            [self.depot_start_index + i for i in range(self.num_stylists)],  # starts
            [self.depot_start_index + i for i in range(self.num_stylists)],  # ends
        )
        
        # Crear el modelo de routing
        routing = pywrapcp.RoutingModel(manager)
        
        # ========== CALLBACK DE DISTANCIA ==========
        def distance_callback(from_index, to_index):
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            return self.distance_matrix[from_node][to_node]
        
        transit_callback_index = routing.RegisterTransitCallback(distance_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
        
        # ========== CALLBACK DE TIEMPO ==========
        def time_callback(from_index, to_index):
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            # Tiempo de traslado + tiempo de servicio en el origen
            travel_time = self.time_matrix[from_node][to_node]
            service_time = self._get_service_time(from_node)
            return travel_time + service_time
        
        time_callback_index = routing.RegisterTransitCallback(time_callback)
        
        # ========== DIMENSIÓN DE TIEMPO ==========
        # Horizonte: desde las 6:00 hasta las 22:00 (960 minutos máximo)
        horizon = 24 * 60  # Minutos en un día
        
        routing.AddDimension(
            time_callback_index,
            horizon,  # Slack máximo (espera permitida)
            horizon,  # Tiempo máximo por ruta
            False,    # No forzar inicio en 0
            "Time"
        )
        time_dimension = routing.GetDimensionOrDie("Time")
        
        # Agregar ventanas de tiempo
        for node in range(total_nodes):
            index = manager.NodeToIndex(node)
            if index == -1:
                continue
            start_tw, end_tw = self.time_windows[node]
            time_dimension.CumulVar(index).SetRange(start_tw, end_tw)
        
        # Minimizar tiempo total
        for i in range(self.num_stylists):
            start_index = routing.Start(i)
            end_index = routing.End(i)
            time_dimension.CumulVar(start_index).SetRange(
                self.time_windows[self.depot_start_index + i][0],
                self.time_windows[self.depot_start_index + i][1]
            )
            routing.AddVariableMinimizedByFinalizer(
                time_dimension.CumulVar(end_index)
            )
            routing.AddVariableMinimizedByFinalizer(
                time_dimension.CumulVar(start_index)
            )
        
        # ========== DIMENSIÓN DE CAPACIDAD ==========
        def demand_callback(from_index):
            from_node = manager.IndexToNode(from_index)
            if from_node < self.num_appointments:
                return 1  # Cada cita consume 1 de capacidad
            return 0
        
        demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
        
        # Calcular capacidad balanceada: máximo de citas por estilista para forzar distribución
        # ceil(num_appointments / num_stylists) + 1 como margen
        balanced_max = math.ceil(self.num_appointments / self.num_stylists) + 1
        capacities = [min(s.max_appointments, balanced_max) for s in self.stylists]
        
        print(f"[Solver] Balanced capacity: {balanced_max} per stylist (total {self.num_appointments} appointments, {self.num_stylists} stylists)")
        
        routing.AddDimensionWithVehicleCapacity(
            demand_callback_index,
            0,          # Slack
            capacities, # Capacidad por vehículo (balanceada)
            True,       # Empezar acumulador en 0
            "Capacity"
        )
        
        # Penalizar rutas muy largas para forzar distribución
        capacity_dimension = routing.GetDimensionOrDie("Capacity")
        capacity_dimension.SetGlobalSpanCostCoefficient(100)
        
        # ========== RESTRICCIONES DE HABILIDADES ==========
        self._add_skill_constraints(routing, manager)
        
        # ========== RESTRICCIONES DE PRE-ASIGNACIÓN ==========
        self._add_assignment_constraints(routing, manager)
        
        # ========== PENALIZACIÓN POR CITAS NO ASIGNADAS ==========
        if self.config.allow_unassigned:
            penalty = 100000  # Alta penalización por dejar citas sin asignar
            for node in range(self.num_appointments):
                routing.AddDisjunction([manager.NodeToIndex(node)], penalty)
        
        # ========== PARÁMETROS DEL SOLVER ==========
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        
        # Estrategia de primera solución
        first_solution_strategies = {
            "PATH_CHEAPEST_ARC": routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC,
            "PATH_MOST_CONSTRAINED_ARC": routing_enums_pb2.FirstSolutionStrategy.PATH_MOST_CONSTRAINED_ARC,
            "SAVINGS": routing_enums_pb2.FirstSolutionStrategy.SAVINGS,
            "SWEEP": routing_enums_pb2.FirstSolutionStrategy.SWEEP,
            "CHRISTOFIDES": routing_enums_pb2.FirstSolutionStrategy.CHRISTOFIDES,
            "PARALLEL_CHEAPEST_INSERTION": routing_enums_pb2.FirstSolutionStrategy.PARALLEL_CHEAPEST_INSERTION,
        }
        search_parameters.first_solution_strategy = first_solution_strategies.get(
            self.config.first_solution_strategy,
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        )
        
        # Metaheurística
        metaheuristics = {
            "GUIDED_LOCAL_SEARCH": routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH,
            "SIMULATED_ANNEALING": routing_enums_pb2.LocalSearchMetaheuristic.SIMULATED_ANNEALING,
            "TABU_SEARCH": routing_enums_pb2.LocalSearchMetaheuristic.TABU_SEARCH,
            "GENERIC_TABU_SEARCH": routing_enums_pb2.LocalSearchMetaheuristic.GENERIC_TABU_SEARCH,
        }
        search_parameters.local_search_metaheuristic = metaheuristics.get(
            self.config.local_search_metaheuristic,
            routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        )
        
        search_parameters.time_limit.FromSeconds(self.config.max_solve_time_seconds)
        
        # ========== RESOLVER ==========
        solution = routing.SolveWithParameters(search_parameters)
        
        solve_time = time_module.time() - start_time
        
        # ========== CONSTRUIR RESPUESTA ==========
        if solution:
            return self._build_response(routing, manager, solution, solve_time)
        else:
            return OptimizationResponse(
                success=False,
                message=f"No se encontró solución. Status: {routing.status()}",
                solve_time_seconds=solve_time,
                solver_status=self._get_status_name(routing.status()),
            )
    
    def _add_skill_constraints(self, routing, manager):
        """
        Agrega restricciones para que las citas solo se asignen a 
        estilistas con las habilidades requeridas.
        """
        for appt_idx, appt in enumerate(self.appointments):
            if not appt.required_skills:
                continue
            
            allowed_vehicles = []
            for stylist_idx, stylist in enumerate(self.stylists):
                # Verificar si el estilista tiene todas las habilidades requeridas
                if all(skill in stylist.skills for skill in appt.required_skills):
                    allowed_vehicles.append(stylist_idx)
            
            if allowed_vehicles and len(allowed_vehicles) < self.num_stylists:
                node_index = manager.NodeToIndex(appt_idx)
                if node_index != -1:
                    routing.VehicleVar(node_index).SetValues(allowed_vehicles)
    
    def _add_assignment_constraints(self, routing, manager):
        """
        Agrega restricciones para citas con estilista requerido o preferido.
        """
        for appt_idx, appt in enumerate(self.appointments):
            node_index = manager.NodeToIndex(appt_idx)
            if node_index == -1:
                continue
            
            # Estilista requerido (obligatorio)
            if appt.required_stylist_id:
                for stylist_idx, stylist in enumerate(self.stylists):
                    if stylist.id == appt.required_stylist_id:
                        routing.VehicleVar(node_index).SetValues([stylist_idx])
                        break
    
    def _get_status_name(self, status: int) -> str:
        """Convierte el código de status a nombre legible."""
        status_names = {
            0: "ROUTING_NOT_SOLVED",
            1: "ROUTING_SUCCESS",
            2: "ROUTING_FAIL",
            3: "ROUTING_FAIL_TIMEOUT",
            4: "ROUTING_INVALID",
        }
        return status_names.get(status, f"UNKNOWN_{status}")
    
    def _build_response(
        self, 
        routing, 
        manager, 
        solution, 
        solve_time: float
    ) -> OptimizationResponse:
        """
        Construye la respuesta con las rutas optimizadas.
        """
        routes = []
        unassigned = []
        total_distance = 0
        total_time = 0
        total_assigned = 0
        
        time_dimension = routing.GetDimensionOrDie("Time")
        
        for vehicle_id in range(self.num_stylists):
            stylist = self.stylists[vehicle_id]
            route_stops = []
            route_distance = 0
            route_time = 0
            route_service_time = 0
            route_waiting = 0
            
            index = routing.Start(vehicle_id)
            stop_order = 0
            prev_location = stylist.start_location
            route_start = None
            route_end = None
            has_violations = False
            
            while not routing.IsEnd(index):
                node = manager.IndexToNode(index)
                
                if node < self.num_appointments:
                    appt = self.appointments[node]
                    
                    # Obtener tiempo de llegada del solver
                    time_var = time_dimension.CumulVar(index)
                    arrival_minutes = solution.Value(time_var)
                    arrival_time = self._minutes_to_datetime(arrival_minutes)
                    
                    if route_start is None:
                        route_start = arrival_time
                    
                    # Calcular distancia y tiempo de traslado
                    travel_dist = self._haversine_distance(prev_location, appt.location)
                    travel_time = travel_dist / stylist.avg_speed_kmh * 60
                    
                    # Tiempo de espera y violaciones
                    waiting = 0
                    violation = 0
                    tw_violated = False
                    
                    tw_start = self._datetime_to_minutes(appt.time_window.start)
                    tw_end = self._datetime_to_minutes(appt.time_window.end)
                    
                    if arrival_minutes < tw_start:
                        waiting = tw_start - arrival_minutes
                    elif arrival_minutes > tw_end:
                        tw_violated = True
                        violation = arrival_minutes - tw_end
                        has_violations = True
                    
                    # Hora de salida
                    departure_time = arrival_time + timedelta(minutes=appt.duration_minutes + waiting)
                    
                    stop = RouteStop(
                        appointment_id=appt.id,
                        stop_order=stop_order,
                        planned_arrival=arrival_time,
                        planned_departure=departure_time,
                        travel_time_minutes=round(travel_time, 1),
                        travel_distance_km=round(travel_dist, 2),
                        waiting_time_minutes=round(waiting, 1),
                        time_window_violated=tw_violated,
                        violation_minutes=round(violation, 1),
                    )
                    route_stops.append(stop)
                    
                    route_distance += travel_dist
                    route_time += travel_time
                    route_service_time += appt.duration_minutes
                    route_waiting += waiting
                    route_end = departure_time
                    
                    prev_location = appt.location
                    stop_order += 1
                    total_assigned += 1
                
                index = solution.Value(routing.NextVar(index))
            
            # Crear ruta del estilista
            if route_stops:
                # Calcular utilización
                work_schedule = stylist.work_schedule
                work_hours = (
                    work_schedule.end_time.hour * 60 + work_schedule.end_time.minute -
                    work_schedule.start_time.hour * 60 - work_schedule.start_time.minute
                )
                used_time = route_time + route_service_time + route_waiting
                utilization = min(100, (used_time / work_hours) * 100) if work_hours > 0 else 0
                
                route = OptimizedRoute(
                    stylist_id=stylist.id,
                    stylist_name=stylist.name,
                    stops=route_stops,
                    total_stops=len(route_stops),
                    total_travel_time_minutes=round(route_time, 1),
                    total_travel_distance_km=round(route_distance, 2),
                    total_service_time_minutes=route_service_time,
                    total_waiting_time_minutes=round(route_waiting, 1),
                    route_start_time=route_start,
                    route_end_time=route_end,
                    has_time_window_violations=has_violations,
                    utilization_percent=round(utilization, 1),
                )
                routes.append(route)
                
                total_distance += route_distance
                total_time += route_time
        
        # Identificar citas no asignadas
        assigned_ids = {stop.appointment_id for route in routes for stop in route.stops}
        unassigned = [appt.id for appt in self.appointments if appt.id not in assigned_ids]
        
        return OptimizationResponse(
            success=True,
            message=f"Optimización completada. {total_assigned} citas asignadas a {len(routes)} estilistas.",
            routes=routes,
            unassigned_appointments=unassigned,
            total_appointments_assigned=total_assigned,
            total_travel_time_minutes=round(total_time, 1),
            total_travel_distance_km=round(total_distance, 2),
            solve_time_seconds=round(solve_time, 3),
            solver_status="SUCCESS",
        )


def optimize_routes(request: OptimizationRequest) -> OptimizationResponse:
    """
    Función de conveniencia para optimizar rutas.
    
    Args:
        request: Solicitud con citas, estilistas y configuración
        
    Returns:
        Respuesta con rutas optimizadas
    """
    optimizer = RouteOptimizer(request)
    return optimizer.solve()

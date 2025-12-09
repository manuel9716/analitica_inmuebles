from typing import Any, Dict, List, Optional

from enum import Enum

from pydantic import BaseModel


class InmuebleInput(BaseModel):
    # Campos principales que suelen aparecer en el dataset
    tipo: str
    ubicacion: str
    habitaciones: int
    banos: int
    area_m2: float
    precio: float

    # Algunos campos adicionales típicos (opcionales)
    estado: Optional[str] = None
    tiene_piscina: Optional[bool] = None
    tiene_gimnasio: Optional[bool] = None
    tiene_seguridad: Optional[bool] = None
    tiene_jardin: Optional[bool] = None
    estacionamientos: Optional[int] = None
    cerca_escuelas: Optional[bool] = None


class PredictionResponse(BaseModel):
    categoria_precio: str


class SearchOrder(str, Enum):
    matching = "matching"      # orden por afinidad IA (score de afinidad)
    price_asc = "price_asc"    # precio ascendente
    price_desc = "price_desc"  # precio descendente
    newest = "newest"          # más recientes (si hay información temporal disponible)


class SearchIARequest(BaseModel):
    """Request genérico para búsqueda IA consumible por front y otros servicios."""

    query: str
    filters: Dict[str, Any] = {}
    sort: SearchOrder = SearchOrder.matching
    page: int = 1
    size: int = 20
    user_id: Optional[str] = None


class SearchItem(BaseModel):
    """Representación de un inmueble en la respuesta de búsqueda IA.

    Se deja como Dict[str, Any] para mantener compatibilidad con los datos
    normalizados de proveedores (UnifiedProperty.raw) y permitir campos
    adicionales como affinity_score, affinity_level, etc.
    """

    data: Dict[str, Any]


class SearchIAResponse(BaseModel):
    """Respuesta estándar de búsqueda IA para consumo por front u otros clientes."""

    search_id: str
    sort: SearchOrder
    available_sorts: List[SearchOrder]
    total: int
    total_returned: int
    page: int
    size: int
    items: List[Dict[str, Any]]
    stats: Optional[Dict[str, Any]] = None
    filters: Optional[Dict[str, Any]] = None


__all__ = [
    "InmuebleInput",
    "PredictionResponse",
    "SearchOrder",
    "SearchIARequest",
    "SearchItem",
    "SearchIAResponse",
]

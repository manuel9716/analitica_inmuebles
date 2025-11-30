from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class UnifiedPropertyResponse(BaseModel):
    """Esquema de respuesta expuesto por la API para un inmueble unificado."""

    id: str
    source: str
    source_id: str

    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    area_m2: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None

    country: Optional[str] = None
    city: Optional[str] = None
    zone: Optional[str] = None
    address: Optional[str] = None

    images: List[str] = []

    phones: List[str] = []
    contact_name: Optional[str] = None

    raw: Dict[str, Any] = {}


class ProvidersListResponse(BaseModel):
    providers: List[str]


class PropertiesListResponse(BaseModel):
    total: int
    provider: Optional[str] = None
    properties: List[UnifiedPropertyResponse]

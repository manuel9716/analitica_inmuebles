from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class UnifiedProperty:
    """Representación unificada de un inmueble independiente del proveedor."""

    # Identificación
    id: str
    source: str
    source_id: str

    # Datos principales
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    area_m2: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None

    # Ubicación
    country: Optional[str] = None
    city: Optional[str] = None
    zone: Optional[str] = None
    address: Optional[str] = None

    # Medios
    images: List[str] = field(default_factory=list)

    # Contacto
    phones: List[str] = field(default_factory=list)
    contact_name: Optional[str] = None

    # Metadatos / payload original
    raw: Dict[str, Any] = field(default_factory=dict)

from typing import Any, List, Optional

from fastapi import APIRouter, HTTPException, Query

from integrations.providers import (
    UnifiedProperty,
    fetch_all_properties,
    get_provider,
    list_providers,
)
from integrations.providers.highlight import rank_properties
from app.models.providers import (
    ProvidersListResponse,
    PropertiesListResponse,
    UnifiedPropertyResponse,
)


router = APIRouter(prefix="/v1/providers", tags=["providers"])


def _to_response_model(p: UnifiedProperty) -> UnifiedPropertyResponse:
    """Convierte un UnifiedProperty (dataclass) a modelo Pydantic."""

    return UnifiedPropertyResponse(
        id=p.id,
        source=p.source,
        source_id=p.source_id,
        title=p.title,
        description=p.description,
        price=p.price,
        currency=p.currency,
        area_m2=p.area_m2,
        bedrooms=p.bedrooms,
        bathrooms=p.bathrooms,
        country=p.country,
        city=p.city,
        zone=p.zone,
        address=p.address,
        images=list(p.images or []),
        phones=list(p.phones or []),
        contact_name=p.contact_name,
        raw=p.raw or {},
    )


@router.get("/", response_model=ProvidersListResponse)
async def list_registered_providers() -> ProvidersListResponse:
    """Lista los proveedores de inmuebles registrados en el sistema."""

    providers = list_providers()
    return ProvidersListResponse(providers=providers)


@router.get("/properties", response_model=PropertiesListResponse)
async def list_properties(
    provider: Optional[str] = Query(
        default=None,
        description="Nombre del proveedor (ej: 'wasi'). Si se omite, consulta todos.",
    ),
    city: Optional[str] = Query(default=None, description="Filtrar por ciudad"),
    price_min: Optional[float] = Query(default=None, description="Precio mínimo"),
    price_max: Optional[float] = Query(default=None, description="Precio máximo"),
    bedrooms_min: Optional[int] = Query(default=None, description="Habitaciones mínimas"),
    bathrooms_min: Optional[int] = Query(default=None, description="Baños mínimos"),
    limit: int = Query(default=200, ge=1, le=2000, description="Máximo de inmuebles a retornar"),
) -> PropertiesListResponse:
    """Retorna inmuebles unificados desde uno o varios proveedores.

    Por ahora los filtros se aplican en memoria sobre la lista unificada.
    """

    if provider is not None:
        try:
            prov = get_provider(provider)
        except KeyError:
            raise HTTPException(status_code=404, detail=f"Proveedor desconocido: {provider}")
        props: List[UnifiedProperty] = prov.fetch_properties(max_inmuebles=limit)
    else:
        props = fetch_all_properties(max_inmuebles=limit)  # type: ignore[arg-type]

    # Filtros básicos en memoria
    def _match(p: UnifiedProperty) -> bool:
        if city and (p.city or "").lower() != city.lower():
            return False
        if price_min is not None and (p.price is None or p.price < price_min):
            return False
        if price_max is not None and (p.price is None or p.price > price_max):
            return False
        if bedrooms_min is not None and (p.bedrooms or 0) < bedrooms_min:
            return False
        if bathrooms_min is not None and (p.bathrooms or 0) < bathrooms_min:
            return False
        return True

    filtered = [p for p in props if _match(p)]

    # Aplicar ranking de inmuebles destacados + prioridad de proveedor
    ranked = rank_properties(filtered)

    # Limitar resultados finales por seguridad
    limited = ranked[:limit]

    return PropertiesListResponse(
        total=len(filtered),
        provider=provider,
        properties=[_to_response_model(p) for p in limited],
    )

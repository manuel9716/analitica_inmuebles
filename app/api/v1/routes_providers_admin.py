from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from integrations.providers import list_providers
from integrations.providers.priority import (
    load_priorities,
    normalize_order,
    save_priorities,
    sort_providers,
)
from integrations.providers.highlight import load_highlights, save_highlights


router = APIRouter(prefix="/v1/providers", tags=["providers-admin"])


@router.get("/priority", summary="Obtener orden de prioridad de proveedores")
async def get_providers_priority() -> dict:
    """Retorna el orden de prioridad configurado para los proveedores.

    El orden se devuelve como una lista ordenada y como mapa de prioridades
    `{provider: prioridad}` para facilitar su consumo desde paneles admin.
    """

    registrados = list_providers()
    prioridades = load_priorities()
    orden = sort_providers(registrados, prioridades)

    return {
        "order": orden,
        "priorities": {name: int(prioridades.get(name, idx + 1)) for idx, name in enumerate(orden)},
        "available_providers": registrados,
    }


class ProvidersPriorityUpdateBody(BaseModel):
    """Cuerpo mínimo para actualizar prioridades.

    Solo necesitamos una clave `order` con una lista de nombres de
    proveedor en el orden deseado.
    """

    order: List[str]


@router.put("/priority", summary="Actualizar orden de prioridad de proveedores")
async def update_providers_priority(body: ProvidersPriorityUpdateBody) -> dict:
    """Actualiza el orden de prioridad de los proveedores.

    Espera un JSON con la forma:

    ```json
    { "order": ["wasi", "manuel", "felipe"] }
    ```

    Solo se permiten nombres que ya estén registrados. Si se omite algún
    proveedor registrado, se mantendrá pero se ubicará al final según
    orden alfabético.
    """

    if "order" not in body or not isinstance(body["order"], list):
        raise HTTPException(status_code=400, detail="El cuerpo debe incluir la clave 'order' con una lista de proveedores")

    nuevos_nombres = [str(n).strip() for n in body["order"] if str(n).strip()]
    if not nuevos_nombres:
        raise HTTPException(status_code=400, detail="La lista 'order' no puede estar vacía")

    registrados = list_providers()
    registrados_set = set(registrados)

    # Validar que todos los nombres enviados existan
    desconocidos = [n for n in nuevos_nombres if n not in registrados_set]
    if desconocidos:
        raise HTTPException(
            status_code=400,
            detail=f"Proveedores desconocidos en 'order': {', '.join(desconocidos)}",
        )

    # Construir un orden completo: primero los que vienen en el cuerpo, luego el resto
    resto = [n for n in registrados if n not in nuevos_nombres]
    orden_completo: List[str] = nuevos_nombres + resto

    prioridades = normalize_order(orden_completo)
    save_priorities(prioridades)

    # Devolver el estado actualizado
    orden_efectiva = sort_providers(registrados, prioridades)

    return {
        "order": orden_efectiva,
        "priorities": prioridades,
        "available_providers": registrados,
    }


@router.get("/highlights", summary="Listar inmuebles destacados")
async def list_highlighted_properties() -> dict:
    """Retorna la configuración actual de inmuebles destacados.

    La respuesta es una lista de objetos con `source`, `source_id` y
    `weight` (mayor peso = mayor prioridad en el ranking).
    """

    raw = load_highlights()
    items = [
        {"source": s, "source_id": sid, "weight": w}
        for (s, sid), w in raw.items()
    ]
    return {"highlights": items}


class HighlightItem(BaseModel):
    source: str
    source_id: str
    weight: int


class HighlightUpdateBody(BaseModel):
    """Cuerpo para actualizar la lista completa de inmuebles destacados.

    Espera un JSON con la forma:

    ```json
    {
      "highlights": [
        {"source": "wasi", "source_id": "123", "weight": 100},
        {"source": "wasi", "source_id": "456", "weight": 50}
      ]
    }
    ```
    """

    highlights: List[HighlightItem]


@router.put("/highlights", summary="Actualizar inmuebles destacados")
async def update_highlighted_properties(body: HighlightUpdateBody) -> dict:
    """Reemplaza la configuración de inmuebles destacados.

    Cualquier entrada con `weight <= 0` será ignorada.
    """

    new_map = {}
    for item in body.highlights:
        source = item.source.strip()
        source_id = item.source_id.strip()
        weight = int(item.weight)
        if weight <= 0:
            continue
        new_map[(source, source_id)] = weight

    save_highlights(new_map)

    # Devolver el estado persistido
    persisted = load_highlights()
    items = [
        {"source": s, "source_id": sid, "weight": w}
        for (s, sid), w in persisted.items()
    ]
    return {"highlights": items}

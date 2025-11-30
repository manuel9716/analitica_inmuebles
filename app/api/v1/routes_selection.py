from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from integrations.selection.store import selection_store
from integrations.search.engine import SearchEngine, SearchResult


router = APIRouter(prefix="/v1/selection", tags=["selection"])

search_engine = SearchEngine()


class CreateSelectionBody(BaseModel):
    property_ids: List[str]
    owner_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class UpdateSelectionBody(BaseModel):
    property_ids: List[str]


@router.post("/", summary="Crear una nueva selección de inmuebles")
async def create_selection(body: CreateSelectionBody) -> Dict[str, Any]:
    if not body.property_ids:
        raise HTTPException(status_code=400, detail="Debe proporcionar al menos un ID de inmueble")

    sel = selection_store.create_selection(
        property_ids=body.property_ids,
        owner_id=body.owner_id,
        metadata=body.metadata,
    )

    return {
        "selection_id": sel.selection_id,
        "total": len(sel.property_ids),
        "owner_id": sel.owner_id,
        "metadata": sel.metadata,
        "created_at": sel.created_at,
        "updated_at": sel.updated_at,
    }


@router.post("/{selection_id}/add", summary="Agregar inmuebles a una selección existente")
async def add_to_selection(selection_id: str, body: UpdateSelectionBody) -> Dict[str, Any]:
    if not body.property_ids:
        raise HTTPException(status_code=400, detail="Debe proporcionar al menos un ID de inmueble")

    try:
        sel = selection_store.add_to_selection(selection_id, body.property_ids)
    except KeyError:
        raise HTTPException(status_code=404, detail="Selección no encontrada")

    return {
        "selection_id": sel.selection_id,
        "total": len(sel.property_ids),
        "owner_id": sel.owner_id,
        "metadata": sel.metadata,
        "created_at": sel.created_at,
        "updated_at": sel.updated_at,
    }


@router.post("/{selection_id}/remove", summary="Eliminar inmuebles de una selección existente")
async def remove_from_selection(selection_id: str, body: UpdateSelectionBody) -> Dict[str, Any]:
    if not body.property_ids:
        raise HTTPException(status_code=400, detail="Debe proporcionar al menos un ID de inmueble")

    try:
        sel = selection_store.remove_from_selection(selection_id, body.property_ids)
    except KeyError:
        raise HTTPException(status_code=404, detail="Selección no encontrada")

    return {
        "selection_id": sel.selection_id,
        "total": len(sel.property_ids),
        "owner_id": sel.owner_id,
        "metadata": sel.metadata,
        "created_at": sel.created_at,
        "updated_at": sel.updated_at,
    }


@router.get("/{selection_id}", summary="Obtener detalle de una selección")
async def get_selection(selection_id: str) -> Dict[str, Any]:
    try:
        sel = selection_store.get_selection(selection_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Selección no encontrada")

    return {
        "selection_id": sel.selection_id,
        "property_ids": sel.property_ids,
        "owner_id": sel.owner_id,
        "metadata": sel.metadata,
        "created_at": sel.created_at,
        "updated_at": sel.updated_at,
    }


@router.get("/", summary="Listar selecciones activas")
async def list_selections(owner_id: Optional[str] = None) -> Dict[str, Any]:
    sels = selection_store.list_selections(owner_id=owner_id)
    return {
        "total": len(sels),
        "items": [
            {
                "selection_id": s.selection_id,
                "property_ids": s.property_ids,
                "owner_id": s.owner_id,
                "metadata": s.metadata,
                "created_at": s.created_at,
                "updated_at": s.updated_at,
            }
            for s in sels
        ],
    }


@router.get("/{selection_id}/properties", summary="Obtener inmuebles de una selección")
async def get_selection_properties(selection_id: str, limit: int = 100) -> Dict[str, Any]:
    """Devuelve las propiedades de una selección usando el motor de búsqueda rápida.

    Esto permite que front, IA, comparadores y agendas trabajen con un
    `selection_id` único sin duplicar lógica de búsqueda ni normalización.
    """

    try:
        sel = selection_store.get_selection(selection_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Selección no encontrada")

    if not sel.property_ids:
        return {
            "selection_id": sel.selection_id,
            "total": 0,
            "resultados": [],
        }

    # Usamos el SearchEngine para obtener inmuebles y afinidad. Como ya
    # tenemos un conjunto acotado de IDs, podemos filtrar en el cliente
    # tras cargar las propiedades.
    all_results: List[SearchResult] = search_engine.search({}, limit=5000)

    # Filtrar por los IDs seleccionados, respetando el orden de afinidad
    selected_ids = set(map(str, sel.property_ids))
    filtered: List[SearchResult] = [r for r in all_results if f"{r.property.source}:{r.property.source_id}" in selected_ids]

    if limit > 0:
        filtered = filtered[:limit]

    items: List[Dict[str, Any]] = []
    for r in filtered:
        prop = r.property
        raw: Dict[str, Any] = dict(prop.raw or {})
        raw["affinity_score"] = float(r.affinity_score)
        raw["affinity_level"] = r.affinity_level
        items.append(raw)

    return {
        "selection_id": sel.selection_id,
        "total": len(sel.property_ids),
        "total_retornados": len(items),
        "resultados": items,
    }

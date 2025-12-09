from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    SearchIARequest,
    SearchIAResponse,
    SearchOrder,
)
from integrations.search.engine import SearchEngine, SearchResult


router = APIRouter(prefix="/v1/search", tags=["search"])

search_engine = SearchEngine()


def _build_items(results: List[SearchResult]) -> List[Dict[str, Any]]:
    items: List[Dict[str, Any]] = []
    for r in results:
        prop = r.property
        raw: Dict[str, Any] = dict(prop.raw or {})
        raw["affinity_score"] = float(r.affinity_score)
        raw["affinity_level"] = r.affinity_level
        if prop.price is not None and "precio" not in raw:
            raw["precio"] = prop.price
        if prop.city is not None and "ciudad" not in raw:
            raw["ciudad"] = prop.city
        if prop.zone is not None and "zona" not in raw:
            raw["zona"] = prop.zone
        items.append(raw)
    return items


def _sort_items(items: List[Dict[str, Any]], order: SearchOrder) -> List[Dict[str, Any]]:
    if order == SearchOrder.matching:
        return items

    if order in (SearchOrder.price_asc, SearchOrder.price_desc):
        def get_price(it: Dict[str, Any]) -> float:
            value = it.get("precio") or it.get("price")
            try:
                return float(value)
            except (TypeError, ValueError):
                return float("inf")

        reverse = order == SearchOrder.price_desc
        return sorted(items, key=get_price, reverse=reverse)

    if order == SearchOrder.newest:
        def get_ts(it: Dict[str, Any]) -> float:
            for field in ("updated_at", "created_at", "fecha_publicacion"):
                value = it.get(field)
                if not value:
                    continue
                if isinstance(value, (int, float)):
                    return float(value)
                try:
                    dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
                    return dt.timestamp()
                except Exception:
                    continue
            return 0.0

        return sorted(items, key=get_ts, reverse=True)

    return items


@router.post("/ia", response_model=SearchIAResponse, summary="Búsqueda IA con afinidad y orden configurable")
async def search_ia(body: SearchIARequest) -> SearchIAResponse:
    criteria: Dict[str, Any] = dict(body.filters or {})

    results: List[SearchResult] = search_engine.search(criteria, limit=1000)
    if not results:
        return SearchIAResponse(
            search_id=str(int(datetime.utcnow().timestamp() * 1000)),
            sort=body.sort,
            available_sorts=[
                SearchOrder.matching,
                SearchOrder.price_asc,
                SearchOrder.price_desc,
                SearchOrder.newest,
            ],
            total=0,
            total_returned=0,
            page=body.page,
            size=body.size,
            items=[],
            stats=None,
            filters=criteria,
        )

    items = _build_items(results)
    sorted_items = _sort_items(items, body.sort)

    page = max(1, body.page)
    size = max(1, body.size)
    start = (page - 1) * size
    end = start + size
    paged_items = sorted_items[start:end]

    precios: List[float] = []
    for it in items:
        value = it.get("precio") or it.get("price")
        try:
            precios.append(float(value))
        except (TypeError, ValueError):
            continue

    if precios:
        stats: Dict[str, Any] = {
            "precio_promedio": float(sum(precios) / len(precios)),
            "precio_minimo": float(min(precios)),
            "precio_maximo": float(max(precios)),
        }
    else:
        stats = {
            "precio_promedio": 0.0,
            "precio_minimo": 0.0,
            "precio_maximo": 0.0,
        }

    return SearchIAResponse(
        search_id=str(int(datetime.utcnow().timestamp() * 1000)),
        sort=body.sort,
        available_sorts=[
            SearchOrder.matching,
            SearchOrder.price_asc,
            SearchOrder.price_desc,
            SearchOrder.newest,
        ],
        total=len(items),
        total_returned=len(paged_items),
        page=page,
        size=size,
        items=paged_items,
        stats=stats,
        filters=criteria,
    )

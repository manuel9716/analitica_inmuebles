"""Servicio central para gestionar inmuebles destacados.

Permite asignar un peso de prioridad adicional a inmuebles
identificados por (source, source_id), de forma que puedan
aparecer antes en los resultados independientemente del
proveedor.

Este módulo es reutilizable por el motor de búsqueda, la IA y
las analíticas.
"""

from __future__ import annotations

import json
import os
from typing import Dict, Iterable, List, Tuple

from .models import UnifiedProperty
from .priority import load_priorities, sort_providers


_DEFAULT_HIGHLIGHTS_PATH = os.path.join("data", "config", "highlighted_properties.json")


def _ensure_config_dir(path: str) -> None:
    directory = os.path.dirname(path)
    if directory and not os.path.exists(directory):
        os.makedirs(directory, exist_ok=True)


def load_highlights(path: str = _DEFAULT_HIGHLIGHTS_PATH) -> Dict[Tuple[str, str], int]:
    """Carga el mapa de inmuebles destacados desde disco.

    Retorna un dict con clave (source, source_id) y valor entero
    de peso (mayor = más prioridad).
    """

    if not os.path.exists(path):
        return {}

    try:
        with open(path, "r", encoding="utf-8") as f:
            raw = json.load(f)
    except Exception:
        return {}

    result: Dict[Tuple[str, str], int] = {}
    if not isinstance(raw, list):
        return result

    for item in raw:
        if not isinstance(item, dict):
            continue
        source = str(item.get("source", "")).strip()
        source_id = str(item.get("source_id", "")).strip()
        if not source or not source_id:
            continue
        try:
            weight = int(item.get("weight", 0))
        except (ValueError, TypeError):
            continue
        if weight <= 0:
            continue
        result[(source, source_id)] = weight
    return result


def save_highlights(highlights: Dict[Tuple[str, str], int], path: str = _DEFAULT_HIGHLIGHTS_PATH) -> None:
    """Guarda el mapa de inmuebles destacados en disco."""

    _ensure_config_dir(path)
    payload = [
        {"source": s, "source_id": sid, "weight": w}
        for (s, sid), w in highlights.items()
        if w > 0
    ]
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


def rank_properties(properties: Iterable[UnifiedProperty]) -> List[UnifiedProperty]:
    """Ordena propiedades aplicando pesos de destacados y prioridad de proveedor.

    - Primero se considera el peso de destacado (weight) descendente.
    - Luego la prioridad del proveedor (usando las prioridades globales).
    - Finalmente, un orden alfabético estable por `source_id` para
      garantizar determinismo.
    """

    props = list(properties)
    if not props:
        return props

    highlights = load_highlights()
    provider_priorities = load_priorities()

    # Precalcular orden de proveedores para desempates
    ordered_providers = sort_providers({p.source or "" for p in props}, provider_priorities)
    provider_index = {name: idx for idx, name in enumerate(ordered_providers)}

    def _key(p: UnifiedProperty) -> tuple[int, int, str]:
        source = p.source or ""
        source_id = str(p.source_id or "")
        weight = highlights.get((source, source_id), 0)
        # Peso negativo para ordenar descendente por weight
        weight_key = -weight
        provider_pos = provider_index.get(source, len(provider_index) + 1)
        return (weight_key, provider_pos, source_id)

    return sorted(props, key=_key)


__all__ = ["load_highlights", "save_highlights", "rank_properties"]

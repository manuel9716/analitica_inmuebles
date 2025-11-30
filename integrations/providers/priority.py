"""Servicio central de priorización de proveedores.

Este módulo define la lógica reutilizable para configurar y aplicar
el orden de prioridad de los proveedores (por ejemplo:
["wasi", "manuel", "felipe"]).

La configuración se almacena en un archivo JSON sencillo para
mantener el acoplamiento bajo. Otros componentes (motor de búsqueda,
IA, analíticas) pueden reutilizar estas funciones sin duplicar lógica.
"""

from __future__ import annotations

import json
import os
from typing import Dict, Iterable, List


# Ruta de configuración (puede ajustarse en el futuro o inyectarse por env)
_DEFAULT_CONFIG_PATH = os.path.join("data", "config", "providers_priority.json")


def _ensure_config_dir(path: str) -> None:
    directory = os.path.dirname(path)
    if directory and not os.path.exists(directory):
        os.makedirs(directory, exist_ok=True)


def load_priorities(path: str = _DEFAULT_CONFIG_PATH) -> Dict[str, int]:
    """Carga el mapa de prioridades desde disco.

    Retorna un dict {provider_name: prioridad}. Números más bajos
    representan mayor prioridad (1 es la más alta).
    """

    if not os.path.exists(path):
        return {}

    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, dict):
            return {}
        # Normalizar a int
        result: Dict[str, int] = {}
        for k, v in data.items():
            try:
                result[str(k)] = int(v)
            except (ValueError, TypeError):
                continue
        return result
    except Exception:
        # Si hay un problema con el archivo, se ignora y se usa vacío.
        return {}


def save_priorities(priorities: Dict[str, int], path: str = _DEFAULT_CONFIG_PATH) -> None:
    """Guarda el mapa de prioridades en disco."""

    _ensure_config_dir(path)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(priorities, f, ensure_ascii=False, indent=2)


def normalize_order(order: Iterable[str]) -> Dict[str, int]:
    """Convierte una lista ordenada de proveedores en un mapa de prioridad.

    El primer elemento recibe prioridad 1, el segundo 2, etc.
    """

    priorities: Dict[str, int] = {}
    for idx, name in enumerate(order, start=1):
        name_str = str(name).strip()
        if not name_str:
            continue
        if name_str in priorities:
            continue
        priorities[name_str] = idx
    return priorities


def sort_providers(names: Iterable[str], priorities: Dict[str, int] | None = None) -> List[str]:
    """Ordena proveedores según el mapa de prioridades.

    Cualquier proveedor sin prioridad explícita se coloca al final,
    manteniendo orden alfabético entre ellos.
    """

    if priorities is None:
        priorities = load_priorities()

    def _key(name: str) -> tuple[int, str]:
        name_str = str(name)
        prio = priorities.get(name_str)
        if prio is None:
            # Usar un valor grande para forzar que queden al final
            return (10_000, name_str.lower())
        return (prio, name_str.lower())

    return sorted({str(n) for n in names}, key=_key)


def sort_unified_properties(
    properties: Iterable["UnifiedProperty"],
    priorities: Dict[str, int] | None = None,
) -> List["UnifiedProperty"]:
    """Ordena una lista de UnifiedProperty según la prioridad de su `source`.

    Si un `source` no tiene prioridad configurada, queda al final.
    """

    from .models import UnifiedProperty  # import local para evitar ciclos

    if priorities is None:
        priorities = load_priorities()

    def _key(p: UnifiedProperty) -> tuple[int, str]:
        source = p.source or ""
        prio = priorities.get(source)
        if prio is None:
            return (10_000, source.lower())
        return (prio, source.lower())

    return sorted(list(properties), key=_key)


__all__ = [
    "load_priorities",
    "save_priorities",
    "normalize_order",
    "sort_providers",
    "sort_unified_properties",
]

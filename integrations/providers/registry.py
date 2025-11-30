from __future__ import annotations

from typing import Dict, Iterable, List

from .base import BaseProvider
from .models import UnifiedProperty
from .priority import sort_providers


_PROVIDERS: Dict[str, BaseProvider] = {}


def register_provider(provider: BaseProvider) -> None:
    """Registra un proveedor en el registro global.

    Si ya existe un proveedor con el mismo nombre, será reemplazado.
    """

    name = provider.name
    _PROVIDERS[name] = provider


def get_provider(name: str) -> BaseProvider:
    """Obtiene un proveedor por nombre.

    Lanza `KeyError` si no existe.
    """

    return _PROVIDERS[name]


def list_providers() -> List[str]:
    """Devuelve la lista de nombres de proveedores registrados."""

    return sorted(_PROVIDERS.keys())


def get_all_providers() -> Iterable[BaseProvider]:
    """Itera sobre todos los proveedores registrados."""

    return _PROVIDERS.values()


def fetch_all_properties(**kwargs: object) -> List[UnifiedProperty]:
    """Obtiene inmuebles de todos los proveedores registrados.

    Cualquier argumento de palabra clave se reenvía a cada proveedor
    (por ejemplo, filtros globales simples).
    """

    properties: List[UnifiedProperty] = []

    # Aplicar orden de prioridad de proveedores
    ordered_names = sort_providers(_PROVIDERS.keys())
    for name in ordered_names:
        provider = _PROVIDERS.get(name)
        if provider is None:
            continue
        try:
            props = provider.fetch_properties(**kwargs)
            properties.extend(props)
        except Exception:
            # Errores de un proveedor no deberían tumbar a los demás.
            continue
    return properties

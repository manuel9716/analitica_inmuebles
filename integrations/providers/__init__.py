"""Módulo de integración de proveedores de inmuebles.

Expone utilidades para trabajar con múltiples fuentes (Wasi, Manuel,
Felipe y futuros proveedores) a través de un modelo de datos unificado
(`UnifiedProperty`) y una interfaz común (`BaseProvider`).
"""

from .models import UnifiedProperty
from .base import BaseProvider
from .registry import (
    register_provider,
    get_provider,
    get_all_providers,
    list_providers,
    fetch_all_properties,
)

# Importar implementaciones concretas para que se registren al cargar el paquete
from . import wasi_provider  # noqa: F401

__all__ = [
    "UnifiedProperty",
    "BaseProvider",
    "register_provider",
    "get_provider",
    "get_all_providers",
    "list_providers",
    "fetch_all_properties",
]

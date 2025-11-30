from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Iterable, List, Mapping, Optional

from .models import UnifiedProperty


class BaseProvider(ABC):
    """Interfaz base para un proveedor de inmuebles.

    Cada implementación concreta (Wasi, Manuel, Felipe, etc.) debe
    encargarse de obtener los datos desde su origen y mapearlos al
    modelo unificado `UnifiedProperty`.
    """

    #: Nombre interno del proveedor (ej: "wasi", "manuel").
    name: str

    def __init__(self, name: Optional[str] = None) -> None:
        if name is not None:
            self.name = name

    @abstractmethod
    def fetch_properties(self, **kwargs: object) -> List[UnifiedProperty]:
        """Obtiene inmuebles desde el proveedor.

        Los argumentos de palabra clave permiten que cada implementación
        use filtros específicos (paginación, ciudad, etc.).
        """

    def normalize_many(self, payloads: Iterable[Mapping[str, object]]) -> List[UnifiedProperty]:
        """Ayuda para normalizar múltiples registros crudos.

        Implementaciones concretas pueden sobrescribir este método si
        necesitan un flujo más avanzado.
        """

        return [self.normalize_one(payload) for payload in payloads]

    @abstractmethod
    def normalize_one(self, payload: Mapping[str, object]) -> UnifiedProperty:
        """Normaliza un registro crudo del proveedor a `UnifiedProperty`."""

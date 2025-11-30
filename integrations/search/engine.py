from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from integrations.affinity.engine import AffinityEngine
from integrations.providers import fetch_all_properties
from integrations.providers.models import UnifiedProperty
from integrations.providers.highlight import rank_properties


@dataclass
class SearchResult:
    property: UnifiedProperty
    affinity_score: float
    affinity_level: str


class SearchEngine:
    """Motor de búsqueda ultra-rápida basado en datos ya normalizados.

    Carga inmuebles desde los proveedores registrados (vía `fetch_all_properties`)
    y mantiene un índice en memoria sencillo sobre una lista de `UnifiedProperty`.

    NOTA: esta versión inicial está pensada para ser reutilizada por los endpoints
    de búsqueda estructurada y NLP, pero todavía no está conectada a ellos.
    """

    def __init__(self) -> None:
        self._properties: List[UnifiedProperty] = []
        self._loaded: bool = False
        self._affinity = AffinityEngine()

    # --------------------------------------------------------------
    # Carga y refresco del índice
    # --------------------------------------------------------------
    def load(self, force: bool = False, max_inmuebles: int = 2000) -> None:
        """Carga o recarga el índice en memoria desde los proveedores.

        `max_inmuebles` controla el número máximo total a traer en esta primera
        implementación. Se puede ajustar o parametrizar más adelante.
        """

        if self._loaded and not force:
            return

        props = fetch_all_properties(max_inmuebles=max_inmuebles)
        self._properties = list(props)
        self._loaded = True

    def clear(self) -> None:
        """Limpia el índice en memoria.

        Útil tras una sincronización completa con WASI.
        """

        self._properties = []
        self._loaded = False

    # --------------------------------------------------------------
    # Búsqueda principal
    # --------------------------------------------------------------
    def search(
        self,
        criteria: Dict[str, Any],
        *,
        limit: int = 100,
        offset: int = 0,
        ensure_loaded: bool = True,
    ) -> List[SearchResult]:
        """Busca inmuebles aplicando filtros, afinidad y prioridades.

        - `criteria`: criterios estructurados (habitaciones, precio, ciudad, etc.).
        - `limit` y `offset`: para paginación.
        - `ensure_loaded`: si es True, carga el índice si aún no está cargado.
        """

        if ensure_loaded:
            self.load()

        if not self._properties:
            return []

        criterios_originales = dict(criteria or {})

        # 1) Filtrado básico en memoria sobre la lista de propiedades
        candidatos: List[UnifiedProperty] = []
        for prop in self._properties:
            if not self._matches_basic_filters(prop, criterios_originales):
                continue
            candidatos.append(prop)

        if not candidatos:
            return []

        # 2) Ranking por destacados/prioridad de proveedor
        try:
            candidatos_ranked = rank_properties(candidatos)
        except Exception:
            candidatos_ranked = candidatos

        # 3) Calcular afinidad por inmueble
        results: List[SearchResult] = []
        for prop in candidatos_ranked:
            try:
                row_dict: Dict[str, Any] = {
                    "precio": prop.price,
                    "habitaciones": prop.bedrooms,
                    "banos": prop.bathrooms,
                    "ciudad": prop.city,
                    "zona": prop.zone,
                    "area_total": prop.area_m2,
                }
                score = self._affinity.compute_affinity(criterios_originales, row_dict)
                level = self._affinity.classify_level(score)
            except Exception:
                score = 0.0
                level = "very_low"

            results.append(SearchResult(property=prop, affinity_score=score, affinity_level=level))

        # 4) Orden final: afinidad descendente, manteniendo el orden de prioridades como base
        results_sorted = sorted(results, key=lambda r: (-r.affinity_score, r.property.source_id or ""))

        # 5) Paginación
        if offset < 0:
            offset = 0
        end = offset + limit if limit > 0 else None
        return results_sorted[offset:end]

    # --------------------------------------------------------------
    # Filtros básicos
    # --------------------------------------------------------------
    @staticmethod
    def _matches_basic_filters(prop: UnifiedProperty, criteria: Dict[str, Any]) -> bool:
        """Aplica filtros duros simples sobre un UnifiedProperty.

        Esta función debe ser muy ligera, sin llamadas externas.
        """

        # Tipo de inmueble (si se especifica)
        tipo = criteria.get("tipo")
        if tipo:
            # El tipo no está directamente en UnifiedProperty; se podría mapear vía raw.
            # De momento, si se requiere un "tipo" exacto, lo intentamos desde raw.
            raw_tipo = (prop.raw or {}).get("tipo") if prop.raw else None
            if raw_tipo is not None and str(raw_tipo) != str(tipo):
                return False

        # Ciudad
        ciudad = criteria.get("ciudad")
        if ciudad and prop.city is not None and str(prop.city) != str(ciudad):
            return False

        # Habitaciones mínimas
        hab_min = criteria.get("habitaciones_min")
        if hab_min is not None and prop.bedrooms is not None:
            try:
                if int(prop.bedrooms) < int(hab_min):
                    return False
            except (TypeError, ValueError):
                pass

        # Baños mínimos
        banos_min = criteria.get("banos_min")
        if banos_min is not None and prop.bathrooms is not None:
            try:
                if int(prop.bathrooms) < int(banos_min):
                    return False
            except (TypeError, ValueError):
                pass

        # Precio mínimo / máximo
        precio_min = criteria.get("precio_min")
        precio_max = criteria.get("precio_max")
        if prop.price is not None:
            try:
                p = float(prop.price)
                if precio_min is not None and p < float(precio_min):
                    return False
                if precio_max is not None and p > float(precio_max):
                    return False
            except (TypeError, ValueError):
                pass

        # Área mínima / máxima (usa area_m2 si está disponible)
        area_min = criteria.get("area_min")
        area_max = criteria.get("area_max")
        if prop.area_m2 is not None:
            try:
                a = float(prop.area_m2)
                if area_min is not None and a < float(area_min):
                    return False
                if area_max is not None and a > float(area_max):
                    return False
            except (TypeError, ValueError):
                pass

        return True


__all__ = ["SearchEngine", "SearchResult"]

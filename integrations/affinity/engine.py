from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any, Dict


_DEFAULT_AFFINITY_CONFIG_PATH = os.path.join("data", "config", "affinity_config.json")


@dataclass
class AffinityConfig:
    # Pesos relativos por campo (deben sumar aproximadamente 1.0, pero no es obligatorio)
    weight_price: float = 0.3
    weight_bedrooms: float = 0.2
    weight_bathrooms: float = 0.15
    weight_area: float = 0.15
    weight_location: float = 0.2  # ciudad / zona

    # Umbral mínimo recomendado (0-1)
    min_affinity: float = 0.9

    # Niveles de afinidad (0-1)
    level_very_low: float = 0.4
    level_medium: float = 0.6
    level_high: float = 0.8
    level_very_high: float = 0.9


class AffinityEngine:
    """Motor de cálculo de afinidad entre criterios de búsqueda e inmuebles.

    El score se expresa en una escala 0-100.
    """

    def __init__(self, config_path: str = _DEFAULT_AFFINITY_CONFIG_PATH) -> None:
        self.config_path = config_path
        self.config = self._load_config()

    def _load_config(self) -> AffinityConfig:
        if not os.path.exists(self.config_path):
            return AffinityConfig()
        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                raw = json.load(f)
        except Exception:
            return AffinityConfig()

        cfg = AffinityConfig()
        for field in (
            "weight_price",
            "weight_bedrooms",
            "weight_bathrooms",
            "weight_area",
            "weight_location",
            "min_affinity",
            "level_very_low",
            "level_medium",
            "level_high",
            "level_very_high",
        ):
            if field in raw:
                try:
                    setattr(cfg, field, float(raw[field]))
                except (TypeError, ValueError):
                    continue
        return cfg

    # API pública

    def compute_affinity(self, criteria: Dict[str, Any], inmueble: Dict[str, Any]) -> float:
        """Calcula la afinidad (0-100) entre criterios e inmueble.

        `criteria`: criterios de búsqueda normalizados (los que ya usamos en FastAPI/NLP)
        `inmueble`: dict con los campos del inmueble (DataFrame row -> dict)
        """

        if not criteria:
            return 0.0

        cfg = self.config

        # Si el inmueble cumple todos los criterios "duros" que el usuario expresó
        # (ciudad, zona, tipo, tipo_negocio, y banderas booleanas explícitas),
        # forzamos una afinidad 100 y usamos el cálculo ponderado solo como fallback.
        if self._matches_hard_criteria(criteria, inmueble):
            return 100.0

        # Sub-scores por campo en rango 0-1
        score_price = self._score_price(criteria, inmueble)
        score_bedrooms = self._score_bedrooms(criteria, inmueble)
        score_bathrooms = self._score_bathrooms(criteria, inmueble)
        score_area = self._score_area(criteria, inmueble)
        score_location = self._score_location(criteria, inmueble)

        # Suma ponderada
        total_weight = (
            cfg.weight_price
            + cfg.weight_bedrooms
            + cfg.weight_bathrooms
            + cfg.weight_area
            + cfg.weight_location
        )
        if total_weight <= 0:
            return 0.0

        weighted_sum = (
            score_price * cfg.weight_price
            + score_bedrooms * cfg.weight_bedrooms
            + score_bathrooms * cfg.weight_bathrooms
            + score_area * cfg.weight_area
            + score_location * cfg.weight_location
        )

        affinity_0_1 = max(0.0, min(1.0, weighted_sum / total_weight))
        return round(affinity_0_1 * 100.0, 2)

    # --- helpers de coincidencia fuerte ---

    @staticmethod
    def _matches_hard_criteria(criteria: Dict[str, Any], inmueble: Dict[str, Any]) -> bool:
        """Devuelve True si el inmueble cumple todos los criterios "duros" explícitos.

        Se consideran duros:
        - ciudad, zona, tipo, tipo_negocio (coincidencia de texto, case-insensitive)
        - banderas booleanas como tiene_parqueadero, tiene_piscina, tiene_gimnasio,
          tiene_seguridad, tiene_ascensor, mascotas, amoblado, balcon, terraza

        La idea es que si el usuario pide "apto en Cali con parqueadero", cualquier
        inmueble que sea de Cali y tenga parqueadero reciba afinidad 100.
        """

        if not criteria:
            return False

        # Comparaciones de texto
        def _norm_str(v: Any) -> str:
            return str(v or "").strip().lower()

        hard_text_fields = ["ciudad", "zona", "tipo", "tipo_negocio"]
        titulo_prop = _norm_str(inmueble.get("titulo"))
        direccion_prop = _norm_str(inmueble.get("direccion"))

        for field in hard_text_fields:
            crit_val = _norm_str(criteria.get(field))
            if not crit_val:
                continue

            prop_val = _norm_str(inmueble.get(field))

            if field == "ciudad":
                # Aceptar coincidencia si la ciudad aparece en ciudad, título o dirección
                if prop_val == crit_val:
                    continue
                if crit_val in titulo_prop or crit_val in direccion_prop:
                    continue
                return False

            else:
                if not prop_val or crit_val != prop_val:
                    return False

        # Banderas booleanas explícitas
        bool_fields = [
            "tiene_parqueadero",
            "tiene_piscina",
            "tiene_gimnasio",
            "tiene_seguridad",
            "tiene_ascensor",
            "mascotas",
            "amoblado",
            "balcon",
            "terraza",
        ]

        for field in bool_fields:
            if field not in criteria:
                continue
            crit_val = bool(criteria.get(field))
            prop_val = bool(inmueble.get(field))
            if crit_val != prop_val:
                return False

        # Si ninguno de los campos anteriores estaba en criteria, no consideramos
        # que haya un match fuerte; en ese caso se usará solo el score ponderado.
        has_any_hard = any(
            (field in criteria and criteria.get(field) not in (None, ""))
            for field in (hard_text_fields + bool_fields)
        )
        if not has_any_hard:
            return False

        return True

    def classify_level(self, score: float) -> str:
        """Clasifica un score 0-100 en un nivel simbólico."""

        s = score / 100.0
        cfg = self.config
        if s >= cfg.level_very_high:
            return "very_high"
        if s >= cfg.level_high:
            return "high"
        if s >= cfg.level_medium:
            return "medium"
        if s >= cfg.level_very_low:
            return "low"
        return "very_low"

    # --- helpers por campo ---

    @staticmethod
    def _to_float(value: Any) -> float | None:
        try:
            if value in (None, ""):
                return None
            return float(value)
        except (TypeError, ValueError):
            return None

    def _score_price(self, criteria: Dict[str, Any], inmueble: Dict[str, Any]) -> float:
        # criterios: precio_min, precio_max en COP (opcional)
        if "precio_min" not in criteria and "precio_max" not in criteria:
            return 0.0

        price = self._to_float(inmueble.get("precio"))
        if price is None:
            return 0.0

        pmin = self._to_float(criteria.get("precio_min"))
        pmax = self._to_float(criteria.get("precio_max"))

        # Dentro del rango -> 1.0
        if (pmin is None or price >= pmin) and (pmax is None or price <= pmax):
            return 1.0

        # Penalización suave si se sale un poco del rango
        # Si solo hay min
        if pmin is not None and pmax is None:
            if price >= pmin:
                return 0.7  # fuera pero hacia arriba se considera aún razonable
            diff = pmin - price
            return max(0.0, 1.0 - diff / max(pmin, 1.0))

        # Si solo hay max
        if pmax is not None and pmin is None:
            if price <= pmax:
                return 0.7
            diff = price - pmax
            return max(0.0, 1.0 - diff / max(pmax, 1.0))

        # Ambos presentes pero fuera del rango
        if pmin is not None and price < pmin:
            diff = pmin - price
            return max(0.0, 1.0 - diff / max(pmin, 1.0))
        if pmax is not None and price > pmax:
            diff = price - pmax
            return max(0.0, 1.0 - diff / max(pmax, 1.0))

        return 0.0

    def _score_bedrooms(self, criteria: Dict[str, Any], inmueble: Dict[str, Any]) -> float:
        # criterios: habitaciones, habitaciones_min
        if "habitaciones" not in criteria and "habitaciones_min" not in criteria:
            return 0.0

        try:
            hab = int(inmueble.get("habitaciones"))
        except (TypeError, ValueError):
            return 0.0

        target_exact = criteria.get("habitaciones")
        target_min = criteria.get("habitaciones_min")

        if target_exact is not None:
            try:
                target_exact = int(target_exact)
            except (TypeError, ValueError):
                target_exact = None

        if target_min is not None:
            try:
                target_min = int(target_min)
            except (TypeError, ValueError):
                target_min = None

        if target_exact is not None:
            if hab == target_exact:
                return 1.0
            if abs(hab - target_exact) == 1:
                return 0.7
            return 0.3 if hab >= target_exact else 0.1

        if target_min is not None:
            if hab >= target_min:
                return 1.0
            diff = target_min - hab
            return max(0.0, 1.0 - diff / max(target_min, 1))

        return 0.0

    def _score_bathrooms(self, criteria: Dict[str, Any], inmueble: Dict[str, Any]) -> float:
        # criterios: banos, banos_min
        if "banos" not in criteria and "banos_min" not in criteria:
            return 0.0

        try:
            banos = int(inmueble.get("banos"))
        except (TypeError, ValueError):
            return 0.0

        target_exact = criteria.get("banos")
        target_min = criteria.get("banos_min")

        if target_exact is not None:
            try:
                target_exact = int(target_exact)
            except (TypeError, ValueError):
                target_exact = None

        if target_min is not None:
            try:
                target_min = int(target_min)
            except (TypeError, ValueError):
                target_min = None

        if target_exact is not None:
            if banos == target_exact:
                return 1.0
            if abs(banos - target_exact) == 1:
                return 0.7
            return 0.3 if banos >= target_exact else 0.1

        if target_min is not None:
            if banos >= target_min:
                return 1.0
            diff = target_min - banos
            return max(0.0, 1.0 - diff / max(target_min, 1))

        return 0.0

    def _score_area(self, criteria: Dict[str, Any], inmueble: Dict[str, Any]) -> float:
        # criterios: area_min, area_max (si existieran en criterios)
        if "area_min" not in criteria and "area_max" not in criteria:
            return 0.0

        area = self._to_float(inmueble.get("area_total") or inmueble.get("area_construida") or inmueble.get("area_m2"))
        if area is None:
            return 0.0

        amin = self._to_float(criteria.get("area_min"))
        amax = self._to_float(criteria.get("area_max"))

        if (amin is None or area >= amin) and (amax is None or area <= amax):
            return 1.0

        if amin is not None and amax is None:
            if area >= amin:
                return 0.7
            diff = amin - area
            return max(0.0, 1.0 - diff / max(amin, 1.0))

        if amax is not None and amin is None:
            if area <= amax:
                return 0.7
            diff = area - amax
            return max(0.0, 1.0 - diff / max(amax, 1.0))

        if amin is not None and area < amin:
            diff = amin - area
            return max(0.0, 1.0 - diff / max(amin, 1.0))
        if amax is not None and area > amax:
            diff = area - amax
            return max(0.0, 1.0 - diff / max(amax, 1.0))

        return 0.0

    def _score_location(self, criteria: Dict[str, Any], inmueble: Dict[str, Any]) -> float:
        ciudad_crit = str(criteria.get("ciudad", "") or "").strip().lower()
        zona_crit = str(criteria.get("zona", "") or "").strip().lower()
        if not ciudad_crit and not zona_crit:
            return 0.0

        ciudad_prop = str(inmueble.get("ciudad", "") or "").strip().lower()
        zona_prop = str(inmueble.get("zona", "") or "").strip().lower()
        titulo_prop = str(inmueble.get("titulo", "") or "").strip().lower()
        direccion_prop = str(inmueble.get("direccion", "") or "").strip().lower()

        if ciudad_crit:
            # Coincidencia exacta en el campo ciudad
            if ciudad_prop and ciudad_crit == ciudad_prop:
                if zona_crit and zona_prop and zona_crit == zona_prop:
                    return 1.0
                return 0.8

            # Ciudad mencionada en título o dirección (casos donde "ciudad" viene como dirección)
            if ciudad_crit in titulo_prop or ciudad_crit in direccion_prop:
                return 0.8

        # Si solo coincide zona como texto dentro del campo
        if zona_crit and zona_crit in zona_prop:
            return 0.6

        # Misma ciudad aproximada (substring) puede valer algo
        if ciudad_crit and ciudad_crit in ciudad_prop:
            return 0.5

        return 0.0


__all__ = ["AffinityEngine", "AffinityConfig"]

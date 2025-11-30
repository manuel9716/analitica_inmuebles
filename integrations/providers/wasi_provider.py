from __future__ import annotations

import json
from typing import List, Optional

from .base import BaseProvider
from .models import UnifiedProperty
from .registry import register_provider
from integrations.wasi.wasi_connector import WasiConnector
from integrations.wasi.config_wasi import obtener_credenciales_api, obtener_url_inmueble


class WasiProvider(BaseProvider):
    """Proveedor unificado basado en datos reales de WASI.

    Usa `WasiConnector` para obtener los inmuebles desde la API de WASI y
    los expone como instancias de `UnifiedProperty`.
    """

    name = "wasi"

    def __init__(self) -> None:
        super().__init__(name=self.name)
        creds = obtener_credenciales_api()
        self._connector = WasiConnector(
            id_company=str(creds["id_company"]),
            wasi_token=str(creds["wasi_token"]),
        )

    def fetch_properties(self, max_inmuebles: int = 1000, **kwargs: object) -> List[UnifiedProperty]:
        """Obtiene inmuebles desde WASI y los normaliza.

        `max_inmuebles` controla el límite superior de inmuebles a traer
        desde la API. Los `kwargs` se ignoran por ahora, pero se dejan
        para futura extensión (filtros por ciudad, tipo_negocio, etc.).
        """

        inmuebles_raw = self._connector.obtener_todos_los_inmuebles(max_inmuebles=max_inmuebles)
        if not inmuebles_raw:
            return []

        # Reutilizamos la lógica de normalización existente que genera
        # un DataFrame ya con columnas coherentes para el modelo local.
        df = self._connector.convertir_a_dataframe(inmuebles_raw)
        propiedades: List[UnifiedProperty] = []

        for _, row in df.iterrows():
            row_dict = row.to_dict()

            source_id = str(row_dict.get("id", ""))
            if not source_id:
                # Sin ID no podemos construir un identificador estable
                continue

            unified_id = f"wasi:{source_id}"

            # Área preferimos area_total, si no area_construida
            area_total = row_dict.get("area_total")
            area_construida = row_dict.get("area_construida")
            try:
                area_m2 = float(area_total) if area_total not in (None, "") else None
            except (ValueError, TypeError):
                try:
                    area_m2 = float(area_construida) if area_construida not in (None, "") else None
                except (ValueError, TypeError):
                    area_m2 = None

            # Imágenes: el DataFrame guarda la lista en JSON string
            images: List[str] = []
            imagenes_raw = row_dict.get("imagenes")
            if isinstance(imagenes_raw, str) and imagenes_raw:
                try:
                    parsed = json.loads(imagenes_raw)
                    if isinstance(parsed, list):
                        images = [str(u) for u in parsed if u]
                except Exception:
                    images = []

            # URL pública del inmueble (si no viene ya en el DF, la derivamos)
            url = row_dict.get("url") or obtener_url_inmueble(source_id)

            prop = UnifiedProperty(
                id=unified_id,
                source=self.name,
                source_id=source_id,
                # Datos principales
                title=row_dict.get("titulo") or None,
                description=row_dict.get("descripcion") or None,
                price=_safe_float(row_dict.get("precio")),
                currency="COP",  # WASI trabaja en COP en este proyecto
                area_m2=area_m2,
                bedrooms=_safe_int(row_dict.get("habitaciones")),
                bathrooms=_safe_int(row_dict.get("banos")),
                # Ubicación
                country=None,  # no viene explícito en los datos actuales
                city=(row_dict.get("ciudad") or None),
                zone=(row_dict.get("zona") or None),
                address=(row_dict.get("direccion") or None),
                # Medios
                images=images,
                # Contacto: la API de WASI no se ha mapeado aún a este nivel
                phones=[],
                contact_name=None,
                # Metadatos crudos, incluyendo la URL derivada
                raw={**row_dict, "url_publica": url},
            )

            propiedades.append(prop)

        return propiedades

    def normalize_one(self, payload):  # type: ignore[override]
        """Normaliza un registro crudo de WASI.

        En este proyecto preferimos reutilizar la normalización que ya
        genera el DataFrame, por lo que este método no se usa
        directamente en `fetch_properties`. Se deja como gancho para
        futuras extensiones.
        """

        # Este método podría implementar un mapeo directo desde el JSON
        # crudo de WASI a `UnifiedProperty` si en el futuro se requiere.
        raise NotImplementedError("normalize_one no se usa en WasiProvider por ahora")


def _safe_float(value) -> Optional[float]:
    try:
        if value in (None, ""):
            return None
        return float(value)
    except (ValueError, TypeError):
        return None


def _safe_int(value) -> Optional[int]:
    try:
        if value in (None, ""):
            return None
        return int(value)
    except (ValueError, TypeError):
        return None


# Registrar automáticamente el proveedor al importar el módulo
register_provider(WasiProvider())

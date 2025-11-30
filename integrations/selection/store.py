from __future__ import annotations

import json
import os
import time
import uuid
from dataclasses import dataclass, asdict
from typing import Any, Dict, List, Optional


_DEFAULT_SELECTIONS_PATH = os.path.join("data", "config", "selections.json")


@dataclass
class Selection:
    selection_id: str
    property_ids: List[str]
    owner_id: Optional[str]
    metadata: Dict[str, Any]
    created_at: float
    updated_at: float


class SelectionStore:
    """Almacén central de selecciones de inmuebles.

    - Mantiene conjuntos de IDs de inmuebles seleccionados.
    - Permite que distintos módulos (front, IA, comparador, agenda) compartan
      un mismo `selection_id`.
    - Almacenamiento principal en memoria, con persistencia ligera opcional
      a `data/config/selections.json`.
    """

    def __init__(self, path: str = _DEFAULT_SELECTIONS_PATH, ttl_seconds: int = 3600) -> None:
        self._path = path
        self._ttl = ttl_seconds
        self._selections: Dict[str, Selection] = {}
        self._loaded = False

    # --------------------------------------------------------------
    # Carga / guardado ligero
    # --------------------------------------------------------------
    def _ensure_loaded(self) -> None:
        if self._loaded:
            return
        if not os.path.exists(self._path):
            self._loaded = True
            return
        try:
            with open(self._path, "r", encoding="utf-8") as f:
                raw = json.load(f)
        except Exception:
            self._loaded = True
            return

        if not isinstance(raw, list):
            self._loaded = True
            return

        now = time.time()
        for item in raw:
            try:
                sel = Selection(
                    selection_id=str(item["selection_id"]),
                    property_ids=list(map(str, item.get("property_ids", []))),
                    owner_id=item.get("owner_id"),
                    metadata=dict(item.get("metadata", {})),
                    created_at=float(item.get("created_at", now)),
                    updated_at=float(item.get("updated_at", now)),
                )
            except Exception:
                continue

            # Aplicar TTL al cargar
            if now - sel.updated_at > self._ttl:
                continue
            self._selections[sel.selection_id] = sel

        self._loaded = True

    def _persist(self) -> None:
        os.makedirs(os.path.dirname(self._path), exist_ok=True)
        payload = [asdict(s) for s in self._selections.values()]
        try:
            with open(self._path, "w", encoding="utf-8") as f:
                json.dump(payload, f, ensure_ascii=False, indent=2)
        except Exception:
            # La persistencia es best-effort, no debe romper el flujo
            pass

    def _cleanup_expired(self) -> None:
        now = time.time()
        to_delete = [sid for sid, s in self._selections.items() if now - s.updated_at > self._ttl]
        for sid in to_delete:
            self._selections.pop(sid, None)

    # --------------------------------------------------------------
    # API pública
    # --------------------------------------------------------------
    def create_selection(
        self,
        property_ids: List[str],
        owner_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Selection:
        """Crea una nueva selección y la almacena.

        Devuelve el objeto `Selection` creado.
        """

        self._ensure_loaded()
        self._cleanup_expired()

        sid = f"sel_{uuid.uuid4().hex[:12]}"
        now = time.time()
        sel = Selection(
            selection_id=sid,
            property_ids=list(dict.fromkeys(map(str, property_ids))),  # únicos, orden conservado
            owner_id=owner_id,
            metadata=dict(metadata or {}),
            created_at=now,
            updated_at=now,
        )
        self._selections[sid] = sel
        self._persist()
        return sel

    def add_to_selection(self, selection_id: str, property_ids: List[str]) -> Selection:
        """Agrega IDs a una selección existente (sin duplicados)."""

        self._ensure_loaded()
        self._cleanup_expired()

        sel = self.get_selection(selection_id)
        existing = list(sel.property_ids)
        for pid in map(str, property_ids):
            if pid not in existing:
                existing.append(pid)
        sel.property_ids = existing
        sel.updated_at = time.time()
        self._selections[selection_id] = sel
        self._persist()
        return sel

    def remove_from_selection(self, selection_id: str, property_ids: List[str]) -> Selection:
        """Elimina IDs de una selección existente."""

        self._ensure_loaded()
        self._cleanup_expired()

        sel = self.get_selection(selection_id)
        to_remove = set(map(str, property_ids))
        sel.property_ids = [pid for pid in sel.property_ids if pid not in to_remove]
        sel.updated_at = time.time()
        self._selections[selection_id] = sel
        self._persist()
        return sel

    def get_selection(self, selection_id: str) -> Selection:
        """Obtiene una selección por ID o lanza KeyError si no existe o expiró."""

        self._ensure_loaded()
        self._cleanup_expired()

        sel = self._selections.get(selection_id)
        if sel is None:
            raise KeyError(selection_id)
        return sel

    def list_selections(self, owner_id: Optional[str] = None) -> List[Selection]:
        """Lista selecciones activas, opcionalmente filtradas por owner_id."""

        self._ensure_loaded()
        self._cleanup_expired()

        values = list(self._selections.values())
        if owner_id is not None:
            values = [s for s in values if s.owner_id == owner_id]
        return values

    def clear_selection(self, selection_id: str) -> None:
        """Elimina una selección del almacén."""

        self._ensure_loaded()
        self._selections.pop(selection_id, None)
        self._persist()


# Instancia global sencilla que puede usarse desde los routers
selection_store = SelectionStore()


__all__ = ["Selection", "SelectionStore", "selection_store"]

from __future__ import annotations

import json
import os
import time
import uuid
from dataclasses import dataclass, asdict
from typing import Any, Dict, List, Optional


_DEFAULT_APPOINTMENTS_PATH = os.path.join("data", "config", "appointments.json")


@dataclass
class Appointment:
    appointment_id: str
    property_ids: List[str]
    owner_id: Optional[str]
    selection_id: Optional[str]
    channel: str
    requester: Dict[str, Any]
    time_window: Dict[str, Any]
    notes: str
    status: str
    contact_phone_used: str
    metadata: Dict[str, Any]
    created_at: float
    updated_at: float


class AppointmentStore:
    """Almacén central de citas de agendamiento.

    Almacenamiento principal en memoria, con persistencia ligera a JSON.
    """

    def __init__(self, path: str = _DEFAULT_APPOINTMENTS_PATH) -> None:
        self._path = path
        self._appointments: Dict[str, Appointment] = {}
        self._loaded = False

    # --------------------------------------------------------------
    # Carga / guardado
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

        for item in raw:
            try:
                appt = Appointment(
                    appointment_id=str(item["appointment_id"]),
                    property_ids=list(map(str, item.get("property_ids", []))),
                    owner_id=item.get("owner_id"),
                    selection_id=item.get("selection_id"),
                    channel=str(item.get("channel", "unknown")),
                    requester=dict(item.get("requester", {})),
                    time_window=dict(item.get("time_window", {})),
                    notes=str(item.get("notes", "")),
                    status=str(item.get("status", "pending")),
                    contact_phone_used=str(item.get("contact_phone_used", "")),
                    metadata=dict(item.get("metadata", {})),
                    created_at=float(item.get("created_at", time.time())),
                    updated_at=float(item.get("updated_at", time.time())),
                )
            except Exception:
                continue
            self._appointments[appt.appointment_id] = appt

        self._loaded = True

    def _persist(self) -> None:
        os.makedirs(os.path.dirname(self._path), exist_ok=True)
        payload = [asdict(a) for a in self._appointments.values()]
        try:
            with open(self._path, "w", encoding="utf-8") as f:
                json.dump(payload, f, ensure_ascii=False, indent=2)
        except Exception:
            pass

    # --------------------------------------------------------------
    # API pública
    # --------------------------------------------------------------
    def create_appointment(
        self,
        *,
        property_ids: List[str],
        owner_id: Optional[str],
        selection_id: Optional[str],
        channel: str,
        requester: Dict[str, Any],
        time_window: Dict[str, Any],
        notes: str,
        status: str,
        contact_phone_used: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Appointment:
        self._ensure_loaded()

        aid = f"appt_{uuid.uuid4().hex[:12]}"
        now = time.time()
        appt = Appointment(
            appointment_id=aid,
            property_ids=list(dict.fromkeys(map(str, property_ids))),
            owner_id=owner_id,
            selection_id=selection_id,
            channel=channel,
            requester=dict(requester or {}),
            time_window=dict(time_window or {}),
            notes=notes or "",
            status=status or "pending",
            contact_phone_used=contact_phone_used,
            metadata=dict(metadata or {}),
            created_at=now,
            updated_at=now,
        )
        self._appointments[aid] = appt
        self._persist()
        return appt

    def get_appointment(self, appointment_id: str) -> Appointment:
        self._ensure_loaded()
        appt = self._appointments.get(appointment_id)
        if appt is None:
            raise KeyError(appointment_id)
        return appt

    def list_appointments(self, owner_id: Optional[str] = None) -> List[Appointment]:
        self._ensure_loaded()
        values = list(self._appointments.values())
        if owner_id is not None:
            values = [a for a in values if a.owner_id == owner_id]
        return values

    def update_status(self, appointment_id: str, status: str) -> Appointment:
        self._ensure_loaded()
        appt = self.get_appointment(appointment_id)
        appt.status = status
        appt.updated_at = time.time()
        self._appointments[appointment_id] = appt
        self._persist()
        return appt


appointment_store = AppointmentStore()


__all__ = ["Appointment", "AppointmentStore", "appointment_store"]

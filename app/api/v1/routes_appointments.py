from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from integrations.appointments.store import appointment_store
from integrations.selection.store import selection_store
from integrations.search.engine import SearchEngine


router = APIRouter(prefix="/v1/appointments", tags=["appointments"])

search_engine = SearchEngine()


class RequesterInfo(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    preferred_contact: Optional[str] = None


class TimeWindow(BaseModel):
    from_: Optional[str] = Field(None, alias="from")
    to: Optional[str] = None


class CreateAppointmentBody(BaseModel):
    property_ids: Optional[List[str]] = None
    selection_id: Optional[str] = None
    owner_id: Optional[str] = None
    channel: str = "web"
    requester: RequesterInfo
    time_window: TimeWindow
    notes: Optional[str] = ""
    metadata: Optional[Dict[str, Any]] = None


class BulkAppointmentItem(BaseModel):
    property_id: str
    time_window: TimeWindow
    notes: Optional[str] = ""
    metadata: Optional[Dict[str, Any]] = None


class BulkCreateAppointmentsBody(BaseModel):
    channel: str = "web"
    requester: RequesterInfo
    owner_id: Optional[str] = None
    items: List[BulkAppointmentItem]


class UpdateStatusBody(BaseModel):
    status: str


def _resolve_property_ids(body: CreateAppointmentBody) -> List[str]:
    # Si llegan property_ids explícitos, se usan directamente
    if body.property_ids:
        return list(dict.fromkeys(map(str, body.property_ids)))

    # Si no, intentar resolver desde selection_id
    if body.selection_id:
        try:
            sel = selection_store.get_selection(body.selection_id)
            return list(dict.fromkeys(map(str, sel.property_ids)))
        except KeyError:
            raise HTTPException(status_code=404, detail="Selección no encontrada")

    raise HTTPException(status_code=400, detail="Debe proporcionar property_ids o selection_id")


def _resolve_contact_phone(property_ids: List[str]) -> str:
    """Resuelve el teléfono de contacto a usar.

    - Intenta obtener teléfonos específicos de los inmuebles (si estuvieran mapeados en UnifiedProperty.raw).
    - Si no encuentra ninguno, usa un número general preconfigurado.
    """

    # Número general configurable (por ahora hardcodeado, luego puede ir a config JSON)
    default_phone = "+57 300 000 0000"

    try:
        results = search_engine.search({}, limit=5000)
    except Exception:
        return default_phone

    wanted = set(map(str, property_ids))
    for r in results:
        prop = r.property
        pid = f"{prop.source}:{prop.source_id}"
        if pid not in wanted:
            continue
        raw = prop.raw or {}
        phones = raw.get("telefonos") or raw.get("phones") or []
        if isinstance(phones, str):
            phones = [phones]
        for ph in phones:
            ph_str = str(ph).strip()
            if ph_str:
                return ph_str

    return default_phone


@router.post("/", summary="Crear una nueva cita de agendamiento")
async def create_appointment(body: CreateAppointmentBody) -> Dict[str, Any]:
    property_ids = _resolve_property_ids(body)

    if not body.requester or (not body.requester.phone and not body.requester.email):
        raise HTTPException(status_code=400, detail="Debe proporcionar al menos un medio de contacto (teléfono o email)")

    contact_phone = _resolve_contact_phone(property_ids)

    time_window_dict = {}
    if body.time_window.from_ is not None:
        time_window_dict["from"] = body.time_window.from_
    if body.time_window.to is not None:
        time_window_dict["to"] = body.time_window.to

    appt = appointment_store.create_appointment(
        property_ids=property_ids,
        owner_id=body.owner_id,
        selection_id=body.selection_id,
        channel=body.channel,
        requester=body.requester.dict(by_alias=True),
        time_window=time_window_dict,
        notes=body.notes or "",
        status="pending",
        contact_phone_used=contact_phone,
        metadata=body.metadata,
    )

    return {
        "appointment_id": appt.appointment_id,
        "property_ids": appt.property_ids,
        "owner_id": appt.owner_id,
        "selection_id": appt.selection_id,
        "channel": appt.channel,
        "requester": appt.requester,
        "time_window": appt.time_window,
        "notes": appt.notes,
        "status": appt.status,
        "contact_phone_used": appt.contact_phone_used,
        "metadata": appt.metadata,
        "created_at": appt.created_at,
        "updated_at": appt.updated_at,
    }


@router.post("/bulk", summary="Crear varias citas de agendamiento")
async def create_bulk_appointments(body: BulkCreateAppointmentsBody) -> Dict[str, Any]:
    if not body.items:
        raise HTTPException(status_code=400, detail="Debe proporcionar al menos un item de cita")

    if not body.requester or (not body.requester.phone and not body.requester.email):
        raise HTTPException(status_code=400, detail="Debe proporcionar al menos un medio de contacto (teléfono o email)")

    created: List[Dict[str, Any]] = []

    for item in body.items:
        property_ids = [str(item.property_id)]
        contact_phone = _resolve_contact_phone(property_ids)

        time_window_dict: Dict[str, Any] = {}
        if item.time_window.from_ is not None:
            time_window_dict["from"] = item.time_window.from_
        if item.time_window.to is not None:
            time_window_dict["to"] = item.time_window.to

        appt = appointment_store.create_appointment(
            property_ids=property_ids,
            owner_id=body.owner_id,
            selection_id=None,
            channel=body.channel,
            requester=body.requester.dict(by_alias=True),
            time_window=time_window_dict,
            notes=item.notes or "",
            status="pending",
            contact_phone_used=contact_phone,
            metadata=item.metadata,
        )

        created.append(
            {
                "appointment_id": appt.appointment_id,
                "property_ids": appt.property_ids,
                "owner_id": appt.owner_id,
                "selection_id": appt.selection_id,
                "channel": appt.channel,
                "requester": appt.requester,
                "time_window": appt.time_window,
                "notes": appt.notes,
                "status": appt.status,
                "contact_phone_used": appt.contact_phone_used,
                "metadata": appt.metadata,
                "created_at": appt.created_at,
                "updated_at": appt.updated_at,
            }
        )

    return {"total": len(created), "items": created}


@router.get("/{appointment_id}", summary="Obtener detalle de una cita")
async def get_appointment(appointment_id: str) -> Dict[str, Any]:
    try:
        appt = appointment_store.get_appointment(appointment_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    return {
        "appointment_id": appt.appointment_id,
        "property_ids": appt.property_ids,
        "owner_id": appt.owner_id,
        "selection_id": appt.selection_id,
        "channel": appt.channel,
        "requester": appt.requester,
        "time_window": appt.time_window,
        "notes": appt.notes,
        "status": appt.status,
        "contact_phone_used": appt.contact_phone_used,
        "metadata": appt.metadata,
        "created_at": appt.created_at,
        "updated_at": appt.updated_at,
    }


@router.get("/", summary="Listar citas")
async def list_appointments(owner_id: Optional[str] = None) -> Dict[str, Any]:
    appts = appointment_store.list_appointments(owner_id=owner_id)
    return {
        "total": len(appts),
        "items": [
            {
                "appointment_id": a.appointment_id,
                "property_ids": a.property_ids,
                "owner_id": a.owner_id,
                "selection_id": a.selection_id,
                "channel": a.channel,
                "requester": a.requester,
                "time_window": a.time_window,
                "notes": a.notes,
                "status": a.status,
                "contact_phone_used": a.contact_phone_used,
                "metadata": a.metadata,
                "created_at": a.created_at,
                "updated_at": a.updated_at,
            }
            for a in appts
        ],
    }


@router.post("/{appointment_id}/status", summary="Actualizar estado de una cita")
async def update_appointment_status(appointment_id: str, body: UpdateStatusBody) -> Dict[str, Any]:
    try:
        appt = appointment_store.update_status(appointment_id, body.status)
    except KeyError:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    return {
        "appointment_id": appt.appointment_id,
        "status": appt.status,
        "updated_at": appt.updated_at,
    }

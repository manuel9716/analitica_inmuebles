from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter
from pydantic import BaseModel

from app.api.v1.routes_nlp import buscar_nlp, BuscarNLPRequest


router = APIRouter(prefix="/v1/voice", tags=["voice"])


class VoiceCommandBody(BaseModel):
    texto: str
    context: Optional[Dict[str, Any]] = None


@router.post("/command", summary="Procesar comando de voz transcrito usando el motor NLP existente")
async def process_voice_command(body: VoiceCommandBody) -> Dict[str, Any]:
    """Recibe texto transcrito de voz y lo procesa con el módulo NLP textual.

    Esta capa no contiene lógica nueva de negocio: simplemente convierte la
    entrada de voz (ya transcrita) en la misma estructura que espera
    `/v1/nlp/buscar`, reutilizando todo el motor actual de IA textual.
    """

    # Delegar directamente en buscar_nlp
    nlp_request = BuscarNLPRequest(texto=body.texto)
    nlp_response = await buscar_nlp(nlp_request)

    return {
        "source": "voice",
        "texto_original": body.texto,
        "context": body.context or {},
        "nlp_response": nlp_response,
    }

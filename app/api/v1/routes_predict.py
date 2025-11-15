from fastapi import APIRouter, HTTPException

from app.models.inference import inference_model
from app.models.schemas import InmuebleInput, PredictionResponse

router = APIRouter(prefix="/v1", tags=["predictions"])


@router.post("/predict", response_model=PredictionResponse)
async def predict_inmueble(inmueble: InmuebleInput) -> PredictionResponse:
    try:
        features = inmueble.model_dump()
        categoria = inference_model.predict_category(features)
        return PredictionResponse(categoria_precio=categoria)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno al predecir: {e}")

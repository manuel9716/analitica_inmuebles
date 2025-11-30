from fastapi import FastAPI

from app.api.v1.routes_predict import router as predict_router
from app.api.v1.routes_providers import router as providers_router
from app.api.v1.routes_providers_admin import router as providers_admin_router
from app.api.v1.routes_inmuebles import router as inmuebles_router
from app.api.v1.routes_nlp import router as nlp_router
from app.api.v1.routes_selection import router as selection_router
from app.api.v1.routes_appointments import router as appointments_router


app = FastAPI(title="Inmuebles Microservice", version="0.1.0")

app.include_router(predict_router)
app.include_router(providers_router)
app.include_router(providers_admin_router)
app.include_router(inmuebles_router)
app.include_router(nlp_router)
app.include_router(selection_router)
app.include_router(appointments_router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}

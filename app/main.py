from fastapi import FastAPI

from app.api.v1.routes_predict import router as predict_router


app = FastAPI(title="Inmuebles Microservice", version="0.1.0")

app.include_router(predict_router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}

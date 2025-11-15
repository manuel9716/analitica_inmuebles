from typing import Optional

from pydantic import BaseModel


class InmuebleInput(BaseModel):
    # Campos principales que suelen aparecer en el dataset
    tipo: str
    ubicacion: str
    habitaciones: int
    banos: int
    area_m2: float
    precio: float

    # Algunos campos adicionales típicos (opcionales)
    estado: Optional[str] = None
    tiene_piscina: Optional[bool] = None
    tiene_gimnasio: Optional[bool] = None
    tiene_seguridad: Optional[bool] = None
    tiene_jardin: Optional[bool] = None
    estacionamientos: Optional[int] = None
    cerca_escuelas: Optional[bool] = None


class PredictionResponse(BaseModel):
    categoria_precio: str

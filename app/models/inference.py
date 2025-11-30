import joblib
import pandas as pd
from typing import Any, Dict

class InmueblesInferenceModel:
    def __init__(self, model_path: str = "data/models/modelo_wasi.pkl") -> None:
        self._model_path = model_path
        self._loaded = False
        self._scaler = None
        self._label_encoders = None
        self._modelo_clasificacion = None
        self._caracteristicas_numericas = None
        self._caracteristicas_categoricas = None
        self._load_model()

    def _load_model(self) -> None:
        modelo_data = joblib.load(self._model_path)
        self._scaler = modelo_data["scaler"]
        self._label_encoders = modelo_data["label_encoders"]
        self._modelo_clasificacion = modelo_data["modelo_clasificacion"]
        self._caracteristicas_numericas = modelo_data["caracteristicas_numericas"]
        self._caracteristicas_categoricas = modelo_data["caracteristicas_categoricas"]
        self._loaded = True

    def predict_category(self, features: Dict[str, Any]) -> str:
        if not self._loaded:
            self._load_model()

        df = pd.DataFrame([features])

        # Validamos que existan las columnas necesarias
        missing_cols = [c for c in self._caracteristicas_numericas if c not in df.columns]
        missing_cols += [c for c in self._caracteristicas_categoricas if c not in df.columns]
        if missing_cols:
            raise ValueError(f"Faltan columnas requeridas para el modelo: {missing_cols}")

        # Codificar categóricas usando los label_encoders entrenados
        for col in self._caracteristicas_categoricas:
            encoder = self._label_encoders.get(col)
            if encoder is None:
                raise ValueError(f"No se encontró encoder para la columna categórica: {col}")
            df[col + "_encoded"] = encoder.transform(df[col].astype(str))

        caracteristicas_encoded = [col + "_encoded" for col in self._caracteristicas_categoricas]
        X_cols = self._caracteristicas_numericas + caracteristicas_encoded
        X = df[X_cols]

        X_scaled = self._scaler.transform(X)
        y_pred = self._modelo_clasificacion.predict(X_scaled)

        # Decodificar categoría si existe encoder del objetivo
        encoder_objetivo = self._label_encoders.get("objetivo")
        if encoder_objetivo is not None:
            categoria = encoder_objetivo.inverse_transform(y_pred)[0]
        else:
            categoria = str(y_pred[0])

        return categoria


# Instancia global simple para reutilizar el modelo en memoria
inference_model = InmueblesInferenceModel()

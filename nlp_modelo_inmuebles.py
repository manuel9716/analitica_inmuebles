import pandas as pd
import joblib
from typing import Dict, Any, List

import psycopg2
from db_nlp_logs import PG_CONFIG

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report


def cargar_dataset_nlp(ruta: str = "dataset_nlp_inmuebles_5000.csv") -> pd.DataFrame:
    """Carga el dataset anotado para NLP.

    Se espera un CSV con, al menos, las columnas:
    - texto_usuario
    - tipo_inmueble
    - habitaciones
    - banos
    - parqueadero
    - estrato
    - operacion
    - ciudad
    - zona
    - precio_rango
    - amoblado
    - mascotas
    - balcon
    - terraza
    - areas_comunes
    """
    df = pd.read_csv(ruta)
    # Limpiar textos nulos
    df["texto_usuario"] = df["texto_usuario"].fillna("")
    return df


def cargar_dataset_nlp_desde_db() -> pd.DataFrame:
    """Carga el dataset NLP desde la tabla nlp_dataset_anotado en PostgreSQL.

    Requiere que seed_nlp_dataset.py haya sido ejecutado previamente.
    """
    columnas = [
        "texto_usuario",
        "tipo_inmueble",
        "habitaciones",
        "banos",
        "parqueadero",
        "estrato",
        "operacion",
        "ciudad",
        "zona",
        "precio_rango",
        "amoblado",
        "mascotas",
        "balcon",
        "terraza",
        "areas_comunes",
    ]

    cols_sql = ", ".join(columnas)
    query = f"SELECT {cols_sql} FROM nlp_dataset_anotado"

    conn = psycopg2.connect(**PG_CONFIG)
    try:
        df = pd.read_sql(query, conn)
    finally:
        conn.close()

    df["texto_usuario"] = df["texto_usuario"].fillna("")
    return df


def crear_pipeline_clasificacion() -> Pipeline:
    """Crea un pipeline TF-IDF + Regresión Logística para clasificación de texto."""
    modelo = Pipeline([
        ("tfidf", TfidfVectorizer(
            max_features=10000,
            ngram_range=(1, 2),
            lowercase=True
        )),
        ("clf", LogisticRegression(max_iter=1000, n_jobs=-1))
    ])
    return modelo


def entrenar_modelos(df: pd.DataFrame) -> Dict[str, Any]:
    """Entrena varios modelos de texto para predecir campos a partir de texto_usuario.

    Devuelve un diccionario con:
    - vectorizador + modelo por cada target
    - label_encoders para targets categóricos
    """
    X = df["texto_usuario"].astype(str)

    modelos: Dict[str, Any] = {}
    label_encoders: Dict[str, LabelEncoder] = {}

    # Campos categóricos a predecir
    targets_categoricos: List[str] = [
        "tipo_inmueble",
        "operacion",
        "ciudad",
        "zona",
        "precio_rango",
    ]

    # Campos binarios / numéricos simples (los tratamos como clases también)
    targets_binarios: List[str] = [
        "parqueadero",
        "amoblado",
        "mascotas",
        "balcon",
        "terraza",
    ]

    # Entrenar modelos categóricos
    for col in targets_categoricos + targets_binarios:
        if col not in df.columns:
            continue

        y_col = df[col]

        # Eliminar filas con NaN en la columna objetivo
        mask = y_col.notna()
        X_col = X[mask]
        y_col = y_col[mask]

        # Convertir a string por seguridad
        y_col = y_col.astype(str)

        le = LabelEncoder()
        y_encoded = le.fit_transform(y_col)

        X_train, X_test, y_train, y_test = train_test_split(
            X_col, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
        )

        pipe = crear_pipeline_clasificacion()
        pipe.fit(X_train, y_train)

        # Evaluación rápida en consola
        try:
            y_pred = pipe.predict(X_test)
            print(f"\n=== Reporte para {col} ===")
            print(classification_report(y_test, y_pred, target_names=le.classes_))
        except Exception as e:
            print(f"No se pudo generar reporte para {col}: {e}")

        modelos[col] = pipe
        label_encoders[col] = le

    return {
        "modelos": modelos,
        "label_encoders": label_encoders,
    }


def guardar_modelo_nlp(obj: Dict[str, Any], ruta: str = "modelo_nlp_inmuebles.pkl") -> None:
    """Guarda en disco el diccionario de modelos y label_encoders."""
    joblib.dump(obj, ruta)
    print(f"\n✓ Modelo NLP guardado en: {ruta}")


def cargar_modelo_nlp(ruta: str = "modelo_nlp_inmuebles.pkl") -> Dict[str, Any]:
    """Carga el modelo NLP previamente entrenado."""
    return joblib.load(ruta)


def predecir_desde_texto(modelo_nlp: Dict[str, Any], texto: str) -> Dict[str, Any]:
    """Dado un texto de usuario, predice los campos soportados.

    Devuelve un diccionario como:
    {
        "tipo_inmueble": "apartamento",
        "operacion": "arriendo",
        "ciudad": "Bogotá",
        "zona": "Chapinero",
        "precio_rango": "1M - 1.5M",
        "parqueadero": "1",
        "amoblado": "1",
        ...
    }
    """
    texto = str(texto or "")
    modelos = modelo_nlp.get("modelos", {})
    label_encoders = modelo_nlp.get("label_encoders", {})

    resultados: Dict[str, Any] = {}

    for col, pipe in modelos.items():
        le = label_encoders.get(col)
        if le is None:
            continue
        try:
            y_pred = pipe.predict([texto])[0]
            etiqueta = le.inverse_transform([y_pred])[0]
            resultados[col] = etiqueta
        except Exception as e:
            print(f"Error al predecir {col}: {e}")

    return resultados


if __name__ == "__main__":
    # Entrenamiento rápido desde la línea de comandos
    print("Cargando dataset NLP desde PostgreSQL...")
    try:
        df_nlp = cargar_dataset_nlp_desde_db()
        print(f"✓ Dataset cargado desde BD: {len(df_nlp)} filas")
    except Exception as e:
        print(f"⚠️ No se pudo cargar dataset desde BD: {e}")
        print("   Intentando cargar desde CSV local...")
        df_nlp = cargar_dataset_nlp()
        print(f"✓ Dataset cargado desde CSV: {len(df_nlp)} filas")

    print("Entrenando modelos de texto...")
    modelo_nlp = entrenar_modelos(df_nlp)

    guardar_modelo_nlp(modelo_nlp)

    # Prueba rápida
    ejemplo = "Quiero un apartamento en Medellín, Laureles, de 3 habitaciones, para arriendo, con balcón, presupuesto 1.5M - 2M"
    print("\nTexto de ejemplo:")
    print(ejemplo)
    print("\nPredicciones:")
    print(predecir_desde_texto(modelo_nlp, ejemplo))

import pandas as pd

CSV_PATH = "data/datasets/dataset_nlp_inmuebles_5000.csv"

COLUMNS = [
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


def seed_from_csv(csv_path: str = CSV_PATH):
    """
    Lee el dataset de un archivo CSV.
    La funcionalidad de carga a PostgreSQL está deshabilitada.
    """
    print(f"Leyendo CSV: {csv_path}...")
    df = pd.read_csv(csv_path)

    # Nos quedamos solo con las columnas que existan en el CSV
    cols_present = [c for c in COLUMNS if c in df.columns]
    if "texto_usuario" not in cols_present:
        raise ValueError("El CSV debe tener al menos la columna 'texto_usuario'.")

    df = df[cols_present].copy()
    df["texto_usuario"] = df["texto_usuario"].fillna("").astype(str)
    
    print(f"CSV leído correctamente: {len(df)} filas")
    print("⚠️ Nota: La carga a PostgreSQL está deshabilitada.")
    
    return df


if __name__ == "__main__":
    print("⚠️ PostgreSQL deshabilitado. Solo se leerá el CSV.")
    df = seed_from_csv()
    print(f"\n✓ Dataset cargado: {len(df)} filas disponibles en memoria.")

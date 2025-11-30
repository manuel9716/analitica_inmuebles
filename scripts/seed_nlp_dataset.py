import pandas as pd
import psycopg2

from db_nlp_logs import PG_CONFIG


TABLE_NAME = "nlp_dataset_anotado"
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


def get_connection():
    return psycopg2.connect(**PG_CONFIG)


def create_table_if_not_exists():
    """Crea la tabla base para el dataset anotado si no existe."""
    ddl = f"""
    CREATE TABLE IF NOT EXISTS {TABLE_NAME} (
        id SERIAL PRIMARY KEY,
        texto_usuario TEXT NOT NULL,
        tipo_inmueble TEXT,
        habitaciones TEXT,
        banos TEXT,
        parqueadero TEXT,
        estrato TEXT,
        operacion TEXT,
        ciudad TEXT,
        zona TEXT,
        precio_rango TEXT,
        amoblado TEXT,
        mascotas TEXT,
        balcon TEXT,
        terraza TEXT,
        areas_comunes TEXT
    );
    """
    conn = get_connection()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(ddl)
    finally:
        conn.close()


def seed_from_csv(csv_path: str = CSV_PATH):
    print(f"Leyendo CSV: {csv_path}...")
    df = pd.read_csv(csv_path)

    # Nos quedamos solo con las columnas que existan en el CSV
    cols_present = [c for c in COLUMNS if c in df.columns]
    if "texto_usuario" not in cols_present:
        raise ValueError("El CSV debe tener al menos la columna 'texto_usuario'.")

    df = df[cols_present].copy()
    df["texto_usuario"] = df["texto_usuario"].fillna("").astype(str)

    conn = get_connection()
    try:
        with conn:
            with conn.cursor() as cur:
                # Vaciar tabla antes de insertar para evitar duplicados masivos
                print(f"Vaciando tabla {TABLE_NAME}...")
                cur.execute(f"TRUNCATE {TABLE_NAME};")

                print(f"Insertando {len(df)} filas en {TABLE_NAME}...")
                insert_cols = cols_present
                placeholders = ",".join(["%s"] * len(insert_cols))
                cols_sql = ",".join(insert_cols)
                sql = f"INSERT INTO {TABLE_NAME} ({cols_sql}) VALUES ({placeholders});"

                for _, row in df.iterrows():
                    values = [None if pd.isna(row[c]) else str(row[c]) for c in insert_cols]
                    cur.execute(sql, values)
    finally:
        conn.close()

    print("\n✓ Dataset NLP cargado en PostgreSQL correctamente.")


if __name__ == "__main__":
    print("Creando tabla si no existe...")
    create_table_if_not_exists()
    seed_from_csv()

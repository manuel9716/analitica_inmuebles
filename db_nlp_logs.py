import json
from datetime import datetime

import psycopg2


PG_CONFIG = {
    "host": "localhost",
    "port": 5433,
    "dbname": "Facil_BuscoDB",
    "user": "postgres",
    "password": "admin123",
}


def get_connection():
    return psycopg2.connect(**PG_CONFIG)


def init_db():
    """Crea la tabla nlp_consultas si no existe."""
    conn = get_connection()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS nlp_consultas (
                        id SERIAL PRIMARY KEY,
                        timestamp TIMESTAMPTZ NOT NULL,
                        texto_usuario TEXT NOT NULL,
                        criterios_inferidos JSONB,
                        predicciones_nlp JSONB,
                        filtros_relajados JSONB,
                        total_encontrados INTEGER,
                        total_retornados INTEGER,
                        ejemplo_seleccionado_id BIGINT
                    );
                    """
                )
    finally:
        conn.close()


def guardar_consulta_nlp(
    texto_usuario,
    criterios_inferidos,
    predicciones_nlp,
    filtros_relajados,
    total_encontrados,
    total_retornados,
    ejemplo_seleccionado_id=None,
):
    """Guarda una consulta NLP en la base de datos.

    Los diccionarios/listas se serializan a JSON antes de insertar.
    """
    conn = get_connection()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO nlp_consultas (
                        timestamp,
                        texto_usuario,
                        criterios_inferidos,
                        predicciones_nlp,
                        filtros_relajados,
                        total_encontrados,
                        total_retornados,
                        ejemplo_seleccionado_id
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
                    """,
                    (
                        datetime.utcnow(),
                        texto_usuario,
                        json.dumps(criterios_inferidos) if criterios_inferidos is not None else None,
                        json.dumps(predicciones_nlp) if predicciones_nlp is not None else None,
                        json.dumps(filtros_relajados) if filtros_relajados is not None else None,
                        int(total_encontrados) if total_encontrados is not None else None,
                        int(total_retornados) if total_retornados is not None else None,
                        ejemplo_seleccionado_id,
                    ),
                )
    finally:
        conn.close()

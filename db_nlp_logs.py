# Versión simplificada de db_nlp_logs.py sin conexión a PostgreSQL

def init_db():
    """Versión deshabilitada."""
    print("⚠️ Base de datos PostgreSQL deshabilitada - No se iniciará la tabla nlp_consultas")

def guardar_consulta_nlp(
    texto_usuario,
    criterios_inferidos,
    predicciones_nlp,
    filtros_relajados,
    total_encontrados,
    total_retornados,
    ejemplo_seleccionado_id=None,
):
    """Versión deshabilitada que no hace nada."""
    # Esta función mantiene la firma pero no realiza ninguna operación con PostgreSQL
    pass

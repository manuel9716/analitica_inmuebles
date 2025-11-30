from datetime import datetime
import os
from typing import Any, Dict, Optional
import json
import re

import pandas as pd
from fastapi import APIRouter, HTTPException

from modelo_inmuebles import ModeloInmuebles
from integrations.wasi.wasi_connector import WasiConnector


router = APIRouter(prefix="/v1", tags=["inmuebles"])

# Configuración de WASI (mismas credenciales que en api_wasi.py)
ID_COMPANY = "493728"
WASI_TOKEN = "4kyL_tY1Q_e8yL_j0ju"

# Estado global sencillo para el microservicio
modelo: Optional[ModeloInmuebles] = None
wasi_connector: Optional[WasiConnector] = None
ultima_sincronizacion: Optional[datetime] = None


def _inicializar_sistema() -> None:
    """Inicializa el sistema: sincroniza datos de WASI y entrena/carga el modelo.

    Esta función replica la lógica de `inicializar_sistema` en `api_wasi.py`, pero
    pensada para usarse desde FastAPI.
    """
    global modelo, wasi_connector, ultima_sincronizacion

    if modelo is not None and wasi_connector is not None:
        # Ya inicializado
        return

    print("=" * 70)
    print("API INMUEBLES FASTAPI - INICIALIZACIÓN")
    print("=" * 70)

    # Crear conector de WASI
    wasi_connector_local = WasiConnector(ID_COMPANY, WASI_TOKEN)

    # Verificar si existe dataset reciente
    archivo_datos = "data/datasets/inmuebles_wasi_real.csv"
    sincronizar = True

    if os.path.exists(archivo_datos):
        # Verificar antigüedad del archivo
        tiempo_modificacion = os.path.getmtime(archivo_datos)
        tiempo_actual = datetime.now().timestamp()
        horas_desde_actualizacion = (tiempo_actual - tiempo_modificacion) / 3600

        if horas_desde_actualizacion < 24:
            print(f"\n✓ Dataset existente ({horas_desde_actualizacion:.1f} horas de antigüedad)")
            sincronizar = False
        else:
            print(f"\n⚠️ Dataset antiguo ({horas_desde_actualizacion:.1f} horas), sincronizando...")

    # Sincronizar datos si es necesario
    if sincronizar:
        print("\n📡 Sincronizando datos desde WASI...")
        df = wasi_connector_local.sincronizar_datos(
            archivo_salida=archivo_datos,
            max_inmuebles=1000,
        )
        ultima = datetime.now()
    else:
        print("\n📂 Usando dataset existente")
        ultima = datetime.fromtimestamp(os.path.getmtime(archivo_datos))

    # Inicializar modelo
    print("\n🤖 Inicializando modelo de IA...")
    modelo_local = ModeloInmuebles()

    # Cargar dataset
    modelo_local.cargar_dataset(archivo_datos)
    modelo_local.preprocesar_datos()

    # Cargar o entrenar modelo
    archivo_modelo = "data/models/modelo_wasi.pkl"
    if os.path.exists(archivo_modelo) and not sincronizar:
        print("📦 Cargando modelo pre-entrenado...")
        modelo_local.cargar_modelo(archivo_modelo)
    else:
        print("🎓 Entrenando modelo con datos de WASI...")
        modelo_local.crear_categorias_precio("precio")
        modelo_local.entrenar_modelo_clasificacion("categoria_precio")
        modelo_local.entrenar_clustering(n_clusters=5)
        modelo_local.guardar_modelo(archivo_modelo)

    print("\n✓ Sistema listo para recibir peticiones")
    print(f"✓ Última sincronización: {ultima.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"✓ Total de inmuebles: {len(modelo_local.df)}")

    # Asignar a globals sólo cuando todo sale bien
    globals()["modelo"] = modelo_local
    globals()["wasi_connector"] = wasi_connector_local
    globals()["ultima_sincronizacion"] = ultima


def _ensure_initialized() -> None:
    """Inicializa el sistema si todavía no se ha hecho."""
    if globals().get("modelo") is None:
        _inicializar_sistema()


def _filtrar_ciudades_validas(valores: list[str]) -> list[str]:
    candidatos = []
    patron_numero = re.compile(r"[0-9]")
    palabras_direccion = [
        "calle",
        "carrera",
        "cra ",
        "crr",
        "avenida",
        "av ",
        "ak ",
        "#",
        "km",
        "kilometro",
        "edificio",
        "condominio",
        "conjunto",
        "barrio",
        "vereda",
        "parcelacion",
        "parcelación",
        "sector",
        "manzana",
        "torre",
        "apto",
        "apartamento",
    ]

    for valor in valores:
        v = valor.strip()
        if not v:
            continue
        v_lower = v.lower()
        if patron_numero.search(v_lower):
            continue
        if any(p in v_lower for p in palabras_direccion):
            continue
        candidatos.append(v)

    vistos = set()
    resultado: list[str] = []
    for v in candidatos:
        if v not in vistos:
            vistos.add(v)
            resultado.append(v)
    return resultado


@router.get("/", summary="Información de la API de inmuebles")
async def home() -> Dict[str, Any]:
    _ensure_initialized()

    assert modelo is not None

    return {
        "nombre": "API de Búsqueda de Inmuebles - WASI (FastAPI)",
        "version": "2.0",
        "fuente_datos": "WASI API",
        "ultima_sincronizacion": ultima_sincronizacion.isoformat() if ultima_sincronizacion else None,
        "total_inmuebles": len(modelo.df) if modelo else 0,
        "endpoints": {
            "/v1/": "Información de la API",
            "/v1/estadisticas": "Estadísticas del dataset",
            "/v1/buscar": "Buscar inmuebles (POST)",
            "/v1/similares/{id}": "Inmuebles similares",
            "/v1/tipos": "Tipos de inmuebles disponibles",
            "/v1/ciudades": "Ciudades disponibles",
            "/v1/filtros-disponibles": "Todos los filtros disponibles",
            "/v1/sincronizar": "Forzar sincronización con WASI (POST)",
            "/v1/inmueble/{id}": "Detalle de inmueble específico",
        },
    }


@router.get("/estadisticas", summary="Estadísticas generales del dataset")
async def estadisticas() -> Dict[str, Any]:
    _ensure_initialized()
    assert modelo is not None

    try:
        df = modelo.df.copy()

        # Asegurar que columnas numéricas clave sean realmente numéricas
        for col in ["precio", "area_total", "habitaciones"]:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")

        stats = {
            "total_inmuebles": len(df),
            "ultima_sincronizacion": ultima_sincronizacion.isoformat() if ultima_sincronizacion else None,
            "precio_promedio": float(df["precio"].mean()) if "precio" in df.columns else 0,
            "precio_minimo": float(df["precio"].min()) if "precio" in df.columns else 0,
            "precio_maximo": float(df["precio"].max()) if "precio" in df.columns else 0,
            "precio_mediana": float(df["precio"].median()) if "precio" in df.columns else 0,
            "distribucion_tipos": df["tipo"].value_counts().to_dict() if "tipo" in df.columns else {},
            "distribucion_ciudades": df["ciudad"].value_counts().to_dict() if "ciudad" in df.columns else {},
            "habitaciones_promedio": float(df["habitaciones"].mean()) if "habitaciones" in df.columns else 0,
            "area_promedio": float(df["area_total"].mean()) if "area_total" in df.columns else 0,
        }
        return stats
    except Exception as e:  # pragma: no cover - logging
        raise HTTPException(status_code=500, detail=f"Error al calcular estadísticas: {e}")


@router.post("/buscar", summary="Buscar inmuebles según criterios")
async def buscar(criterios: Dict[str, Any]) -> Dict[str, Any]:
    """Busca inmuebles según criterios proporcionados en el cuerpo JSON."""
    _ensure_initialized()
    assert modelo is not None

    if not criterios:
        raise HTTPException(status_code=400, detail="No se proporcionaron criterios de búsqueda")

    try:
        print(f"\n🔍 Búsqueda recibida: {criterios}")

        resultado = modelo.categorizar_inmuebles(criterios)

        if len(resultado) == 0:
            return {
                "total_encontrados": 0,
                "total_retornados": 0,
                "criterios": criterios,
                "resultados": [],
                "mensaje": "No se encontraron inmuebles con los criterios especificados",
            }

        resultado_limitado = resultado.head(100).copy()

        # Asegurar que la columna 'imagenes' (si existe) sea una lista JSON en la respuesta
        if "imagenes" in resultado_limitado.columns:
            def _parse_imagenes(value: Any) -> Any:
                if value is None or (isinstance(value, float) and pd.isna(value)):
                    return []
                if isinstance(value, list):
                    return value
                if isinstance(value, str):
                    try:
                        parsed = json.loads(value)
                        if isinstance(parsed, list):
                            return parsed
                    except Exception:
                        pass
                return []

            resultado_limitado["imagenes"] = resultado_limitado["imagenes"].apply(_parse_imagenes)

        estadisticas_resultado = {
            "precio_promedio": float(resultado["precio"].mean()),
            "precio_minimo": float(resultado["precio"].min()),
            "precio_maximo": float(resultado["precio"].max()),
        }

        return {
            "total_encontrados": len(resultado),
            "total_retornados": len(resultado_limitado),
            "criterios": criterios,
            "estadisticas": estadisticas_resultado,
            "resultados": resultado_limitado.to_dict("records"),
        }
    except HTTPException:
        raise
    except Exception as e:  # pragma: no cover - logging
        raise HTTPException(status_code=500, detail=f"Error al buscar inmuebles: {e}")


@router.get("/similares/{inmueble_id}", summary="Inmuebles similares")
async def similares(inmueble_id: int, n: int = 5) -> Dict[str, Any]:
    _ensure_initialized()
    assert modelo is not None

    try:
        if inmueble_id < 0 or inmueble_id >= len(modelo.df):
            raise HTTPException(status_code=400, detail="ID de inmueble inválido")

        inmueble_ref = modelo.df.iloc[inmueble_id].to_dict()
        similares_df = modelo.buscar_similares(inmueble_id, n)

        return {
            "inmueble_referencia": inmueble_ref,
            "similares_encontrados": len(similares_df),
            "similares": similares_df.to_dict("records"),
        }
    except HTTPException:
        raise
    except Exception as e:  # pragma: no cover - logging
        raise HTTPException(status_code=500, detail=f"Error al buscar similares: {e}")


@router.get("/inmueble/{inmueble_id}", summary="Detalle de inmueble por ID WASI")
async def obtener_inmueble(inmueble_id: str) -> Dict[str, Any]:
    _ensure_initialized()
    assert modelo is not None

    try:
        inmueble = modelo.df[modelo.df["id"] == inmueble_id]

        if len(inmueble) == 0:
            raise HTTPException(status_code=404, detail="Inmueble no encontrado")

        fila = inmueble.iloc[0].to_dict()

        # Normalizar 'imagenes' a lista JSON
        if "imagenes" in fila:
            value = fila["imagenes"]
            if value is None:
                fila["imagenes"] = []
            elif isinstance(value, list):
                fila["imagenes"] = value
            elif isinstance(value, str):
                try:
                    parsed = json.loads(value)
                    fila["imagenes"] = parsed if isinstance(parsed, list) else []
                except Exception:
                    fila["imagenes"] = []
            else:
                fila["imagenes"] = []

        return fila
    except HTTPException:
        raise
    except Exception as e:  # pragma: no cover - logging
        raise HTTPException(status_code=500, detail=f"Error al obtener inmueble: {e}")


@router.get("/tipos", summary="Tipos de inmuebles disponibles")
async def tipos() -> Dict[str, Any]:
    _ensure_initialized()
    assert modelo is not None

    try:
        if "tipo" not in modelo.df.columns:
            return {"tipos": [], "conteo": {}}

        series_tipos = modelo.df["tipo"].dropna()
        tipos_disponibles = [str(t) for t in series_tipos.unique().tolist()]

        conteo_raw = series_tipos.value_counts().to_dict()
        conteo = {str(k): int(v) for k, v in conteo_raw.items()}

        return {"tipos": tipos_disponibles, "conteo": conteo}
    except Exception as e:  # pragma: no cover - logging
        raise HTTPException(status_code=500, detail=f"Error al obtener tipos: {e}")


@router.get("/ciudades", summary="Ciudades disponibles")
async def ciudades() -> Dict[str, Any]:
    _ensure_initialized()
    assert modelo is not None

    try:
        if "ciudad" not in modelo.df.columns:
            return {"ciudades": [], "conteo": {}, "precio_promedio": {}}

        df_ciudades = modelo.df.dropna(subset=["ciudad"])

        ciudades_brutas = [str(c) for c in df_ciudades["ciudad"].unique().tolist()]
        ciudades_disponibles = _filtrar_ciudades_validas(ciudades_brutas)

        conteo_raw = df_ciudades["ciudad"].value_counts().to_dict()
        conteo = {str(k): int(v) for k, v in conteo_raw.items()}

        if "precio" in df_ciudades.columns:
            precios = df_ciudades.copy()
            precios["precio"] = pd.to_numeric(precios["precio"], errors="coerce")
            precio_group = precios.groupby("ciudad")["precio"].mean().to_dict()
            precio_promedio = {str(k): float(v) for k, v in precio_group.items() if pd.notna(v)}
        else:
            precio_promedio = {}

        return {
            "ciudades": ciudades_disponibles,
            "conteo": conteo,
            "precio_promedio": precio_promedio,
        }
    except Exception as e:  # pragma: no cover - logging
        raise HTTPException(status_code=500, detail=f"Error al obtener ciudades: {e}")


@router.get("/filtros-disponibles", summary="Filtros disponibles para búsqueda")
async def filtros_disponibles() -> Dict[str, Any]:
    _ensure_initialized()
    assert modelo is not None

    try:
        df = modelo.df

        def lista_sin_nan(col: str) -> list[str]:
            if col not in df.columns:
                return []
            return [str(v) for v in df[col].dropna().unique().tolist()]

        def lista_int_sin_nan(col: str) -> list[int]:
            if col not in df.columns:
                return []
            serie = df[col].dropna().astype(str)
            serie = serie.str.extract(r"(\d+)", expand=False)
            numeros = pd.to_numeric(serie, errors="coerce").dropna().unique().tolist()
            return [int(v) for v in sorted(numeros)]

        rangos_numericos: Dict[str, Dict[str, float]] = {}
        for col in ["precio", "area_total", "area_construida"]:
            if col in df.columns:
                serie = pd.to_numeric(df[col], errors="coerce").dropna()
                if not serie.empty:
                    rangos_numericos[col] = {
                        "min": float(serie.min()),
                        "max": float(serie.max()),
                    }

        filtros = {
            "tipos": lista_sin_nan("tipo"),
            "ciudades": _filtrar_ciudades_validas(lista_sin_nan("ciudad")),
            "zonas": lista_sin_nan("zona"),
            "tipo_negocio": lista_sin_nan("tipo_negocio"),
            "habitaciones": lista_int_sin_nan("habitaciones"),
            "banos": lista_int_sin_nan("banos"),
            "caracteristicas_booleanas": [
                "tiene_piscina",
                "tiene_gimnasio",
                "tiene_parqueadero",
                "tiene_ascensor",
                "tiene_seguridad",
            ],
            "rangos_numericos": rangos_numericos,
        }

        return filtros
    except Exception as e:  # pragma: no cover - logging
        raise HTTPException(status_code=500, detail=f"Error al obtener filtros disponibles: {e}")


@router.post("/sincronizar", summary="Forzar sincronización con WASI")
async def sincronizar() -> Dict[str, Any]:
    _ensure_initialized()
    assert modelo is not None

    try:
        print("\n🔄 Sincronización manual solicitada (FastAPI)...")

        globals()["modelo"] = None
        globals()["wasi_connector"] = None
        globals()["ultima_sincronizacion"] = None

        _inicializar_sistema()

        assert modelo is not None

        return {
            "mensaje": "Sincronización completada",
            "timestamp": datetime.now().isoformat(),
            "total_inmuebles": len(modelo.df),
        }
    except Exception as e:  # pragma: no cover - logging
        raise HTTPException(status_code=500, detail=f"Error al sincronizar: {e}")

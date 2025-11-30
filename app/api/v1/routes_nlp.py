from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

import json
import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.api.v1 import routes_inmuebles
from db_nlp_logs import guardar_consulta_nlp
from nlp_modelo_inmuebles import cargar_modelo_nlp, predecir_desde_texto


router = APIRouter(prefix="/v1/nlp", tags=["nlp"])

modelo_nlp: Optional[Dict[str, Any]] = None
conversaciones_activas: Dict[str, Dict[str, Any]] = {}


class BuscarNLPRequest(BaseModel):
    texto: str


class BuscarNLPChatRequest(BaseModel):
    session_id: str
    texto: str
    reiniciar: Optional[bool] = False


def _get_modelo_inmuebles():
    routes_inmuebles._ensure_initialized()
    assert routes_inmuebles.modelo is not None
    return routes_inmuebles.modelo


def _get_modelo_nlp() -> Optional[Dict[str, Any]]:
    global modelo_nlp
    if modelo_nlp is not None:
        return modelo_nlp

    try:
        ruta_nlp = "data/models/modelo_nlp_inmuebles.pkl"
        modelo_nlp = cargar_modelo_nlp(ruta_nlp)
        return modelo_nlp
    except Exception:
        return None


def _parsear_texto_a_criterios(texto: str) -> Dict[str, Any]:
    # Versión adaptada de parsear_texto_a_criterios en api_wasi.py
    # Reutiliza el modelo de inmuebles de routes_inmuebles para detectar ciudades y categorias_precio.
    criterios: Dict[str, Any] = {}

    if not texto:
        return criterios

    import re  # import local para evitar dependencias globales innecesarias

    t = texto.lower()

    if "apartamento" in t or "apartaestudio" in t:
        criterios["tipo"] = "Apartamento"
    elif "casa" in t:
        criterios["tipo"] = "Casa"

    if "arriendo" in t or "alquiler" in t or "renta" in t:
        criterios["tipo_negocio"] = "Arriendo"
    if "venta" in t or "comprar" in t or "compro" in t:
        criterios["tipo_negocio"] = "Venta"

    match_hab = re.search(r"(\d+)\s+(habitaciones|alcobas|cuartos|cuartos)", t)
    if match_hab:
        try:
            criterios["habitaciones_min"] = int(match_hab.group(1))
        except ValueError:
            pass

    match_banos = re.search(r"(\d+)\s+ba[ñn]os", t)
    if match_banos:
        try:
            criterios["banos_min"] = int(match_banos.group(1))
        except ValueError:
            pass

    match_area = re.search(r"(\d+)\s*(m2|metros|metros cuadrados)", t)
    if match_area:
        try:
            criterios["area_min"] = int(match_area.group(1))
        except ValueError:
            pass

    if "parqueadero" in t or "garaje" in t or "parqueo" in t:
        criterios["tiene_parqueadero"] = True

    if "piscina" in t:
        criterios["tiene_piscina"] = True

    if "gimnasio" in t or "gym" in t:
        criterios["tiene_gimnasio"] = True

    if "seguridad" in t or "porteria" in t or "portería" in t or "vigilancia" in t:
        criterios["tiene_seguridad"] = True

    if "totalmente amoblado" in t or "totalmente amueblado" in t or "amoblado" in t or "amueblado" in t:
        criterios["amoblado"] = True
    if "semi amoblado" in t or "semi-amoblado" in t:
        criterios["amoblado"] = True

    if "mascotas" in t or "pet friendly" in t or "aptos para mascotas" in t or "apto para mascotas" in t:
        criterios["mascotas"] = True

    if "balcón" in t or "balcon" in t:
        criterios["balcon"] = True
    if "terraza" in t:
        criterios["terraza"] = True

    numeros_millones = re.findall(r"(\d+)\s*millones", t)
    valores: List[int] = []
    for n in numeros_millones:
        try:
            valores.append(int(n) * 1_000_000)
        except ValueError:
            continue

    rangos_M = re.findall(r"(\d+(?:\.\d+)?)\s*M\s*-\s*(\d+(?:\.\d+)?)\s*M", t)
    for minimo, maximo in rangos_M:
        try:
            vmin = float(minimo) * 1_000_000
            vmax = float(maximo) * 1_000_000
            valores.append(vmin)
            valores.append(vmax)
        except ValueError:
            continue

    match_menos_M = re.search(r"menos de\s*(\d+(?:\.\d+)?)\s*M", t)
    if match_menos_M:
        try:
            vmax = float(match_menos_M.group(1)) * 1_000_000
            valores.append(vmax)
        except ValueError:
            pass

    match_mas_M = re.search(r"m[aá]s de\s*(\d+(?:\.\d+)?)\s*M", t)
    if match_mas_M:
        try:
            vmin = float(match_mas_M.group(1)) * 1_000_000
            valores.append(vmin)
        except ValueError:
            pass

    if valores:
        valores_ordenados = sorted(valores)
        if len(valores_ordenados) == 1:
            if "mas de" in t or "más de" in t:
                criterios["precio_min"] = valores_ordenados[0]
            else:
                criterios["precio_max"] = valores_ordenados[0]
        else:
            criterios["precio_min"] = valores_ordenados[0]
            criterios["precio_max"] = valores_ordenados[-1]

    try:
        modelo = _get_modelo_inmuebles()
        if getattr(modelo, "categorias_precio", None):
            cats = modelo.categorias_precio
            cats_lower = {k.lower(): v for k, v in cats.items()}

            if "economico" in t or "económico" in t or "barato" in t or "asequible" in t:
                max_eco = cats_lower.get("económico") or cats_lower.get("economico")
                if max_eco is not None:
                    criterios["precio_max"] = float(max_eco)

            if "medio" in t or "intermedio" in t:
                max_med = cats_lower.get("medio")
                if max_med is not None:
                    criterios["precio_max"] = float(max_med)

            if "caro" in t or "alto" in t or "exclusivo" in t or "lujoso" in t:
                min_alto = cats_lower.get("medio")
                if min_alto is not None:
                    criterios["precio_min"] = float(min_alto)

            if "premium" in t or "muy caro" in t:
                min_premium = cats_lower.get("alto")
                if min_premium is not None:
                    criterios["precio_min"] = float(min_premium)
    except Exception:
        pass

    try:
        modelo = _get_modelo_inmuebles()
        if modelo.df is not None and "ciudad" in modelo.df.columns:
            ciudades = [str(c) for c in modelo.df["ciudad"].dropna().unique().tolist()]
            for ciudad in ciudades:
                c_lower = ciudad.lower()
                if c_lower in t:
                    criterios["ciudad"] = ciudad
                    break
    except Exception:
        pass

    return criterios


@router.post("/buscar")
async def buscar_nlp(payload: BuscarNLPRequest) -> Dict[str, Any]:
    modelo = _get_modelo_inmuebles()
    texto = payload.texto

    criterios_reglas = _parsear_texto_a_criterios(texto)
    criterios: Dict[str, Any] = dict(criterios_reglas)

    predicciones_nlp: Dict[str, Any] = {}
    modelo_nlp_local = _get_modelo_nlp()
    if modelo_nlp_local is not None:
        try:
            predicciones_nlp = predecir_desde_texto(modelo_nlp_local, texto)
        except Exception:
            predicciones_nlp = {}

    if predicciones_nlp:
        if "operacion" in predicciones_nlp and "tipo_negocio" not in criterios:
            op = str(predicciones_nlp["operacion"]).strip().lower()
            if op == "arriendo":
                criterios["tipo_negocio"] = "Arriendo"
            elif op == "venta":
                criterios["tipo_negocio"] = "Venta"

        if "ciudad" in predicciones_nlp and "ciudad" not in criterios:
            criterios["ciudad"] = predicciones_nlp["ciudad"]

        if "precio_rango" in predicciones_nlp:
            rango_texto = str(predicciones_nlp["precio_rango"])
            criterios_precio = _parsear_texto_a_criterios(rango_texto)
            for k in ["precio_min", "precio_max"]:
                if k in criterios_precio and k not in criterios:
                    criterios[k] = criterios_precio[k]

        if "parqueadero" in predicciones_nlp and "tiene_parqueadero" not in criterios:
            try:
                num_parq = int(predicciones_nlp["parqueadero"])
                if num_parq >= 1:
                    criterios["tiene_parqueadero"] = True
            except ValueError:
                pass

    if not criterios:
        try:
            guardar_consulta_nlp(
                texto_usuario=texto,
                criterios_inferidos=criterios,
                predicciones_nlp=predicciones_nlp,
                filtros_relajados=[],
                total_encontrados=0,
                total_retornados=0,
            )
        except Exception:
            pass

        return {
            "mensaje": "No se pudieron inferir criterios claros a partir del texto. Intenta ser más específico.",
            "texto_original": texto,
            "criterios_inferidos": criterios,
            "predicciones_nlp": predicciones_nlp,
            "total_encontrados": 0,
            "total_retornados": 0,
            "resultados": [],
        }

    filtros_relajados: List[str] = []

    def ejecutar_busqueda(crit: Dict[str, Any]):
        try:
            return modelo.categorizar_inmuebles(crit)
        except Exception:
            return modelo.df.copy() * 0

    resultado = ejecutar_busqueda(criterios)

    if len(resultado) == 0:
        orden_relajacion = [
            ["precio_min", "precio_max"],
            ["ciudad"],
            ["tipo_negocio"],
            ["amoblado"],
            ["mascotas"],
            ["balcon"],
            ["terraza"],
        ]

        criterios_relajados = dict(criterios)

        for grupo in orden_relajacion:
            alguno_eliminado = False
            for clave in grupo:
                if clave in criterios_relajados:
                    criterios_relajados.pop(clave)
                    filtros_relajados.append(clave)
                    alguno_eliminado = True
            if not alguno_eliminado:
                continue

            resultado = ejecutar_busqueda(criterios_relajados)
            if len(resultado) > 0:
                criterios = criterios_relajados
                break

    if len(resultado) > 0:
        try:
            df_tmp = resultado.copy()
            for col in ["titulo", "descripcion", "ciudad", "zona"]:
                if col not in df_tmp.columns:
                    df_tmp[col] = ""
            textos_inmuebles = (
                df_tmp["titulo"].fillna("").astype(str)
                + " "
                + df_tmp["descripcion"].fillna("").astype(str)
                + " "
                + df_tmp["ciudad"].fillna("").astype(str)
                + " "
                + df_tmp["zona"].fillna("").astype(str)
            )

            corpus = [texto] + textos_inmuebles.tolist()
            from sklearn.feature_extraction.text import TfidfVectorizer

            vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2))
            tfidf_matrix = vectorizer.fit_transform(corpus)

            user_vec = tfidf_matrix[0]
            inmuebles_vecs = tfidf_matrix[1:]
            similitudes = inmuebles_vecs.dot(user_vec.T).toarray().ravel()

            df_tmp = df_tmp.copy()
            df_tmp["score_similitud"] = similitudes

            resultado_ordenado = df_tmp.sort_values(by="score_similitud", ascending=False)
        except Exception:
            resultado_ordenado = resultado

        resultado_limitado = resultado_ordenado.head(100)

        resultado_limitado = resultado_limitado.where(pd.notnull(resultado_limitado), None)
        resultado_limitado = resultado_limitado.replace({np.nan: None})

        if "imagenes" in resultado_limitado.columns:
            def _parse_imagenes(value: Any) -> List[str]:
                if value is None:
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

        estadisticas_resultado: Dict[str, Any] = {}
        if "precio" in resultado.columns:
            estadisticas_resultado = {
                "precio_promedio": float(resultado["precio"].mean()),
                "precio_minimo": float(resultado["precio"].min()),
                "precio_maximo": float(resultado["precio"].max()),
            }

        if filtros_relajados:
            detalle_relajados = ", ".join(filtros_relajados)
            mensaje = (
                "No se encontraron inmuebles que cumplieran todos los criterios exactos, "
                f"pero se relajaron los filtros [{detalle_relajados}] y se encontraron "
                f"{len(resultado)} inmuebles (mostrando {len(resultado_limitado)})."
            )
        else:
            mensaje = (
                f"Se encontraron {len(resultado)} inmuebles que coinciden con la descripción, "
                f"mostrando {len(resultado_limitado)}."
            )

        try:
            guardar_consulta_nlp(
                texto_usuario=texto,
                criterios_inferidos=criterios,
                predicciones_nlp=predicciones_nlp,
                filtros_relajados=filtros_relajados,
                total_encontrados=len(resultado),
                total_retornados=len(resultado_limitado),
            )
        except Exception:
            pass

        return {
            "mensaje": mensaje,
            "texto_original": texto,
            "criterios_inferidos": criterios,
            "predicciones_nlp": predicciones_nlp,
            "filtros_relajados": filtros_relajados,
            "total_encontrados": len(resultado),
            "total_retornados": len(resultado_limitado),
            "estadisticas": estadisticas_resultado,
            "resultados": resultado_limitado.to_dict("records"),
        }

    try:
        guardar_consulta_nlp(
            texto_usuario=texto,
            criterios_inferidos=criterios,
            predicciones_nlp=predicciones_nlp,
            filtros_relajados=filtros_relajados,
            total_encontrados=0,
            total_retornados=0,
        )
    except Exception:
        pass

    return {
        "mensaje": "No se encontraron inmuebles que coincidan con la descripción proporcionada, incluso relajando filtros principales",
        "texto_original": texto,
        "criterios_inferidos": criterios,
        "predicciones_nlp": predicciones_nlp,
        "filtros_relajados": filtros_relajados,
        "total_encontrados": 0,
        "total_retornados": 0,
        "resultados": [],
    }


@router.post("/chat")
async def buscar_nlp_chat(payload: BuscarNLPChatRequest) -> Dict[str, Any]:
    modelo = _get_modelo_inmuebles()
    texto = payload.texto
    session_id = payload.session_id.strip()
    if not session_id:
        raise HTTPException(status_code=400, detail='El campo "session_id" no puede estar vacío')

    reiniciar = bool(payload.reiniciar)

    estado_prev = {} if reiniciar else conversaciones_activas.get(session_id, {})
    criterios_previos = dict(estado_prev.get("criterios", {}))

    criterios_turno_reglas = _parsear_texto_a_criterios(texto)

    criterios_acumulados: Dict[str, Any] = dict(criterios_previos)
    for k, v in criterios_turno_reglas.items():
        criterios_acumulados[k] = v

    predicciones_nlp: Dict[str, Any] = {}
    modelo_nlp_local = _get_modelo_nlp()
    if modelo_nlp_local is not None:
        try:
            predicciones_nlp = predecir_desde_texto(modelo_nlp_local, texto)
        except Exception:
            predicciones_nlp = {}

    if predicciones_nlp:
        if "operacion" in predicciones_nlp and "tipo_negocio" not in criterios_acumulados:
            op = str(predicciones_nlp["operacion"]).strip().lower()
            if op == "arriendo":
                criterios_acumulados["tipo_negocio"] = "Arriendo"
            elif op == "venta":
                criterios_acumulados["tipo_negocio"] = "Venta"

        if "ciudad" in predicciones_nlp and "ciudad" not in criterios_acumulados:
            criterios_acumulados["ciudad"] = predicciones_nlp["ciudad"]

        if "precio_rango" in predicciones_nlp:
            rango_texto = str(predicciones_nlp["precio_rango"])
            criterios_precio = _parsear_texto_a_criterios(rango_texto)
            for k in ["precio_min", "precio_max"]:
                if k in criterios_precio and k not in criterios_acumulados:
                    criterios_acumulados[k] = criterios_precio[k]

        if "parqueadero" in predicciones_nlp and "tiene_parqueadero" not in criterios_acumulados:
            try:
                num_parq = int(predicciones_nlp["parqueadero"])
                if num_parq >= 1:
                    criterios_acumulados["tiene_parqueadero"] = True
            except ValueError:
                pass

    filtros_relajados: List[str] = []

    if not criterios_acumulados:
        try:
            guardar_consulta_nlp(
                texto_usuario=texto,
                criterios_inferidos=criterios_acumulados,
                predicciones_nlp=predicciones_nlp,
                filtros_relajados=filtros_relajados,
                total_encontrados=0,
                total_retornados=0,
            )
        except Exception:
            pass

        return {
            "mensaje": "No se pudieron inferir criterios claros a partir del texto. Intenta ser más específico.",
            "session_id": session_id,
            "texto_original": texto,
            "criterios_turno": criterios_turno_reglas,
            "criterios_acumulados": criterios_acumulados,
            "predicciones_nlp": predicciones_nlp,
            "filtros_relajados": filtros_relajados,
            "total_encontrados": 0,
            "total_retornados": 0,
            "resultados": [],
        }

    def ejecutar_busqueda(crit: Dict[str, Any]):
        try:
            return modelo.categorizar_inmuebles(crit)
        except Exception:
            return modelo.df.copy() * 0

    criterios_busqueda = dict(criterios_acumulados)
    resultado = ejecutar_busqueda(criterios_busqueda)

    if len(resultado) == 0:
        orden_relajacion = [
            ["precio_min", "precio_max"],
            ["ciudad"],
            ["tipo_negocio"],
            ["amoblado"],
            ["mascotas"],
            ["balcon"],
            ["terraza"],
        ]

        criterios_relajados = dict(criterios_busqueda)

        for grupo in orden_relajacion:
            alguno_eliminado = False
            for clave in grupo:
                if clave in criterios_relajados:
                    criterios_relajados.pop(clave)
                    filtros_relajados.append(clave)
                    alguno_eliminado = True
            if not alguno_eliminado:
                continue

            resultado = ejecutar_busqueda(criterios_relajados)
            if len(resultado) > 0:
                criterios_busqueda = criterios_relajados
                break

    if len(resultado) > 0:
        try:
            df_tmp = resultado.copy()
            for col in ["titulo", "descripcion", "ciudad", "zona"]:
                if col not in df_tmp.columns:
                    df_tmp[col] = ""
            textos_inmuebles = (
                df_tmp["titulo"].fillna("").astype(str)
                + " "
                + df_tmp["descripcion"].fillna("").astype(str)
                + " "
                + df_tmp["ciudad"].fillna("").astype(str)
                + " "
                + df_tmp["zona"].fillna("").astype(str)
            )

            from sklearn.feature_extraction.text import TfidfVectorizer

            corpus = [texto] + textos_inmuebles.tolist()
            vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2))
            tfidf_matrix = vectorizer.fit_transform(corpus)

            user_vec = tfidf_matrix[0]
            inmuebles_vecs = tfidf_matrix[1:]
            similitudes = inmuebles_vecs.dot(user_vec.T).toarray().ravel()

            df_tmp = df_tmp.copy()
            df_tmp["score_similitud"] = similitudes

            resultado_ordenado = df_tmp.sort_values(by="score_similitud", ascending=False)
        except Exception:
            resultado_ordenado = resultado

        resultado_limitado = resultado_ordenado.head(100)
        resultado_limitado = resultado_limitado.where(pd.notnull(resultado_limitado), None)
        resultado_limitado = resultado_limitado.replace({np.nan: None})

        if "imagenes" in resultado_limitado.columns:
            def _parse_imagenes(value: Any) -> List[str]:
                if value is None:
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

        estadisticas_resultado: Dict[str, Any] = {}
        if "precio" in resultado.columns:
            estadisticas_resultado = {
                "precio_promedio": float(resultado["precio"].mean()),
                "precio_minimo": float(resultado["precio"].min()),
                "precio_maximo": float(resultado["precio"].max()),
            }

        if filtros_relajados:
            detalle_relajados = ", ".join(filtros_relajados)
            mensaje = (
                "No se encontraron inmuebles que cumplieran todos los criterios exactos, "
                f"pero se relajaron los filtros [{detalle_relajados}] y se encontraron "
                f"{len(resultado)} inmuebles (mostrando {len(resultado_limitado)})."
            )
        else:
            mensaje = (
                f"Se encontraron {len(resultado)} inmuebles que coinciden con la descripción, "
                f"mostrando {len(resultado_limitado)}."
            )

        criterios_turno: Dict[str, Any] = {}
        for k, v in criterios_acumulados.items():
            if k not in criterios_previos or criterios_previos.get(k) != v:
                criterios_turno[k] = v

        conversaciones_activas[session_id] = {
            "criterios": dict(criterios_acumulados),
            "filtros_relajados": list(filtros_relajados),
        }

        try:
            guardar_consulta_nlp(
                texto_usuario=texto,
                criterios_inferidos=criterios_acumulados,
                predicciones_nlp=predicciones_nlp,
                filtros_relajados=filtros_relajados,
                total_encontrados=len(resultado),
                total_retornados=len(resultado_limitado),
            )
        except Exception:
            pass

        return {
            "mensaje": mensaje,
            "session_id": session_id,
            "texto_original": texto,
            "criterios_turno": criterios_turno,
            "criterios_acumulados": criterios_acumulados,
            "predicciones_nlp": predicciones_nlp,
            "filtros_relajados": filtros_relajados,
            "total_encontrados": len(resultado),
            "total_retornados": len(resultado_limitado),
            "estadisticas": estadisticas_resultado,
            "resultados": resultado_limitado.to_dict("records"),
        }

    criterios_turno: Dict[str, Any] = {}
    for k, v in criterios_acumulados.items():
        if k not in criterios_previos or criterios_previos.get(k) != v:
            criterios_turno[k] = v

    conversaciones_activas[session_id] = {
        "criterios": dict(criterios_acumulados),
        "filtros_relajados": list(filtros_relajados),
    }

    try:
        guardar_consulta_nlp(
            texto_usuario=texto,
            criterios_inferidos=criterios_acumulados,
            predicciones_nlp=predicciones_nlp,
            filtros_relajados=filtros_relajados,
            total_encontrados=0,
            total_retornados=0,
        )
    except Exception:
        pass

    return {
        "mensaje": "No se encontraron inmuebles que coincidan con la descripción proporcionada, incluso relajando filtros principales",
        "session_id": session_id,
        "texto_original": texto,
        "criterios_turno": criterios_turno,
        "criterios_acumulados": criterios_acumulados,
        "predicciones_nlp": predicciones_nlp,
        "filtros_relajados": filtros_relajados,
        "total_encontrados": 0,
        "total_retornados": 0,
        "resultados": [],
    }

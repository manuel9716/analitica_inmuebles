from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

import json
import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.api.v1 import routes_inmuebles
from app.api.v1.routes_appointments import RequesterInfo, TimeWindow
from db_nlp_logs import guardar_consulta_nlp
from integrations.affinity.engine import AffinityEngine
from integrations.providers.highlight import rank_properties
from integrations.providers.models import UnifiedProperty
from integrations.appointments.store import appointment_store
from nlp_modelo_inmuebles import cargar_modelo_nlp, predecir_desde_texto


router = APIRouter(prefix="/v1/nlp", tags=["nlp"])

modelo_nlp: Optional[Dict[str, Any]] = None
conversaciones_activas: Dict[str, Dict[str, Any]] = {}

affinity_engine = AffinityEngine()


class NLPAppointmentItem(BaseModel):
    property_id: str
    time_window: TimeWindow
    notes: Optional[str] = None


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
            
            # Extraer posibles menciones de ciudades con palabras clave que las preceden
            ciudad_patterns = [
                r"\ben\s+([a-zA-Z\s]+)(?:,|\.|$)",  # "en Cali", "en Cali, que"
                r"\bde\s+([a-zA-Z\s]+)(?:,|\.|$)",  # "de Cali", "de Cali, que"
                r"\bpara\s+([a-zA-Z\s]+)(?:,|\.|$)",  # "para Cali"
                r"\bciudad\s+(?:de\s+)?([a-zA-Z\s]+)(?:,|\.|$)"  # "ciudad de Cali", "ciudad Cali"
            ]
            
            # Primero buscar por patrones específicos
            import re
            ciudad_encontrada = False
            for pattern in ciudad_patterns:
                matches = re.findall(pattern, t)
                for match in matches:
                    ciudad_candidata = match.strip().lower()
                    # Buscar la coincidencia más cercana en la lista de ciudades
                    for ciudad in ciudades:
                        c_lower = ciudad.lower()
                        if ciudad_candidata == c_lower or ciudad_candidata in c_lower or c_lower in ciudad_candidata:
                            criterios["ciudad"] = ciudad
                            ciudad_encontrada = True
                            break
                    if ciudad_encontrada:
                        break
                if ciudad_encontrada:
                    break
            
            # Si no se encontró con los patrones, buscar coincidencias directas en el texto
            if not ciudad_encontrada:
                # Ordenar ciudades por longitud (descendente) para matchear ciudades completas primero
                ciudades_ordenadas = sorted(ciudades, key=lambda x: len(str(x)), reverse=True)
                for ciudad in ciudades_ordenadas:
                    c_lower = str(ciudad).lower()
                    if c_lower in t:
                        criterios["ciudad"] = ciudad
                        break
    except Exception:
        pass

    return criterios


def _ensure_appointments_from_selection(payload: BuscarNLPRequest) -> None:
    if payload.appointments is not None:
        return
    if not payload.selected_properties:
        return
    if payload.time_window is None:
        return

    items: List[NLPAppointmentItem] = []
    for pid in payload.selected_properties:
        items.append(
            NLPAppointmentItem(
                property_id=str(pid),
                time_window=payload.time_window,
                notes=payload.notes,
            )
        )

    payload.appointments = items


def _maybe_schedule_appointment(
    payload: BuscarNLPRequest,
    criterios: Dict[str, Any],
    base_response: Dict[str, Any],
) -> Dict[str, Any]:
    if payload.action != "schedule":
        return base_response
    if not payload.user or (not payload.user.phone and not payload.user.email):
        raise HTTPException(status_code=400, detail="Para agendar debe proporcionar al menos teléfono o email en user")

    # Soportar tanto el flujo antiguo (un solo property_id) como el nuevo (lista appointments)
    created: List[Dict[str, Any]] = []

    # 1) Flujo múltiple desde appointments
    if payload.appointments:
        for item in payload.appointments:
            time_window_dict: Dict[str, Any] = {}
            if item.time_window.from_ is not None:
                time_window_dict["from"] = item.time_window.from_
            if item.time_window.to is not None:
                time_window_dict["to"] = item.time_window.to

            if not time_window_dict:
                raise HTTPException(status_code=400, detail="Cada cita en appointments debe tener time_window.from y/o time_window.to")

            appt = appointment_store.create_appointment(
                property_ids=[item.property_id],
                owner_id=None,
                selection_id=None,
                channel="chat",
                requester=payload.user.dict(by_alias=True),
                time_window=time_window_dict,
                notes=item.notes or payload.notes or "",
                status="pending",
                contact_phone_used=payload.user.phone or "",
                metadata={"criterios_inferidos": criterios},
            )

            created.append(
                {
                    "appointment_id": appt.appointment_id,
                    "property_ids": appt.property_ids,
                    "owner_id": appt.owner_id,
                    "selection_id": appt.selection_id,
                    "channel": appt.channel,
                    "requester": appt.requester,
                    "time_window": appt.time_window,
                    "notes": appt.notes,
                    "status": appt.status,
                    "contact_phone_used": appt.contact_phone_used,
                    "metadata": appt.metadata,
                    "created_at": appt.created_at,
                    "updated_at": appt.updated_at,
                }
            )

    # 2) Flujo legacy: un solo property_id y una sola ventana de tiempo
    elif payload.property_id:
        time_window_dict: Dict[str, Any] = {}
        if payload.time_window is not None:
            if payload.time_window.from_ is not None:
                time_window_dict["from"] = payload.time_window.from_
            if payload.time_window.to is not None:
                time_window_dict["to"] = payload.time_window.to

        if not time_window_dict:
            raise HTTPException(status_code=400, detail="Para agendar debe proporcionar time_window.from y/o time_window.to")

        appt = appointment_store.create_appointment(
            property_ids=[payload.property_id],
            owner_id=None,
            selection_id=None,
            channel="chat",
            requester=payload.user.dict(by_alias=True),
            time_window=time_window_dict,
            notes=payload.notes or "",
            status="pending",
            contact_phone_used=payload.user.phone or "",
            metadata={"criterios_inferidos": criterios},
        )

        created.append(
            {
                "appointment_id": appt.appointment_id,
                "property_ids": appt.property_ids,
                "owner_id": appt.owner_id,
                "selection_id": appt.selection_id,
                "channel": appt.channel,
                "requester": appt.requester,
                "time_window": appt.time_window,
                "notes": appt.notes,
                "status": appt.status,
                "contact_phone_used": appt.contact_phone_used,
                "metadata": appt.metadata,
                "created_at": appt.created_at,
                "updated_at": appt.updated_at,
            }
        )
    else:
        raise HTTPException(status_code=400, detail="Para agendar debe enviar property_id o appointments")

    base_response["appointments"] = created
    return base_response


@router.post("/buscar")
async def buscar_nlp(payload: BuscarNLPRequest) -> Dict[str, Any]:
    modelo = _get_modelo_inmuebles()
    texto = payload.texto

    # 1) Inferir criterios por reglas
    criterios_reglas = _parsear_texto_a_criterios(texto)
    criterios: Dict[str, Any] = dict(criterios_reglas)

    # 2) Inferir criterios con el modelo NLP (si está disponible)
    predicciones_nlp: Dict[str, Any] = {}
    modelo_nlp_local = _get_modelo_nlp()
    if modelo_nlp_local is not None:
        try:
            predicciones_nlp = predecir_desde_texto(modelo_nlp_local, texto)
        except Exception:
            predicciones_nlp = {}

    if predicciones_nlp:
        # Solo usamos ciudad del modelo NLP como respaldo cuando no se detectó por reglas.
        if "ciudad" in predicciones_nlp and "ciudad" not in criterios:
            criterios["ciudad"] = predicciones_nlp["ciudad"]

        # Nota: ya no usamos `operacion` ni `precio_rango` del modelo NLP para fijar
        # tipo_negocio o rangos de precio. Solo se toman cuando el usuario los
        # menciona explícitamente en el texto y son detectados por
        # _parsear_texto_a_criterios.

    # Asegurar que ciertas banderas solo se mantengan si el usuario las mencionó
    # explícitamente en el texto original.
    t_lower = texto.lower()
    if (
        "tiene_parqueadero" in criterios
        and not ("parqueadero" in t_lower or "garaje" in t_lower or "parqueo" in t_lower)
    ):
        criterios.pop("tiene_parqueadero", None)

    # Guardar una copia de los criterios originales (antes de relajar)
    criterios_originales: Dict[str, Any] = dict(criterios)

    if not criterios:
        try:
            guardar_consulta_nlp(
                texto_usuario=texto,
                criterios_inferidos=criterios_originales,
                predicciones_nlp=predicciones_nlp,
                filtros_relajados=[],
                total_encontrados=0,
                total_retornados=0,
            )
        except Exception:
            pass

        base_response = {
            "mensaje": "No se pudieron inferir criterios claros a partir del texto. Intenta ser más específico.",
            "texto_original": texto,
            "criterios_inferidos": criterios,
            "predicciones_nlp": predicciones_nlp,
            "total_encontrados": 0,
            "total_retornados": 0,
            "resultados": [],
        }
        return base_response

    filtros_relajados: List[str] = []

    def ejecutar_busqueda(crit: Dict[str, Any]):
        try:
            return modelo.categorizar_inmuebles(crit)
        except Exception:
            return modelo.df.copy() * 0

    # 3) Ejecutar búsqueda con criterios completos (pero permitiendo relajar sobre una copia)
    criterios_busqueda: Dict[str, Any] = dict(criterios)
    resultado = ejecutar_busqueda(criterios_busqueda)

    # 4) Relajar filtros si no hay resultados
    if len(resultado) == 0:
        orden_relajacion = [
            ["precio_min", "precio_max"],
            ["amoblado"],
            ["mascotas"],
            ["balcon"],
            ["terraza"],
            ["tipo_negocio"],
            ["ciudad"],
            ["tipo"]
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

    # 5) Si tras relajar filtros hay resultados: flujo normal
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

        resultado_limitado = resultado_ordenado.head(100).copy()
        resultado_limitado = resultado_limitado.where(pd.notnull(resultado_limitado), None)
        resultado_limitado = resultado_limitado.replace({np.nan: None})

        # Ranking por inmuebles destacados/prioridad de proveedor
        try:
            props: List[UnifiedProperty] = []
            for _, row in resultado_limitado.iterrows():
                row_dict = row.to_dict()
                source_id = str(row_dict.get("id", "") or "")
                if not source_id:
                    continue

                unified_id = f"wasi:{source_id}"

                prop = UnifiedProperty(
                    id=unified_id,
                    source="wasi",
                    source_id=source_id,
                    title=row_dict.get("titulo") or None,
                    description=row_dict.get("descripcion") or None,
                    price=row_dict.get("precio"),
                    currency="COP",
                    area_m2=row_dict.get("area_total") or row_dict.get("area_construida"),
                    bedrooms=row_dict.get("habitaciones"),
                    bathrooms=row_dict.get("banos"),
                    country=None,
                    city=(row_dict.get("ciudad") or None),
                    zone=(row_dict.get("zona") or None),
                    address=(row_dict.get("direccion") or None),
                    images=row_dict.get("imagenes") or [],
                    phones=[],
                    contact_name=None,
                    raw=row_dict,
                )
                props.append(prop)

            ranked = rank_properties(props)
            order_index = {p.source_id: idx for idx, p in enumerate(ranked)}

            if "id" in resultado_limitado.columns:
                resultado_limitado["_rank_priority"] = (
                    resultado_limitado["id"].astype(str).map(order_index)
                )
                resultado_limitado = resultado_limitado.sort_values(
                    "_rank_priority", na_position="last"
                )
                resultado_limitado = resultado_limitado.drop(columns=["_rank_priority"])
        except Exception:
            pass

        # Calcular afinidad por inmueble
        try:
            def _apply_affinity(row):
                row_dict = row.to_dict()
                score = affinity_engine.compute_affinity(criterios_originales, row_dict)
                
                # Reducir la afinidad si se relajaron filtros importantes
                filtros_criticos = ["ciudad", "tipo"]
                if any(filtro in filtros_relajados for filtro in filtros_criticos):
                    # Si la ciudad o el tipo fueron relajados, verificar si el inmueble coincide 
                    # con los criterios originales para esos campos
                    for filtro in filtros_criticos:
                        if filtro in criterios_originales and filtro in row_dict:
                            crit_val = str(criterios_originales[filtro]).strip().lower()
                            prop_val = str(row_dict[filtro] or "").strip().lower()
                            
                            # Usar coincidencia parcial: si la ciudad o tipo está contenida en el valor
                            # o viceversa, considerar que hay coincidencia y mantener el 100% de afinidad
                            if crit_val in prop_val or prop_val in crit_val:
                                # Hay coincidencia parcial, mantener la afinidad calculada
                                pass
                            else:
                                # No hay coincidencia ni siquiera parcial
                                score = min(score, 20.0)  # Nivel "very_low"
                
                level = affinity_engine.classify_level(score)
                row["affinity_score"] = float(score)
                row["affinity_level"] = level
                return row

            resultado_limitado = resultado_limitado.apply(_apply_affinity, axis=1)

            # Ordenar primero por afinidad (desc) y luego por score_similitud (desc) si existe.
            sort_cols = ["affinity_score"]
            ascending_flags = [False]
            if "score_similitud" in resultado_limitado.columns:
                sort_cols.append("score_similitud")
                ascending_flags.append(False)

            resultado_limitado = resultado_limitado.sort_values(
                by=sort_cols,
                ascending=ascending_flags,
            )
        except Exception:
            pass

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

            resultado_limitado["imagenes"] = resultado_limitado["imagenes"].apply(
                _parse_imagenes
            )

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
                f"De un total de {len(resultado)} inmuebles encontrados para esta búsqueda, "
                f"se están mostrando {len(resultado_limitado)} resultados que coinciden con tu intención. "
                f"Se relajaron los filtros [{detalle_relajados}] para ampliar las coincidencias."
            )
        else:
            mensaje = (
                f"Se encontraron {len(resultado_limitado)} inmuebles que coinciden con la descripción."
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

        base_response = {
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
        return base_response

    # 6) Caso sin resultados ni siquiera relajando filtros: usar afinidad para sugerencias
    try:
        df_base = modelo.df.copy()

        tipo = criterios_busqueda.get("tipo")
        ciudad = criterios_busqueda.get("ciudad")
        tipo_negocio = criterios_busqueda.get("tipo_negocio")

        if tipo and "tipo" in df_base.columns:
            df_base = df_base[df_base["tipo"].astype(str) == str(tipo)]
        if ciudad and "ciudad" in df_base.columns:
            df_base = df_base[df_base["ciudad"].astype(str) == str(ciudad)]
        if tipo_negocio and "tipo_negocio" in df_base.columns:
            df_base = df_base[df_base["tipo_negocio"].astype(str) == str(tipo_negocio)]

        if len(df_base) == 0:
            df_base = modelo.df.copy()

        df_base = df_base.where(pd.notnull(df_base), None)
        df_base = df_base.replace({np.nan: None})

        def _apply_affinity_suggest(row):
            row_dict = row.to_dict()
            score = affinity_engine.compute_affinity(criterios_originales, row_dict)
            
            # Aplicar misma lógica de reducción para sugerencias
            filtros_criticos = ["ciudad", "tipo"]
            for filtro in filtros_criticos:
                if filtro in criterios_originales and filtro in row_dict:
                    crit_val = str(criterios_originales[filtro]).strip().lower()
                    prop_val = str(row_dict[filtro] or "").strip().lower()
                    
                    # Usar coincidencia parcial: si la ciudad o tipo está contenida en el valor
                    # o viceversa, considerar que hay coincidencia y mantener el 100% de afinidad
                    if crit_val in prop_val or prop_val in crit_val:
                        # Hay coincidencia parcial, mantener la afinidad calculada
                        pass
                    else:
                        # No hay coincidencia ni siquiera parcial
                        score = min(score, 20.0)  # Nivel "very_low"
                        
            level = affinity_engine.classify_level(score)
            row["affinity_score"] = float(score)
            row["affinity_level"] = level
            return row

        df_base = df_base.apply(_apply_affinity_suggest, axis=1)
        df_base = df_base.sort_values("affinity_score", ascending=False)

        df_sugerencias = df_base[df_base["affinity_score"] > 0].head(50).copy()

        if "imagenes" in df_sugerencias.columns:
            def _parse_imagenes_sug(value: Any) -> List[str]:
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

            df_sugerencias["imagenes"] = df_sugerencias["imagenes"].apply(
                _parse_imagenes_sug
            )

        total_sugerencias = len(df_sugerencias)

        try:
            guardar_consulta_nlp(
                texto_usuario=texto,
                criterios_inferidos=criterios,
                predicciones_nlp=predicciones_nlp,
                filtros_relajados=filtros_relajados,
                total_encontrados=0,
                total_retornados=total_sugerencias,
            )
        except Exception:
            pass

        mensaje = (
            f"Se encontraron {total_sugerencias} inmuebles sugeridos por afinidad con tu búsqueda. "
            "Son resultados similares aunque no todos cumplan exactamente todos los criterios."
        )

        base_response = {
            "mensaje": mensaje,
            "texto_original": texto,
            "criterios_inferidos": criterios,
            "predicciones_nlp": predicciones_nlp,
            "filtros_relajados": filtros_relajados,
            "total_encontrados": 0,
            "total_retornados": total_sugerencias,
            "estadisticas": {},
            "resultados": df_sugerencias.to_dict("records"),
        }
        return base_response
    except Exception:
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

        base_response = {
            "mensaje": "No se encontraron inmuebles que coincidan con la descripción proporcionada, incluso relajando filtros principales",
            "texto_original": texto,
            "criterios_inferidos": criterios,
            "predicciones_nlp": predicciones_nlp,
            "filtros_relajados": filtros_relajados,
            "total_encontrados": 0,
            "total_retornados": 0,
            "resultados": [],
        }
        return base_response

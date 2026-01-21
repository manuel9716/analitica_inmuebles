from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
import logging

import json
import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

# Configuración del logger
logger = logging.getLogger(__name__)

from app.api.v1 import routes_inmuebles
from app.api.v1.routes_appointments import RequesterInfo, TimeWindow
from db_nlp_logs import guardar_consulta_nlp
from integrations.affinity.engine import AffinityEngine
from integrations.providers.highlight import rank_properties
from integrations.providers.models import UnifiedProperty
from integrations.appointments.store import appointment_store
from integrations.geo.geocoder import mejorar_deteccion_ciudad, normalizar_ubicacion, normalizar_ciudad_en_propiedad
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
            num_hab = int(match_hab.group(1))
            # Crear tanto el criterio exacto como el mínimo para compatibilidad
            criterios["habitaciones"] = num_hab  # Criterio exacto
            criterios["habitaciones_min"] = num_hab  # Se mantiene para compatibilidad
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
        # PASO 1: Primero usamos nuestra propia detección de ciudades conocidas
        ciudad_detectada = mejorar_deteccion_ciudad(t)
        if ciudad_detectada:
            criterios["ciudad"] = ciudad_detectada
        else:
            # PASO 2: Si no encontramos ciudades conocidas, usamos el método anterior
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
        
        # PASO 3: Si se encontró una ciudad, intentamos normalizarla usando nuestro servicio
        if "ciudad" in criterios:
            resultado_norm = normalizar_ubicacion(criterios["ciudad"])
            if resultado_norm["ciudad"] and resultado_norm["confianza"] > 0.7:
                criterios["ciudad"] = resultado_norm["ciudad"]
    except Exception as e:
        # Mantener silencioso, pero podríamos loggear el error
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
    
    # PRIMERO: Intentamos detectar ciudades explícitamente mencionadas en el texto usando geocodificación
    ciudad_detectada = mejorar_deteccion_ciudad(texto)
    if ciudad_detectada:
        # Si detectamos una ciudad conocida (como Pance), la usamos y sobrescribimos cualquier otra
        criterios["ciudad"] = ciudad_detectada
        # También actualizamos la predicción del NLP para mantener consistencia
        if predicciones_nlp:
            predicciones_nlp["ciudad"] = ciudad_detectada
    
    # SOLO si no detectamos una ciudad conocida, consideramos usar la del modelo NLP
    elif predicciones_nlp and "ciudad" not in criterios and "ciudad" in predicciones_nlp:
        # No asignar Bogotá automáticamente si no se menciona explícitamente
        if predicciones_nlp["ciudad"] == "Bogotá":
            if "bogotá" in texto.lower() or "bogota" in texto.lower():
                criterios["ciudad"] = "Bogotá"
            # Si no se menciona Bogotá, dejamos la ciudad sin definir
        else:
            # Para cualquier otra ciudad que no sea Bogotá, la usamos
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
    
    # Asegurar que la ciudad inferida es consistente en la respuesta
    if "ciudad" in criterios_originales:
        if predicciones_nlp:
            # Hacemos que las predicciones sean consistentes con los criterios inferidos
            predicciones_nlp["ciudad"] = criterios_originales["ciudad"]

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
            # Copia de criterios para modificación
            crit_mod = dict(crit)
            
            # Si se especifica habitaciones exactas, aplicar filtrado exacto
            if "habitaciones" in crit_mod:
                hab_valor = crit_mod.pop("habitaciones")
                # Primero obtenemos todos los inmuebles con el modelo
                df_resultado = modelo.categorizar_inmuebles(crit_mod)
                # Luego filtramos por habitaciones exactas
                return df_resultado[df_resultado["habitaciones"] == hab_valor]
            else:
                # Comportamiento normal si no hay habitaciones exactas
                return modelo.categorizar_inmuebles(crit_mod)
        except Exception:
            return modelo.df.copy() * 0

    # Verificar si el texto de búsqueda coincide con algún título de inmueble
    texto_busqueda_norm = texto.lower().strip()
    coincidencia_exacta_titulo = None
    propiedades_titulo_similar = None
    
    try:
        # Buscar propiedades que coincidan con el título exacto
        if modelo.df is not None and "titulo" in modelo.df.columns:
            # Primero intentar coincidencia exacta con el título
            coincidencia_exacta = modelo.df[modelo.df["titulo"].fillna("").str.lower() == texto_busqueda_norm]
            if not coincidencia_exacta.empty:
                logger.info(f"Encontrada coincidencia exacta de título: {coincidencia_exacta.iloc[0]['titulo']}")
                coincidencia_exacta_titulo = coincidencia_exacta.copy()
            # Si no hay coincidencia exacta, buscar propiedades cuyo título contenga el texto de búsqueda completo
            else:
                titulos_match = modelo.df[modelo.df["titulo"].fillna("").str.lower().str.contains(texto_busqueda_norm, regex=False)]
                if not titulos_match.empty:
                    propiedades_titulo_similar = titulos_match.copy()
    except Exception as e:
        logger.error(f"Error al buscar por título: {e}")
    
    # 3) Ejecutar búsqueda con criterios completos (pero permitiendo relajar sobre una copia)
    criterios_busqueda: Dict[str, Any] = dict(criterios)
    # Si tenemos una ciudad, asegurarnos que usa la versión normalizada
    if "ciudad" in criterios_busqueda and criterios_busqueda["ciudad"]:
        resultado_norm = normalizar_ubicacion(criterios_busqueda["ciudad"])
        if resultado_norm["ciudad"]:
            criterios_busqueda["ciudad"] = resultado_norm["ciudad"]
    
    resultado_df = ejecutar_busqueda(criterios_busqueda)
    filtros_originales = dict(criterios_busqueda)  # Guardar los criterios originales
    
    # Si encontramos coincidencia exacta de título, usar SOLO esa propiedad y no relajar filtros
    if coincidencia_exacta_titulo is not None and not coincidencia_exacta_titulo.empty:
        # Agregar columnas necesarias si no existen
        if "exact_match_score" not in coincidencia_exacta_titulo.columns:
            coincidencia_exacta_titulo["exact_match_score"] = 5000  # Valor alto para coincidencia exacta
        if "affinity_score" not in coincidencia_exacta_titulo.columns:
            coincidencia_exacta_titulo["affinity_score"] = 100.0  # Máxima afinidad
        if "affinity_level" not in coincidencia_exacta_titulo.columns:
            coincidencia_exacta_titulo["affinity_level"] = "very_high"
            
        resultado_df = coincidencia_exacta_titulo
        # Limpiar lista de filtros relajados ya que tenemos una coincidencia perfecta
        filtros_relajados = []
        logger.info(f"Usando SOLO coincidencia exacta de título '{coincidencia_exacta_titulo.iloc[0]['titulo']}' en lugar de búsqueda por criterios")
    
    # Si no hay resultados y no hay coincidencia exacta de título, intentar relajar filtros
    elif resultado_df.empty or len(resultado_df) == 0:
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

            resultado_df = ejecutar_busqueda(criterios_relajados)
            if len(resultado_df) > 0:
                criterios_busqueda = criterios_relajados
                break

    # 5) Limitar la cantidad de resultados a retornar
    limite_resultados = 100  # Máximo 100 resultados
    resultado_limitado = resultado_df.head(limite_resultados).copy()
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

    # Preparamos el DataFrame para la afinidad
    if "exact_match_score" not in resultado_df.columns:
        resultado_df["exact_match_score"] = 0
    if "affinity_score" not in resultado_df.columns:
        resultado_df["affinity_score"] = 0
    if "affinity_level" not in resultado_df.columns:
        resultado_df["affinity_level"] = "low"
    
    # Si encontramos coincidencia exacta de título, le damos máxima puntuación
    if coincidencia_exacta_titulo is not None and not coincidencia_exacta_titulo.empty:
        # Aseguramos que las columnas de afinidad existan en el DataFrame
        for idx, propiedad in coincidencia_exacta_titulo.iterrows():
            if propiedad["titulo"].lower().strip() == texto_busqueda_norm:
                # Esta propiedad coincide exactamente con el texto de búsqueda
                if "ciudad" in filtros_relajados:
                    filtros_relajados.remove("ciudad")
                # Le asignamos puntuación máxima
                coincidencia_exacta_titulo.loc[idx, "exact_match_score"] = 5000
                coincidencia_exacta_titulo.loc[idx, "affinity_score"] = 100.0
                coincidencia_exacta_titulo.loc[idx, "affinity_level"] = "very_high"
    
    # Calcular afinidad para los resultados
    try:
        # Aplicar la función de afinidad a cada fila
        affinity_engine = AffinityEngine()
        
        def _apply_affinity(row):
            row_dict = row.to_dict()
            base_score = affinity_engine.compute_affinity(criterios_originales, row_dict)
            
            # Calcular puntuación por coincidencia exacta en criterios mencionados explícitamente
            exact_match_score = 0
            criterios_mencionados = {}
            
            # Verificar si hay coincidencia exacta con el título de búsqueda
            if "titulo" in row_dict and row_dict["titulo"] and texto_busqueda_norm == row_dict["titulo"].lower().strip():
                # Coincidencia exacta de título - máxima afinidad
                exact_match_score += 3000
                base_score = 100.0  # Máxima afinidad
                
            # Considerar solo los criterios mencionados explícitamente por el usuario
            for key, value in criterios_originales.items():
                if key in ["ciudad", "habitaciones_min", "tipo", "precio_min", "precio_max", "banos_min"]:
                    criterios_mencionados[key] = value
            
            # Verificar cada criterio mencionado
            for criterio, valor in criterios_mencionados.items():
                if (criterio == "habitaciones" or criterio == "habitaciones_min") and "habitaciones" in row_dict:
                    if row_dict["habitaciones"] is not None:
                        try:
                            # Asegurar que estamos trabajando con números
                            hab_crit = float(valor)
                            hab_prop = float(row_dict["habitaciones"])
                            
                            if criterio == "habitaciones" and hab_prop == hab_crit:
                                # Coincidencia exacta
                                exact_match_score += 1000
                            elif criterio == "habitaciones_min" and hab_prop >= hab_crit:
                                # Coincidencia con mínimo
                                exact_match_score += 500
                        except (ValueError, TypeError):
                            pass
                    
                    elif criterio == "banos_min" and "banos" in row_dict:
                        if row_dict["banos"] is not None:
                            try:
                                ban_prop = int(str(row_dict["banos"]).replace(">10", "10"))
                                ban_crit = int(valor)
                                if ban_prop >= ban_crit:
                                    # Coincidencia exacta o excede requerimiento
                                    exact_match_score += 500
                            except (ValueError, TypeError):
                                pass
                            
                    elif criterio == "ciudad" and "ciudad" in row_dict:
                        if row_dict["ciudad"] is not None:
                            crit_val = str(valor).strip().lower()
                            prop_val = str(row_dict["ciudad"]).strip().lower()
                            
                            if crit_val == prop_val:
                                # Coincidencia exacta en ciudad
                                exact_match_score += 1000
                            elif crit_val in prop_val or prop_val in crit_val:
                                # Coincidencia parcial en ciudad
                                exact_match_score += 100
                            
                            # También revisar en el título y dirección
                            if "titulo" in row_dict and row_dict["titulo"] and crit_val in str(row_dict["titulo"]).lower():
                                exact_match_score += 300
                                
                            if "direccion" in row_dict and row_dict["direccion"] and crit_val in str(row_dict["direccion"]).lower():
                                exact_match_score += 200
                
                # Reducir afinidad para filtros relajados sin coincidencia
            filtros_criticos = ["ciudad", "tipo"]
            if any(filtro in filtros_relajados for filtro in filtros_criticos):
                for filtro in filtros_criticos:
                    if filtro in criterios_originales and filtro in row_dict:
                        crit_val = str(criterios_originales[filtro]).strip().lower()
                        prop_val = str(row_dict[filtro] or "").strip().lower()
                        
                        # Verificar coincidencia en otros campos
                        coincidencia_encontrada = False
                        
                        if filtro == "ciudad":
                            # Normalizar valor para búsqueda (quitar tildes, espacios extras, etc.)
                            import unicodedata
                            
                            def normalize_text(text):
                                # Convertir a minúsculas y eliminar acentos
                                text = str(text).lower().strip()
                                text = unicodedata.normalize('NFKD', text).encode('ASCII', 'ignore').decode('ASCII')
                                return text
                            
                            # Función para verificar si una ciudad está presente en un texto
                            def ciudad_en_texto(ciudad, texto):
                                if not texto:
                                    return False
                                    
                                ciudad_norm = normalize_text(ciudad)
                                texto_norm = normalize_text(texto)
                                
                                # Verificar coincidencia exacta
                                if ciudad_norm in texto_norm:
                                    return True
                                
                                # Verificar coincidencia de palabras compuestas
                                # Por ejemplo, "ciudad jardin" debe coincidir con "jardin ciudad"
                                palabras_ciudad = set(ciudad_norm.split())
                                # Verificar si todas las palabras de la ciudad están en el texto
                                if len(palabras_ciudad) > 1:
                                    palabras_texto = set(texto_norm.split())
                                    if palabras_ciudad.issubset(palabras_texto):
                                        return True
                                        
                                return False
                            
                            # Buscar la ciudad en el título
                            if "titulo" in row_dict and row_dict["titulo"] and ciudad_en_texto(crit_val, row_dict["titulo"]):
                                coincidencia_encontrada = True
                                # Si encontramos la ciudad en el título, eliminamos ciudad de filtros_relajados
                                if filtro in filtros_relajados:
                                    filtros_relajados.remove(filtro)
                                    
                            # Buscar la ciudad en la dirección
                            if not coincidencia_encontrada and "direccion" in row_dict and row_dict["direccion"] and ciudad_en_texto(crit_val, row_dict["direccion"]):
                                coincidencia_encontrada = True
                                # Si encontramos la ciudad en la dirección, eliminamos ciudad de filtros_relajados
                                if filtro in filtros_relajados:
                                    filtros_relajados.remove(filtro)
                    
                            if not coincidencia_encontrada and not (crit_val in prop_val or prop_val in crit_val):
                                # No hay coincidencia ni parcial
                                base_score = min(base_score, 20.0)  # Nivel "very_low"
                    
            level = affinity_engine.classify_level(base_score)
            
            # Guardar tanto la puntuación de coincidencia exacta como la afinidad base
            return pd.Series([exact_match_score, float(base_score), level],
                           index=["exact_match_score", "affinity_score", "affinity_level"])

        # Aplicar la función de afinidad y conservar todos los datos originales
        scores = resultado_limitado.apply(_apply_affinity, axis=1)
        
        # Añadir los scores al dataframe original sin perder las demás columnas
        resultado_limitado['exact_match_score'] = scores['exact_match_score']
        resultado_limitado['affinity_score'] = scores['affinity_score']
        resultado_limitado['affinity_level'] = scores['affinity_level']

        # Ordenar primero por coincidencia exacta, luego por afinidad y finalmente por similitud
        sort_cols = ["exact_match_score", "affinity_score"]
        ascending_flags = [False, False]
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
    if "precio" in resultado_df.columns:
        estadisticas_resultado = {
            "precio_promedio": float(resultado_df["precio"].mean()),
            "precio_minimo": float(resultado_df["precio"].min()),
            "precio_maximo": float(resultado_df["precio"].max()),
        }

    # Mensaje especial cuando hay coincidencia exacta de título
    if coincidencia_exacta_titulo is not None and not coincidencia_exacta_titulo.empty:
        mensaje = (
            f"Se encontró 1 propiedad con título que coincide exactamente con tu búsqueda: '{texto}'."
        )
        # Asegurar que solo se muestre ese resultado
        if len(resultado_limitado) > 1:
            resultado_limitado = resultado_limitado.iloc[[0]]
    elif filtros_relajados:
        detalle_relajados = ", ".join(filtros_relajados)
        mensaje = (
            f"De un total de {len(resultado_df)} inmuebles encontrados para esta búsqueda, "
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
            total_encontrados=len(resultado_df),
            total_retornados=len(resultado_limitado),
        )
    except Exception:
        pass

    # Usar criterios_originales en lugar de criterios para la respuesta
    # para mantener consistencia entre la búsqueda y la respuesta
    base_response = {
        "mensaje": mensaje,
        "texto_original": texto,
        "criterios_inferidos": criterios_originales,  # Usamos criterios_originales
        "predicciones_nlp": predicciones_nlp,
        "filtros_relajados": filtros_relajados,
        "total_encontrados": len(resultado_df),
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
            base_score = affinity_engine.compute_affinity(criterios_originales, row_dict)
            
            # Calcular puntuación por coincidencia exacta en criterios mencionados explícitamente
            exact_match_score = 0
            criterios_mencionados = {}
            
            # Verificar si hay coincidencia exacta con el título de búsqueda
            if "titulo" in row_dict and row_dict["titulo"] and texto_busqueda_norm == row_dict["titulo"].lower().strip():
                # Coincidencia exacta de título - máxima afinidad
                exact_match_score += 5000  # Valor muy alto para garantizar el primer lugar
                base_score = 100.0  # Máxima afinidad
            
            # Considerar solo los criterios mencionados explícitamente por el usuario
            for key, value in criterios_originales.items():
                if key in ["ciudad", "habitaciones_min", "tipo", "precio_min", "precio_max", "banos_min"]:
                    criterios_mencionados[key] = value
            
            # Verificar cada criterio mencionado
            for criterio, valor in criterios_mencionados.items():
                if criterio == "habitaciones_min" and "habitaciones" in row_dict:
                    if row_dict["habitaciones"] is not None:
                        try:
                            hab_prop = int(row_dict["habitaciones"])
                            hab_crit = int(valor)
                            if hab_prop == hab_crit:
                                # Coincidencia exacta en habitaciones
                                exact_match_score += 1000
                            elif hab_prop > hab_crit:
                                # Cumple mínimo pero no es exacto
                                exact_match_score += 100
                        except (ValueError, TypeError):
                            pass
                
                elif criterio == "banos_min" and "banos" in row_dict:
                    if row_dict["banos"] is not None:
                        try:
                            ban_prop = int(str(row_dict["banos"]).replace(">10", "10"))
                            ban_crit = int(valor)
                            if ban_prop == ban_crit:
                                # Coincidencia exacta en baños
                                exact_match_score += 1000
                            elif ban_prop > ban_crit:
                                # Cumple mínimo pero no es exacto
                                exact_match_score += 100
                        except (ValueError, TypeError):
                            pass
                            
                elif criterio == "ciudad" and "ciudad" in row_dict:
                    if row_dict["ciudad"] is not None:
                        crit_val = str(valor).strip().lower()
                        prop_val = str(row_dict["ciudad"]).strip().lower()
                        
                        # Intentar normalizar la ciudad de la propiedad primero
                        ciudad_normalizada = normalizar_ciudad_en_propiedad(row_dict)
                        if ciudad_normalizada:
                            prop_val = ciudad_normalizada.lower()
                        
                        # Normalizar la ciudad del criterio también
                        resultado_norm = normalizar_ubicacion(crit_val)
                        if resultado_norm["ciudad"]:
                            crit_val = resultado_norm["ciudad"].lower()
                        
                        if crit_val == prop_val:
                            # Coincidencia exacta en ciudad
                            exact_match_score += 1000
                        elif crit_val in prop_val or prop_val in crit_val:
                            # Coincidencia parcial en ciudad
                            exact_match_score += 100
                        # También buscar en título y dirección
                        elif "titulo" in row_dict and row_dict["titulo"] and crit_val in str(row_dict["titulo"]).lower():
                            # Ciudad mencionada en el título
                            exact_match_score += 800
                        elif "direccion" in row_dict and row_dict["direccion"] and crit_val in str(row_dict["direccion"]).lower():
                            # Ciudad mencionada en la dirección
                            exact_match_score += 500
                
                elif criterio == "tipo" and "tipo" in row_dict:
                    if row_dict["tipo"] is not None:
                        crit_val = str(valor).strip().lower()
                        prop_val = str(row_dict["tipo"]).strip().lower()
                        
                        if crit_val == prop_val:
                            # Coincidencia exacta en tipo
                            exact_match_score += 1000
                        elif crit_val in prop_val or prop_val in crit_val:
                            # Coincidencia parcial en tipo
                            exact_match_score += 100
            
            # Aplicar misma lógica de reducción para sugerencias
            filtros_criticos = ["ciudad", "tipo"]
            for filtro in filtros_criticos:
                if filtro in criterios_originales and filtro in row_dict:
                    crit_val = str(criterios_originales[filtro]).strip().lower()
                    prop_val = str(row_dict[filtro] or "").strip().lower()
                    
                    # Verificar coincidencia en otros campos como título o dirección
                    coincidencia_encontrada = False
                    
                    if filtro == "ciudad":
                        # Buscar la ciudad en el título
                        if "titulo" in row_dict and row_dict["titulo"] and crit_val in str(row_dict["titulo"]).lower():
                            coincidencia_encontrada = True
                            
                        # Buscar la ciudad en la dirección
                        if not coincidencia_encontrada and "direccion" in row_dict and row_dict["direccion"] and crit_val in str(row_dict["direccion"]).lower():
                            coincidencia_encontrada = True
                    
                    if not coincidencia_encontrada and not (crit_val in prop_val or prop_val in crit_val):
                        # No hay coincidencia ni parcial
                        base_score = min(base_score, 20.0)  # Nivel "very_low"
                    
            level = affinity_engine.classify_level(base_score)
            
            # Guardar tanto la puntuación de coincidencia exacta como la afinidad base
            return pd.Series([exact_match_score, float(base_score), level],
                           index=["exact_match_score", "affinity_score", "affinity_level"])

        # Aplicar la función de afinidad y conservar todos los datos originales
        scores = df_base.apply(_apply_affinity_suggest, axis=1)
        
        # Añadir los scores al dataframe original sin perder las demás columnas
        df_base['exact_match_score'] = scores['exact_match_score']
        df_base['affinity_score'] = scores['affinity_score']
        df_base['affinity_level'] = scores['affinity_level']
        
        # Ordenar por los criterios establecidos
        df_base = df_base.sort_values(["exact_match_score", "affinity_score"], ascending=[False, False])

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

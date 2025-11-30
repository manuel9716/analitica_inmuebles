"""
API REST para el modelo de inmuebles con integración WASI
Servidor Flask que expone endpoints para búsqueda de inmuebles con datos reales
"""

from flask import Flask, request, jsonify, send_from_directory, make_response
from flask_cors import CORS
from modelo_inmuebles import ModeloInmuebles
from integrations.wasi.wasi_connector import WasiConnector
from nlp_modelo_inmuebles import (
    cargar_modelo_nlp,
    predecir_desde_texto,
    cargar_dataset_nlp_desde_db,
    cargar_dataset_nlp,
    entrenar_modelos,
    guardar_modelo_nlp,
)
from db_nlp_logs import init_db, guardar_consulta_nlp
import pandas as pd
import numpy as np
import os
from datetime import datetime
import re
import json
from sklearn.feature_extraction.text import TfidfVectorizer

app = Flask(__name__)
CORS(app)  # Permitir CORS para desarrollo

# Configuración de WASI
ID_COMPANY = "493728"
WASI_TOKEN = "4kyL_tY1Q_e8yL_j0ju"

# Variables globales
modelo = None
wasi_connector = None
ultima_sincronizacion = None
modelo_nlp = None
conversaciones_activas = {}


def parsear_texto_a_criterios(texto):
    """Convierte una descripción en lenguaje natural en criterios de búsqueda.

    Ejemplo de entrada:
    "quiero un apartamento con buena iluminacion de 3 alcobas y 2 baños, con parqueadero"

    La idea es mapear el texto a los campos que ya entiende el modelo, como
    tipo, ciudad, habitaciones_min, banos_min, precio_min/max, tipo_negocio, etc.
    """
    criterios = {}

    if not texto:
        return criterios

    t = texto.lower()

    # Tipo de inmueble
    if "apartamento" in t or "apartaestudio" in t:
        criterios["tipo"] = "Apartamento"
    elif "casa" in t:
        criterios["tipo"] = "Casa"

    # Tipo de negocio (arriendo / venta)
    if "arriendo" in t or "alquiler" in t or "renta" in t:
        criterios["tipo_negocio"] = "Arriendo"
    if "venta" in t or "comprar" in t or "compro" in t:
        criterios["tipo_negocio"] = "Venta"

    # Habitaciones (alcobas, cuartos)
    match_hab = re.search(r"(\d+)\s+(habitaciones|alcobas|cuartos|cuartos)", t)
    if match_hab:
        try:
            criterios["habitaciones_min"] = int(match_hab.group(1))
        except ValueError:
            pass

    # Baños (maneja "baños", "banos")
    match_banos = re.search(r"(\d+)\s+ba[ñn]os", t)
    if match_banos:
        try:
            criterios["banos_min"] = int(match_banos.group(1))
        except ValueError:
            pass

    # Área mínima (m2, metros)
    match_area = re.search(r"(\d+)\s*(m2|metros|metros cuadrados)", t)
    if match_area:
        try:
            criterios["area_min"] = int(match_area.group(1))
        except ValueError:
            pass

    # Parqueadero / garaje
    if "parqueadero" in t or "garaje" in t or "parqueo" in t:
        criterios["tiene_parqueadero"] = True

    # Piscina
    if "piscina" in t:
        criterios["tiene_piscina"] = True

    # Gimnasio
    if "gimnasio" in t or "gym" in t:
        criterios["tiene_gimnasio"] = True

    # Seguridad / portería
    if "seguridad" in t or "porteria" in t or "portería" in t or "vigilancia" in t:
        criterios["tiene_seguridad"] = True

    # Amoblado / semi amoblado
    if "totalmente amoblado" in t or "totalmente amueblado" in t or "amoblado" in t or "amueblado" in t:
        criterios["amoblado"] = True
    if "semi amoblado" in t or "semi-amoblado" in t:
        criterios["amoblado"] = True

    # Mascotas / pet friendly
    if "mascotas" in t or "pet friendly" in t or "aptos para mascotas" in t or "apto para mascotas" in t:
        criterios["mascotas"] = True

    # Balcón y terraza
    if "balcón" in t or "balcon" in t:
        criterios["balcon"] = True
    if "terraza" in t:
        criterios["terraza"] = True

    # Rango de precio expresado en "millones"
    # Ejemplos: "hasta 500 millones", "entre 300 y 600 millones", "de 200 a 400 millones"
    numeros_millones = re.findall(r"(\d+)\s*millones", t)
    valores = []
    for n in numeros_millones:
        try:
            valores.append(int(n) * 1_000_000)
        except ValueError:
            continue

    # Rango de precio expresado en notación tipo "1.5M - 2M", "3M - 4M", "más de 5M", "menos de 1M"
    # Primero rangos "X M - Y M"
    rangos_M = re.findall(r"(\d+(?:\.\d+)?)\s*M\s*-\s*(\d+(?:\.\d+)?)\s*M", t)
    for minimo, maximo in rangos_M:
        try:
            vmin = float(minimo) * 1_000_000
            vmax = float(maximo) * 1_000_000
            valores.append(vmin)
            valores.append(vmax)
        except ValueError:
            continue

    # "menos de XM" o "menos de X millones"
    match_menos_M = re.search(r"menos de\s*(\d+(?:\.\d+)?)\s*M", t)
    if match_menos_M:
        try:
            vmax = float(match_menos_M.group(1)) * 1_000_000
            valores.append(vmax)
        except ValueError:
            pass

    # "más de XM" o "mas de XM"
    match_mas_M = re.search(r"m[aá]s de\s*(\d+(?:\.\d+)?)\s*M", t)
    if match_mas_M:
        try:
            vmin = float(match_mas_M.group(1)) * 1_000_000
            valores.append(vmin)
        except ValueError:
            pass

    if valores:
        valores_ordenados = sorted(valores)
        # Heurística: si hay varios valores, tomamos el menor como precio_min y el mayor como precio_max
        if len(valores_ordenados) == 1:
            # Un solo valor: lo usamos como precio_max si no hay indicación de "más de" / "mas de"
            # (si el texto tenía "más de" o "mas de", ya habremos añadido ese valor como mínimo)
            if "mas de" in t or "más de" in t:
                criterios["precio_min"] = valores_ordenados[0]
            else:
                criterios["precio_max"] = valores_ordenados[0]
        else:
            criterios["precio_min"] = valores_ordenados[0]
            criterios["precio_max"] = valores_ordenados[-1]

    # Adjetivos de nivel de precio (económico, medio, alto, premium)
    # Mapeamos a los cuartiles si categorias_precio está disponible
    try:
        if modelo is not None and getattr(modelo, "categorias_precio", None):
            cats = modelo.categorias_precio
            # Normalizamos claves a minúsculas para comparaciones simples
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
        # Si algo falla al leer categorias_precio, continuamos con las demás reglas
        pass

    # Intentar detectar ciudad a partir de los valores existentes en el dataset
    try:
        if modelo is not None and modelo.df is not None and "ciudad" in modelo.df.columns:
            ciudades = [str(c) for c in modelo.df["ciudad"].dropna().unique().tolist()]
            for ciudad in ciudades:
                c_lower = ciudad.lower()
                # Coincidencia simple por nombre exacto dentro del texto
                if c_lower in t:
                    criterios["ciudad"] = ciudad
                    break
    except Exception:
        # Si algo falla al detectar ciudad, simplemente lo ignoramos
        pass

    return criterios


def inicializar_sistema():
    """
    Inicializa el sistema: sincroniza datos de WASI y entrena el modelo
    """
    global modelo, wasi_connector, ultima_sincronizacion, modelo_nlp
    
    print("="*70)
    print("INICIALIZANDO SISTEMA CON DATOS REALES DE WASI")
    print("="*70)
    
    # Crear conector de WASI
    wasi_connector = WasiConnector(ID_COMPANY, WASI_TOKEN)
    
    # Verificar si existe dataset reciente
    archivo_datos = 'data/datasets/inmuebles_wasi_real.csv'
    sincronizar = True
    
    if os.path.exists(archivo_datos):
        # Verificar antigüedad del archivo
        tiempo_modificacion = os.path.getmtime(archivo_datos)
        tiempo_actual = datetime.now().timestamp()
        horas_desde_actualizacion = (tiempo_actual - tiempo_modificacion) / 3600
        
        if horas_desde_actualizacion < 24:  # Menos de 24 horas
            print(f"\n✓ Dataset existente ({horas_desde_actualizacion:.1f} horas de antigüedad)")
            sincronizar = False
        else:
            print(f"\n⚠️ Dataset antiguo ({horas_desde_actualizacion:.1f} horas), sincronizando...")
    
    # Sincronizar datos si es necesario
    if sincronizar:
        print("\n📡 Sincronizando datos desde WASI...")
        df = wasi_connector.sincronizar_datos(
            archivo_salida=archivo_datos,
            max_inmuebles=1000
        )
        ultima_sincronizacion = datetime.now()
    else:
        print("\n📂 Usando dataset existente")
        ultima_sincronizacion = datetime.fromtimestamp(os.path.getmtime(archivo_datos))
    
    # Inicializar modelo
    print("\n🤖 Inicializando modelo de IA...")
    modelo = ModeloInmuebles()
    
    # Cargar dataset
    modelo.cargar_dataset(archivo_datos)
    modelo.preprocesar_datos()
    
    # Cargar o entrenar modelo
    archivo_modelo = 'data/models/modelo_wasi.pkl'
    if os.path.exists(archivo_modelo) and not sincronizar:
        print("📦 Cargando modelo pre-entrenado...")
        modelo.cargar_modelo(archivo_modelo)
    else:
        print("🎓 Entrenando modelo con datos de WASI...")
        modelo.crear_categorias_precio('precio')
        modelo.entrenar_modelo_clasificacion('categoria_precio')
        modelo.entrenar_clustering(n_clusters=5)
        modelo.guardar_modelo(archivo_modelo)
    
    # Inicializar base de datos para logging NLP
    try:
        init_db()
        print("\n✓ Tabla nlp_consultas verificada/creada en PostgreSQL")
    except Exception as e:
        print(f"\n⚠️ No se pudo inicializar la tabla nlp_consultas: {e}")

    print("\n✓ Sistema listo para recibir peticiones")
    print(f"✓ Última sincronización: {ultima_sincronizacion.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"✓ Total de inmuebles: {len(modelo.df)}")

    # Cargar modelo NLP si existe
    try:
        ruta_nlp = 'data/models/modelo_nlp_inmuebles.pkl'
        if os.path.exists(ruta_nlp):
            modelo_nlp = cargar_modelo_nlp(ruta_nlp)
            print(f"✓ Modelo NLP cargado desde: {ruta_nlp}")
        else:
            print("⚠️ No se encontró modelo NLP entrenado (modelo_nlp_inmuebles.pkl)")
    except Exception as e:
        print(f"⚠️ Error al cargar modelo NLP: {e}")


@app.route('/')
def home():
    """
    Endpoint raíz con información de la API
    """
    return jsonify({
        'nombre': 'API de Búsqueda de Inmuebles - WASI',
        'version': '2.0',
        'fuente_datos': 'WASI API',
        'ultima_sincronizacion': ultima_sincronizacion.isoformat() if ultima_sincronizacion else None,
        'total_inmuebles': len(modelo.df) if modelo else 0,
        'endpoints': {
            '/': 'Información de la API',
            '/estadisticas': 'Estadísticas del dataset',
            '/buscar': 'Buscar inmuebles (POST)',
            '/similares/<id>': 'Inmuebles similares',
            '/tipos': 'Tipos de inmuebles disponibles',
            '/ciudades': 'Ciudades disponibles',
            '/filtros-disponibles': 'Todos los filtros disponibles',
            '/sincronizar': 'Forzar sincronización con WASI (POST)',
            '/inmueble/<id>': 'Detalle de inmueble específico'
        }
    })


@app.route('/estadisticas', methods=['GET'])
def estadisticas():
    """
    Retorna estadísticas generales del dataset
    """
    try:
        df = modelo.df.copy()

        # Asegurar que columnas numéricas clave sean realmente numéricas
        for col in ['precio', 'area_total', 'habitaciones']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')

        stats = {
            'total_inmuebles': len(df),
            'ultima_sincronizacion': ultima_sincronizacion.isoformat() if ultima_sincronizacion else None,
            'precio_promedio': float(df['precio'].mean()) if 'precio' in df.columns else 0,
            'precio_minimo': float(df['precio'].min()) if 'precio' in df.columns else 0,
            'precio_maximo': float(df['precio'].max()) if 'precio' in df.columns else 0,
            'precio_mediana': float(df['precio'].median()) if 'precio' in df.columns else 0,
            'distribucion_tipos': df['tipo'].value_counts().to_dict() if 'tipo' in df.columns else {},
            'distribucion_ciudades': df['ciudad'].value_counts().to_dict() if 'ciudad' in df.columns else {},
            'habitaciones_promedio': float(df['habitaciones'].mean()) if 'habitaciones' in df.columns else 0,
            'area_promedio': float(df['area_total'].mean()) if 'area_total' in df.columns else 0
        }
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/buscar-nlp-chat', methods=['POST'])
def buscar_nlp_chat():
    """Búsqueda conversacional de inmuebles a partir de texto en lenguaje natural.

    Mantiene un contexto de búsqueda por session_id y acumula criterios entre turnos.

    Espera un JSON de entrada como:
    {
        "session_id": "usuario-123",
        "texto": "que tenga parqueadero",
        "reiniciar": false  # opcional, para resetear la conversación
    }
    """
    try:
        data = request.get_json()

        if not data or 'texto' not in data or 'session_id' not in data:
            return jsonify({'error': 'Debe enviar "session_id" y un campo "texto" con la descripción de lo que busca'}), 400

        session_id = str(data.get('session_id')).strip()
        if not session_id:
            return jsonify({'error': 'El campo "session_id" no puede estar vacío'}), 400

        texto = data.get('texto', '')
        reiniciar = bool(data.get('reiniciar', False))

        # Recuperar estado previo de la conversación
        estado_prev = {} if reiniciar else conversaciones_activas.get(session_id, {})
        criterios_previos = dict(estado_prev.get('criterios', {}))

        # 1) Inferir criterios del turno actual mediante reglas
        criterios_turno_reglas = parsear_texto_a_criterios(texto)

        # Criterios acumulados = anteriores + nuevos (los nuevos pueden sobrescribir)
        criterios_acumulados = dict(criterios_previos)
        for k, v in criterios_turno_reglas.items():
            criterios_acumulados[k] = v

        # 2) Complementar con modelo NLP entrenado (si está cargado)
        predicciones_nlp = {}
        if modelo_nlp is not None:
            try:
                predicciones_nlp = predecir_desde_texto(modelo_nlp, texto)
            except Exception as e:
                print(f"Error al predecir con modelo NLP (chat): {e}")

        # Combinar predicciones NLP con criterios acumulados
        if predicciones_nlp:
            # tipo_negocio desde 'operacion'
            if 'operacion' in predicciones_nlp and 'tipo_negocio' not in criterios_acumulados:
                op = str(predicciones_nlp['operacion']).strip().lower()
                if op == 'arriendo':
                    criterios_acumulados['tipo_negocio'] = 'Arriendo'
                elif op == 'venta':
                    criterios_acumulados['tipo_negocio'] = 'Venta'

            # ciudad
            if 'ciudad' in predicciones_nlp and 'ciudad' not in criterios_acumulados:
                criterios_acumulados['ciudad'] = predicciones_nlp['ciudad']

            # precio_rango -> precio_min / precio_max usando el mismo parser
            if 'precio_rango' in predicciones_nlp:
                rango_texto = str(predicciones_nlp['precio_rango'])
                criterios_precio = parsear_texto_a_criterios(rango_texto)
                for k in ['precio_min', 'precio_max']:
                    if k in criterios_precio and k not in criterios_acumulados:
                        criterios_acumulados[k] = criterios_precio[k]

            # parqueadero: 0,1,2... -> booleano tiene_parqueadero
            if 'parqueadero' in predicciones_nlp and 'tiene_parqueadero' not in criterios_acumulados:
                try:
                    num_parq = int(predicciones_nlp['parqueadero'])
                    if num_parq >= 1:
                        criterios_acumulados['tiene_parqueadero'] = True
                except ValueError:
                    pass

        if not criterios_acumulados:
            # Loggear consulta sin criterios claros
            try:
                guardar_consulta_nlp(
                    texto_usuario=texto,
                    criterios_inferidos=criterios_acumulados,
                    predicciones_nlp=predicciones_nlp,
                    filtros_relajados=[],
                    total_encontrados=0,
                    total_retornados=0,
                )
            except Exception as e:
                print(f"⚠️ Error al guardar consulta NLP (chat sin criterios): {e}")

            return jsonify({
                'mensaje': 'No se pudieron inferir criterios claros a partir del texto. Intenta ser más específico.',
                'session_id': session_id,
                'texto_original': texto,
                'criterios_turno': criterios_turno_reglas,
                'criterios_acumulados': criterios_acumulados,
                'predicciones_nlp': predicciones_nlp,
                'filtros_relajados': [],
                'total_encontrados': 0,
                'total_retornados': 0,
                'resultados': []
            }), 200

        # --- Búsqueda con relajación progresiva de filtros (misma lógica que /buscar-nlp) ---
        filtros_relajados = []

        def ejecutar_busqueda(crit):
            try:
                return modelo.categorizar_inmuebles(crit)
            except Exception:
                return modelo.df.copy() * 0  # DataFrame vacío en caso de error

        # 1) Intento inicial con todos los criterios acumulados
        criterios_busqueda = dict(criterios_acumulados)
        resultado = ejecutar_busqueda(criterios_busqueda)

        # 2) Si no hay resultados, relajar progresivamente filtros
        if len(resultado) == 0:
            # No relajamos 'tiene_parqueadero' para que, si el usuario lo pide, sea un filtro duro
            orden_relajacion = [
                ['precio_min', 'precio_max'],
                ['ciudad'],
                ['tipo_negocio'],
                ['amoblado'],
                ['mascotas'],
                ['balcon'],
                ['terraza'],
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
            # Ordenar resultados por similitud con el texto del turno actual
            try:
                df_tmp = resultado.copy()
                for col in ['titulo', 'descripcion', 'ciudad', 'zona']:
                    if col not in df_tmp.columns:
                        df_tmp[col] = ''
                textos_inmuebles = (
                    df_tmp['titulo'].fillna('').astype(str) + ' ' +
                    df_tmp['descripcion'].fillna('').astype(str) + ' ' +
                    df_tmp['ciudad'].fillna('').astype(str) + ' ' +
                    df_tmp['zona'].fillna('').astype(str)
                )

                corpus = [texto] + textos_inmuebles.tolist()
                vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2))
                tfidf_matrix = vectorizer.fit_transform(corpus)

                user_vec = tfidf_matrix[0]
                inmuebles_vecs = tfidf_matrix[1:]
                similitudes = inmuebles_vecs.dot(user_vec.T).toarray().ravel()

                df_tmp = df_tmp.copy()
                df_tmp['score_similitud'] = similitudes

                resultado_ordenado = df_tmp.sort_values(by='score_similitud', ascending=False)
            except Exception:
                resultado_ordenado = resultado

            resultado_limitado = resultado_ordenado.head(100)

            resultado_limitado = resultado_limitado.where(pd.notnull(resultado_limitado), None)
            resultado_limitado = resultado_limitado.replace({np.nan: None})

            if 'imagenes' in resultado_limitado.columns:
                def _parse_imagenes(value):
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

                resultado_limitado['imagenes'] = resultado_limitado['imagenes'].apply(_parse_imagenes)

            estadisticas_resultado = {}
            if 'precio' in resultado.columns:
                estadisticas_resultado = {
                    'precio_promedio': float(resultado['precio'].mean()),
                    'precio_minimo': float(resultado['precio'].min()),
                    'precio_maximo': float(resultado['precio'].max()),
                }

            if filtros_relajados:
                detalle_relajados = ", ".join(filtros_relajados)
                mensaje = (
                    f"No se encontraron inmuebles que cumplieran todos los criterios exactos, "
                    f"pero se relajaron los filtros [{detalle_relajados}] y se encontraron "
                    f"{len(resultado)} inmuebles (mostrando {len(resultado_limitado)})."
                )
            else:
                mensaje = (
                    f"Se encontraron {len(resultado)} inmuebles que coinciden con la descripción, "
                    f"mostrando {len(resultado_limitado)}."
                )

            # Determinar qué criterios cambiaron en este turno (dif entre previos y acumulados)
            criterios_turno = {}
            for k, v in criterios_acumulados.items():
                if k not in criterios_previos or criterios_previos.get(k) != v:
                    criterios_turno[k] = v

            # Actualizar estado de conversación en memoria
            conversaciones_activas[session_id] = {
                'criterios': dict(criterios_acumulados),
                'filtros_relajados': list(filtros_relajados),
            }

            # Loggear consulta con resultados
            try:
                guardar_consulta_nlp(
                    texto_usuario=texto,
                    criterios_inferidos=criterios_acumulados,
                    predicciones_nlp=predicciones_nlp,
                    filtros_relajados=filtros_relajados,
                    total_encontrados=len(resultado),
                    total_retornados=len(resultado_limitado),
                )
            except Exception as e:
                print(f"⚠️ Error al guardar consulta NLP (chat con resultados): {e}")

            return jsonify({
                'mensaje': mensaje,
                'session_id': session_id,
                'texto_original': texto,
                'criterios_turno': criterios_turno,
                'criterios_acumulados': criterios_acumulados,
                'predicciones_nlp': predicciones_nlp,
                'filtros_relajados': filtros_relajados,
                'total_encontrados': len(resultado),
                'total_retornados': len(resultado_limitado),
                'estadisticas': estadisticas_resultado,
                'resultados': resultado_limitado.to_dict('records')
            })
        else:
            # Determinar qué criterios cambiaron en este turno incluso si no hay resultados
            criterios_turno = {}
            for k, v in criterios_acumulados.items():
                if k not in criterios_previos or criterios_previos.get(k) != v:
                    criterios_turno[k] = v

            conversaciones_activas[session_id] = {
                'criterios': dict(criterios_acumulados),
                'filtros_relajados': list(filtros_relajados),
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
            except Exception as e:
                print(f"⚠️ Error al guardar consulta NLP (chat sin resultados): {e}")

            return jsonify({
                'mensaje': 'No se encontraron inmuebles que coincidan con la descripción proporcionada, incluso relajando filtros principales',
                'session_id': session_id,
                'texto_original': texto,
                'criterios_turno': criterios_turno,
                'criterios_acumulados': criterios_acumulados,
                'predicciones_nlp': predicciones_nlp,
                'filtros_relajados': filtros_relajados,
                'total_encontrados': 0,
                'total_retornados': 0,
                'resultados': []
            })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/buscar-nlp', methods=['POST'])
def buscar_nlp():
    """Búsqueda de inmuebles a partir de texto en lenguaje natural.

    Espera un JSON de entrada como:
    {
        "texto": "quiero un apartamento con buena iluminacion de 3 alcobas y 2 baños, con parqueadero"
    }
    """
    try:
        data = request.get_json()

        if not data or 'texto' not in data:
            return jsonify({'error': 'Debe enviar un campo "texto" con la descripción de lo que busca'}), 400

        texto = data.get('texto', '')

        # 1) Inferir criterios mediante reglas
        criterios_reglas = parsear_texto_a_criterios(texto)
        criterios = dict(criterios_reglas)  # copia

        # 2) Complementar con modelo NLP entrenado (si está cargado)
        predicciones_nlp = {}
        if modelo_nlp is not None:
            try:
                predicciones_nlp = predecir_desde_texto(modelo_nlp, texto)
            except Exception as e:
                print(f"Error al predecir con modelo NLP: {e}")

        # Combinar predicciones NLP con criterios (sin sobreescribir lo que ya fijaron las reglas)
        if predicciones_nlp:
            # tipo_negocio desde 'operacion'
            if 'operacion' in predicciones_nlp and 'tipo_negocio' not in criterios:
                op = str(predicciones_nlp['operacion']).strip().lower()
                if op == 'arriendo':
                    criterios['tipo_negocio'] = 'Arriendo'
                elif op == 'venta':
                    criterios['tipo_negocio'] = 'Venta'

            # ciudad
            if 'ciudad' in predicciones_nlp and 'ciudad' not in criterios:
                criterios['ciudad'] = predicciones_nlp['ciudad']

            # precio_rango -> precio_min / precio_max usando el mismo parser
            if 'precio_rango' in predicciones_nlp:
                rango_texto = str(predicciones_nlp['precio_rango'])
                criterios_precio = parsear_texto_a_criterios(rango_texto)
                for k in ['precio_min', 'precio_max']:
                    if k in criterios_precio and k not in criterios:
                        criterios[k] = criterios_precio[k]

            # parqueadero: 0,1,2... -> booleano tiene_parqueadero
            if 'parqueadero' in predicciones_nlp and 'tiene_parqueadero' not in criterios:
                try:
                    num_parq = int(predicciones_nlp['parqueadero'])
                    if num_parq >= 1:
                        criterios['tiene_parqueadero'] = True
                except ValueError:
                    pass

        if not criterios:
            # Loggear consulta sin criterios claros
            try:
                guardar_consulta_nlp(
                    texto_usuario=texto,
                    criterios_inferidos=criterios,
                    predicciones_nlp=predicciones_nlp,
                    filtros_relajados=[],
                    total_encontrados=0,
                    total_retornados=0,
                )
            except Exception as e:
                print(f"⚠️ Error al guardar consulta NLP (sin criterios): {e}")

            return jsonify({
                'mensaje': 'No se pudieron inferir criterios claros a partir del texto. Intenta ser más específico.',
                'texto_original': texto,
                'criterios_inferidos': criterios,
                'predicciones_nlp': predicciones_nlp,
                'total_encontrados': 0,
                'total_retornados': 0,
                'resultados': []
            }), 200

        # --- Búsqueda con relajación progresiva de filtros ---
        filtros_relajados = []

        def ejecutar_busqueda(crit):
            try:
                return modelo.categorizar_inmuebles(crit)
            except Exception:
                return modelo.df.copy() * 0  # DataFrame vacío en caso de error

        # 1) Intento inicial con todos los criterios inferidos
        resultado = ejecutar_busqueda(criterios)

        # 2) Si no hay resultados, relajar progresivamente filtros
        if len(resultado) == 0:
            # Definimos un orden de relajación de filtros, de más estrictos a menos críticos
            # Nota: no relajamos 'tiene_parqueadero' para respetar explícitamente este criterio
            orden_relajacion = [
                ['precio_min', 'precio_max'],
                ['ciudad'],
                ['tipo_negocio'],
                ['amoblado'],
                ['mascotas'],
                ['balcon'],
                ['terraza'],
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
                    # Nada que relajar en este grupo, seguir con el siguiente
                    continue

                resultado = ejecutar_busqueda(criterios_relajados)
                if len(resultado) > 0:
                    criterios = criterios_relajados
                    break

        if len(resultado) > 0:
            # Ordenar resultados por similitud con el texto original
            try:
                df_tmp = resultado.copy()
                # Construir texto representativo del inmueble
                for col in ['titulo', 'descripcion', 'ciudad', 'zona']:
                    if col not in df_tmp.columns:
                        df_tmp[col] = ''
                textos_inmuebles = (
                    df_tmp['titulo'].fillna('').astype(str) + ' ' +
                    df_tmp['descripcion'].fillna('').astype(str) + ' ' +
                    df_tmp['ciudad'].fillna('').astype(str) + ' ' +
                    df_tmp['zona'].fillna('').astype(str)
                )

                corpus = [texto] + textos_inmuebles.tolist()
                vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2))
                tfidf_matrix = vectorizer.fit_transform(corpus)

                # Similitud coseno entre el texto del usuario (índice 0) y cada inmueble (1:)
                # Producto punto ya que los vectores TF-IDF están normalizados
                user_vec = tfidf_matrix[0]
                inmuebles_vecs = tfidf_matrix[1:]
                similitudes = inmuebles_vecs.dot(user_vec.T).toarray().ravel()

                df_tmp = df_tmp.copy()
                df_tmp['score_similitud'] = similitudes

                # Ordenar por similitud descendente
                resultado_ordenado = df_tmp.sort_values(by='score_similitud', ascending=False)
            except Exception:
                # Si algo falla en el cálculo de similitud, usar el orden original
                resultado_ordenado = resultado

            resultado_limitado = resultado_ordenado.head(100)

            # Reemplazar NaN por None para evitar valores no válidos en JSON
            resultado_limitado = resultado_limitado.where(pd.notnull(resultado_limitado), None)
            resultado_limitado = resultado_limitado.replace({np.nan: None})

            # Normalizar la columna 'imagenes' para que siempre sea una lista JSON en la respuesta
            if 'imagenes' in resultado_limitado.columns:
                def _parse_imagenes(value):
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

                resultado_limitado['imagenes'] = resultado_limitado['imagenes'].apply(_parse_imagenes)

            estadisticas_resultado = {}
            if 'precio' in resultado.columns:
                estadisticas_resultado = {
                    'precio_promedio': float(resultado['precio'].mean()),
                    'precio_minimo': float(resultado['precio'].min()),
                    'precio_maximo': float(resultado['precio'].max()),
                }

            if filtros_relajados:
                detalle_relajados = ", ".join(filtros_relajados)
                mensaje = (
                    f"No se encontraron inmuebles que cumplieran todos los criterios exactos, "
                    f"pero se relajaron los filtros [{detalle_relajados}] y se encontraron "
                    f"{len(resultado)} inmuebles (mostrando {len(resultado_limitado)})."
                )
            else:
                mensaje = (
                    f"Se encontraron {len(resultado)} inmuebles que coinciden con la descripción, "
                    f"mostrando {len(resultado_limitado)}."
                )

            # Loggear consulta con resultados
            try:
                guardar_consulta_nlp(
                    texto_usuario=texto,
                    criterios_inferidos=criterios,
                    predicciones_nlp=predicciones_nlp,
                    filtros_relajados=filtros_relajados,
                    total_encontrados=len(resultado),
                    total_retornados=len(resultado_limitado),
                )
            except Exception as e:
                print(f"⚠️ Error al guardar consulta NLP (con resultados): {e}")

            return jsonify({
                'mensaje': mensaje,
                'texto_original': texto,
                'criterios_inferidos': criterios,
                'predicciones_nlp': predicciones_nlp,
                'filtros_relajados': filtros_relajados,
                'total_encontrados': len(resultado),
                'total_retornados': len(resultado_limitado),
                'estadisticas': estadisticas_resultado,
                'resultados': resultado_limitado.to_dict('records')
            })
        else:
            # Loggear consulta sin resultados
            try:
                guardar_consulta_nlp(
                    texto_usuario=texto,
                    criterios_inferidos=criterios,
                    predicciones_nlp=predicciones_nlp,
                    filtros_relajados=filtros_relajados,
                    total_encontrados=0,
                    total_retornados=0,
                )
            except Exception as e:
                print(f"⚠️ Error al guardar consulta NLP (sin resultados): {e}")

            return jsonify({
                'mensaje': 'No se encontraron inmuebles que coincidan con la descripción proporcionada, incluso relajando filtros principales',
                'texto_original': texto,
                'criterios_inferidos': criterios,
                'predicciones_nlp': predicciones_nlp,
                'filtros_relajados': filtros_relajados,
                'total_encontrados': 0,
                'total_retornados': 0,
                'resultados': []
            })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/buscar', methods=['POST'])
def buscar():
    """
    Busca inmuebles según criterios (búsqueda avanzada múltiple)
    POST /buscar
    Body (JSON):
    {
        "tipo": "Casa",
        "ciudad": "Bogotá",
        "habitaciones_min": 3,
        "precio_max": 500000000,
        "tiene_piscina": true
    }
    """
    try:
        criterios = request.get_json()
        
        if not criterios:
            return jsonify({'error': 'No se proporcionaron criterios de búsqueda'}), 400
        
        print(f"\n🔍 Búsqueda recibida: {criterios}")
        
        # Realizar búsqueda
        resultado = modelo.categorizar_inmuebles(criterios)
        
        # Convertir resultado a formato JSON
        if len(resultado) > 0:
            # Limitar a 100 resultados
            resultado_limitado = resultado.head(100)

            # Reemplazar NaN por None para evitar valores no válidos en JSON
            resultado_limitado = resultado_limitado.where(pd.notnull(resultado_limitado), None)
            resultado_limitado = resultado_limitado.replace({np.nan: None})
            
            # Calcular estadísticas de resultados
            estadisticas_resultado = {
                'precio_promedio': float(resultado['precio'].mean()),
                'precio_minimo': float(resultado['precio'].min()),
                'precio_maximo': float(resultado['precio'].max()),
            }
            
            return jsonify({
                'total_encontrados': len(resultado),
                'total_retornados': len(resultado_limitado),
                'criterios': criterios,
                'estadisticas': estadisticas_resultado,
                'resultados': resultado_limitado.to_dict('records')
            })
        else:
            return jsonify({
                'total_encontrados': 0,
                'total_retornados': 0,
                'criterios': criterios,
                'resultados': [],
                'mensaje': 'No se encontraron inmuebles con los criterios especificados'
            })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/similares/<int:inmueble_id>', methods=['GET'])
def similares(inmueble_id):
    """
    Encuentra inmuebles similares
    GET /similares/<id>?n=5
    """
    try:
        n_similares = request.args.get('n', default=5, type=int)
        
        if inmueble_id < 0 or inmueble_id >= len(modelo.df):
            return jsonify({'error': 'ID de inmueble inválido'}), 400
        
        # Obtener inmueble de referencia
        inmueble_ref = modelo.df.iloc[inmueble_id].to_dict()
        
        # Buscar similares
        similares_df = modelo.buscar_similares(inmueble_id, n_similares)
        
        return jsonify({
            'inmueble_referencia': inmueble_ref,
            'similares_encontrados': len(similares_df),
            'similares': similares_df.to_dict('records')
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/inmueble/<inmueble_id>', methods=['GET'])
def obtener_inmueble(inmueble_id):
    """
    Obtiene detalles de un inmueble específico por su ID de WASI
    GET /inmueble/<id>
    """
    try:
        # Buscar por ID en el DataFrame
        inmueble = modelo.df[modelo.df['id'] == inmueble_id]
        
        if len(inmueble) == 0:
            return jsonify({'error': 'Inmueble no encontrado'}), 404
        
        return jsonify(inmueble.iloc[0].to_dict())
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/tipos', methods=['GET'])
def tipos():
    """
    Retorna los tipos de inmuebles disponibles
    """
    try:
        if 'tipo' not in modelo.df.columns:
            return jsonify({'tipos': [], 'conteo': {}})

        # Eliminar NaN y asegurar que los tipos sean strings
        series_tipos = modelo.df['tipo'].dropna()
        tipos_disponibles = [str(t) for t in series_tipos.unique().tolist()]

        # Conteo sin NaN y con claves como string
        conteo_raw = series_tipos.value_counts().to_dict()
        conteo = {str(k): int(v) for k, v in conteo_raw.items()}

        return jsonify({
            'tipos': tipos_disponibles,
            'conteo': conteo
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/ciudades', methods=['GET'])
def ciudades():
    """
    Retorna las ciudades disponibles
    """
    try:
        if 'ciudad' not in modelo.df.columns:
            return jsonify({'ciudades': [], 'conteo': {}, 'precio_promedio': {}})

        # Eliminar NaN y asegurar tipos válidos
        df_ciudades = modelo.df.dropna(subset=['ciudad'])

        ciudades_disponibles = [str(c) for c in df_ciudades['ciudad'].unique().tolist()]

        conteo_raw = df_ciudades['ciudad'].value_counts().to_dict()
        conteo = {str(k): int(v) for k, v in conteo_raw.items()}

        # Precio promedio por ciudad (si existe columna precio)
        if 'precio' in df_ciudades.columns:
            precios = df_ciudades.copy()
            precios['precio'] = pd.to_numeric(precios['precio'], errors='coerce')
            precio_group = precios.groupby('ciudad')['precio'].mean().to_dict()
            precio_promedio = {str(k): float(v) for k, v in precio_group.items() if pd.notna(v)}
        else:
            precio_promedio = {}

        return jsonify({
            'ciudades': ciudades_disponibles,
            'conteo': conteo,
            'precio_promedio': precio_promedio
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/filtros-disponibles', methods=['GET'])
def filtros_disponibles():
    """
    Retorna todos los filtros disponibles para búsqueda
    """
    try:
        df = modelo.df

        # Helpers para listas sin NaN
        def lista_sin_nan(col):
            if col not in df.columns:
                return []
            return [str(v) for v in df[col].dropna().unique().tolist()]

        def lista_int_sin_nan(col):
            if col not in df.columns:
                return []
            serie = df[col].dropna().astype(str)
            # Normalizar valores tipo '>10', '10+', etc. manteniendo solo la parte numérica
            serie = serie.str.extract(r"(\d+)", expand=False)
            numeros = pd.to_numeric(serie, errors='coerce').dropna().unique().tolist()
            return [int(v) for v in sorted(numeros)]

        rangos_numericos = {}
        for col in ['precio', 'area_total', 'area_construida']:
            if col in df.columns:
                serie = pd.to_numeric(df[col], errors='coerce')
                serie = serie.dropna()
                if not serie.empty:
                    rangos_numericos[col] = {
                        'min': float(serie.min()),
                        'max': float(serie.max())
                    }

        filtros = {
            'tipos': lista_sin_nan('tipo'),
            'ciudades': lista_sin_nan('ciudad'),
            'zonas': lista_sin_nan('zona'),
            'tipo_negocio': lista_sin_nan('tipo_negocio'),
            'habitaciones': lista_int_sin_nan('habitaciones'),
            'banos': lista_int_sin_nan('banos'),
            'caracteristicas_booleanas': [
                'tiene_piscina',
                'tiene_gimnasio',
                'tiene_parqueadero',
                'tiene_ascensor',
                'tiene_seguridad'
            ],
            'rangos_numericos': rangos_numericos
        }
        return jsonify(filtros)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/sincronizar', methods=['POST'])
def sincronizar():
    """
    Fuerza una sincronización con WASI
    POST /sincronizar
    """
    try:
        print("\n🔄 Sincronización manual solicitada...")
        inicializar_sistema()
        
        return jsonify({
            'mensaje': 'Sincronización completada',
            'timestamp': datetime.now().isoformat(),
            'total_inmuebles': len(modelo.df)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/entrenar-nlp', methods=['POST'])
def entrenar_nlp_endpoint():
    """Endpoint interno para reentrenar el modelo NLP.

    Usa por defecto el dataset en PostgreSQL (tabla nlp_dataset_anotado) y,
    si falla, hace fallback al CSV local dataset_nlp_inmuebles_5000.csv.
    """
    global modelo_nlp

    try:
        origen = 'bd'
        try:
            df_nlp = cargar_dataset_nlp_desde_db()
        except Exception as e:
            print(f"⚠️ No se pudo cargar dataset NLP desde BD: {e}")
            origen = 'csv'
            df_nlp = cargar_dataset_nlp()

        total_filas = len(df_nlp)
        if total_filas == 0:
            return jsonify({'error': 'El dataset NLP está vacío'}), 400

        print("Entrenando modelos NLP desde endpoint /entrenar-nlp...")
        modelo_nlp_dic = entrenar_modelos(df_nlp)
        guardar_modelo_nlp(modelo_nlp_dic)

        # Recargar modelo en memoria
        modelo_nlp = modelo_nlp_dic

        return jsonify({
            'mensaje': 'Modelo NLP reentrenado correctamente',
            'origen_datos': origen,
            'total_filas': total_filas,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/openapi.yaml', methods=['GET'])
def openapi_spec():
    """Sirve el archivo de especificación OpenAPI para Swagger UI"""
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        return send_from_directory(base_dir, 'openapi_wasi.yaml', mimetype='application/yaml')
    except Exception as e:
        return jsonify({'error': f'No se pudo cargar openapi_wasi.yaml: {e}'}), 500


@app.route('/docs', methods=['GET'])
def swagger_ui():
    """Interfaz Swagger UI para probar la API"""
    html = """<!DOCTYPE html>
<html lang=\"es\">
  <head>
    <meta charset=\"UTF-8\" />
    <title>Swagger UI - API Inmuebles WASI</title>
    <link rel=\"stylesheet\" href=\"https://unpkg.com/swagger-ui-dist@5/swagger-ui.css\" />
    <style>
      body { margin: 0; padding: 0; }
      #swagger-ui { width: 100%; height: 100vh; }
    </style>
  </head>
  <body>
    <div id=\"swagger-ui\"></div>
    <script src=\"https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js\"></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: '/openapi.yaml',
          dom_id: '#swagger-ui',
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIBundle.SwaggerUIStandalonePreset
          ],
          layout: 'BaseLayout',
        });
      };
    </script>
  </body>
</html>"""
    return make_response(html)


if __name__ == '__main__':
    print("="*70)
    print("API DE BÚSQUEDA DE INMUEBLES - INTEGRACIÓN WASI")
    print("="*70)
    
    # Inicializar sistema
    inicializar_sistema()
    
    print("\n" + "="*70)
    print("SERVIDOR INICIADO")
    print("="*70)
    
    print("\nEndpoints disponibles:")
    print("  GET  http://localhost:5001/")
    print("  GET  http://localhost:5001/estadisticas")
    print("  POST http://localhost:5001/buscar")
    print("  GET  http://localhost:5001/similares/<id>")
    print("  GET  http://localhost:5001/tipos")
    print("  GET  http://localhost:5001/ciudades")
    print("  GET  http://localhost:5001/inmueble/<id>")
    print("  GET  http://localhost:5001/filtros-disponibles")
    print("  POST http://localhost:5001/sincronizar")
    
    print('\nEjemplo de búsqueda con curl:')
    print('  curl -X POST http://localhost:5001/buscar \\')
    print('    -H "Content-Type: application/json" \\')
    print('    -d \'{"tipo": "Apartamento", "ciudad": "Bogotá", "habitaciones_min": 2}\'')
    
    print("\n" + "="*70)
    print("🌐 Servidor listo para recibir peticiones desde tu frontend")
    print("="*70)
    
    # Iniciar servidor en puerto 5001 (HTTP)
    app.run(debug=True, host='0.0.0.0', port=5001)

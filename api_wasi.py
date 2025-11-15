"""
API REST para el modelo de inmuebles con integración WASI
Servidor Flask que expone endpoints para búsqueda de inmuebles con datos reales
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from modelo_inmuebles import ModeloInmuebles
from integrations.wasi.wasi_connector import WasiConnector
import pandas as pd
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Permitir CORS para desarrollo

# Configuración de WASI
ID_COMPANY = "493728"
WASI_TOKEN = "4kyL_tY1Q_e8yL_j0ju"

# Variables globales
modelo = None
wasi_connector = None
ultima_sincronizacion = None


def inicializar_sistema():
    """
    Inicializa el sistema: sincroniza datos de WASI y entrena el modelo
    """
    global modelo, wasi_connector, ultima_sincronizacion
    
    print("="*70)
    print("INICIALIZANDO SISTEMA CON DATOS REALES DE WASI")
    print("="*70)
    
    # Crear conector de WASI
    wasi_connector = WasiConnector(ID_COMPANY, WASI_TOKEN)
    
    # Verificar si existe dataset reciente
    archivo_datos = 'inmuebles_wasi_real.csv'
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
    archivo_modelo = 'modelo_wasi.pkl'
    if os.path.exists(archivo_modelo) and not sincronizar:
        print("📦 Cargando modelo pre-entrenado...")
        modelo.cargar_modelo(archivo_modelo)
    else:
        print("🎓 Entrenando modelo con datos de WASI...")
        modelo.crear_categorias_precio('precio')
        modelo.entrenar_modelo_clasificacion('categoria_precio')
        modelo.entrenar_clustering(n_clusters=5)
        modelo.guardar_modelo(archivo_modelo)
    
    print("\n✓ Sistema listo para recibir peticiones")
    print(f"✓ Última sincronización: {ultima_sincronizacion.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"✓ Total de inmuebles: {len(modelo.df)}")


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
        stats = {
            'total_inmuebles': len(modelo.df),
            'ultima_sincronizacion': ultima_sincronizacion.isoformat() if ultima_sincronizacion else None,
            'precio_promedio': float(modelo.df['precio'].mean()),
            'precio_minimo': float(modelo.df['precio'].min()),
            'precio_maximo': float(modelo.df['precio'].max()),
            'precio_mediana': float(modelo.df['precio'].median()),
            'distribucion_tipos': modelo.df['tipo'].value_counts().to_dict() if 'tipo' in modelo.df.columns else {},
            'distribucion_ciudades': modelo.df['ciudad'].value_counts().to_dict() if 'ciudad' in modelo.df.columns else {},
            'habitaciones_promedio': float(modelo.df['habitaciones'].mean()) if 'habitaciones' in modelo.df.columns else 0,
            'area_promedio': float(modelo.df['area_total'].mean()) if 'area_total' in modelo.df.columns else 0
        }
        return jsonify(stats)
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
        
        tipos_disponibles = modelo.df['tipo'].unique().tolist()
        conteo = modelo.df['tipo'].value_counts().to_dict()
        
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
            return jsonify({'ciudades': [], 'conteo': {}})
        
        ciudades_disponibles = modelo.df['ciudad'].unique().tolist()
        conteo = modelo.df['ciudad'].value_counts().to_dict()
        precio_promedio = modelo.df.groupby('ciudad')['precio'].mean().to_dict()
        
        return jsonify({
            'ciudades': ciudades_disponibles,
            'conteo': conteo,
            'precio_promedio': {k: float(v) for k, v in precio_promedio.items()}
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/filtros-disponibles', methods=['GET'])
def filtros_disponibles():
    """
    Retorna todos los filtros disponibles para búsqueda
    """
    try:
        filtros = {
            'tipos': modelo.df['tipo'].unique().tolist() if 'tipo' in modelo.df.columns else [],
            'ciudades': modelo.df['ciudad'].unique().tolist() if 'ciudad' in modelo.df.columns else [],
            'zonas': modelo.df['zona'].unique().tolist() if 'zona' in modelo.df.columns else [],
            'tipo_negocio': modelo.df['tipo_negocio'].unique().tolist() if 'tipo_negocio' in modelo.df.columns else [],
            'habitaciones': sorted(modelo.df['habitaciones'].unique().tolist()) if 'habitaciones' in modelo.df.columns else [],
            'banos': sorted(modelo.df['banos'].unique().tolist()) if 'banos' in modelo.df.columns else [],
            'caracteristicas_booleanas': [
                'tiene_piscina',
                'tiene_gimnasio',
                'tiene_parqueadero',
                'tiene_ascensor',
                'tiene_seguridad'
            ],
            'rangos_numericos': {
                'precio': {
                    'min': float(modelo.df['precio'].min()),
                    'max': float(modelo.df['precio'].max())
                } if 'precio' in modelo.df.columns else {},
                'area_total': {
                    'min': float(modelo.df['area_total'].min()),
                    'max': float(modelo.df['area_total'].max())
                } if 'area_total' in modelo.df.columns else {},
                'area_construida': {
                    'min': float(modelo.df['area_construida'].min()),
                    'max': float(modelo.df['area_construida'].max())
                } if 'area_construida' in modelo.df.columns else {}
            }
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
    print("  GET  http://localhost:5000/")
    print("  GET  http://localhost:5000/estadisticas")
    print("  POST http://localhost:5000/buscar")
    print("  GET  http://localhost:5000/similares/<id>")
    print("  GET  http://localhost:5000/tipos")
    print("  GET  http://localhost:5000/ciudades")
    print("  GET  http://localhost:5000/inmueble/<id>")
    print("  GET  http://localhost:5000/filtros-disponibles")
    print("  POST http://localhost:5000/sincronizar")
    
    print("\nEjemplo de búsqueda con curl:")
    print('  curl -X POST http://localhost:5000/buscar \\')
    print('    -H "Content-Type: application/json" \\')
    print('    -d \'{"tipo": "Apartamento", "ciudad": "Bogotá", "habitaciones_min": 2}\'')
    
    print("\n" + "="*70)
    print("🌐 Servidor listo para recibir peticiones desde tu frontend")
    print("="*70)
    
    # Iniciar servidor
    app.run(debug=True, host='0.0.0.0', port=5000)

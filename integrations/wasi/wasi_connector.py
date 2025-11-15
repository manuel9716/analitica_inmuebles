"""
Conector para la API de WASI
Obtiene datos reales de inmuebles desde WASI

CREDENCIALES WASI:
==================
API:
- ID Company: 493728
- WASI Token: 4kyL_tY1Q_e8yL_j0ju
- Documentación: https://api.wasi.co

Acceso Web:
- URL: https://wasi.co
- Usuario: Contacto@facilinmobiliaria.co
- Clave: 5599441inmo

URL Personalizada:
- https://facilinmobiliaria.com/main-inmueble-info-[id].htm
"""

import requests
import pandas as pd
from typing import Dict, List, Optional
import json
from datetime import datetime
import time

class WasiConnector:
    """
    Conector para la API de WASI
    Documentación: https://api.wasi.co
    
    Credenciales configuradas:
    - ID Company: 493728
    - Token: 4kyL_tY1Q_e8yL_j0ju
    """
    
    def __init__(self, id_company: str, wasi_token: str):
        """
        Inicializa el conector con credenciales de WASI
        
        Args:
            id_company: ID de la compañía en WASI (493728)
            wasi_token: Token de autenticación de WASI (4kyL_tY1Q_e8yL_j0ju)
        """
        self.id_company = id_company
        self.wasi_token = wasi_token
        self.base_url = "https://api.wasi.co/v1"
        self.headers = {
            'Content-Type': 'application/json'
        }
        
    def _make_request(self, endpoint: str, params: Dict = None, method: str = 'POST') -> Dict:
        """
        Realiza una petición a la API de WASI
        
        Args:
            endpoint: Endpoint de la API
            params: Parámetros de la petición
            method: Método HTTP (POST o GET)
            
        Returns:
            Respuesta de la API en formato dict
        """
        if params is None:
            params = {}
        
        # Agregar credenciales a los parámetros
        params['id_company'] = self.id_company
        params['wasi_token'] = self.wasi_token
        
        url = f"{self.base_url}/{endpoint}"
        
        try:
            if method.upper() == 'POST':
                response = requests.post(url, headers=self.headers, json=params, timeout=30)
            else:
                response = requests.get(url, headers=self.headers, params=params, timeout=30)
            
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"❌ Error en petición a WASI: {e}")
            print(f"   URL: {url}")
            print(f"   Método: {method}")
            return None
    
    def obtener_inmuebles(self, limit: int = 100, offset: int = 0, 
                          tipo_negocio: str = None) -> List[Dict]:
        """
        Obtiene lista de inmuebles desde WASI
        
        Args:
            limit: Número máximo de inmuebles a obtener
            offset: Offset para paginación
            tipo_negocio: 'venta', 'arriendo' o None para todos
            
        Returns:
            Lista de inmuebles
        """
        print(f"📡 Obteniendo inmuebles de WASI (limit={limit}, offset={offset})...")
        
        # Según la documentación actual, el listado de propiedades se obtiene
        # vía /v1/property/search usando parámetros skip/take
        params = {
            'skip': offset,
            'take': limit
        }
        
        if tipo_negocio:
            # La doc de WASI maneja filtros; aquí dejamos tipo_negocio como
            # posible filtro adicional si aplica en tu cuenta.
            params['business_type'] = tipo_negocio
        
        response = self._make_request('property/search', params, method='GET')
        
        if not response:
            print("❌ Respuesta vacía o error al llamar a WASI")
            return []

        # La respuesta de property/search tiene la forma:
        # { "total": 2, "0": {..}, "1": {..}, "status": "success" }
        # Construimos la lista de inmuebles tomando solo las claves numéricas
        inmuebles = []
        for key, value in response.items():
            if isinstance(key, str) and key.isdigit():
                inmuebles.append(value)
        
        if inmuebles:
            print(f"✓ Obtenidos {len(inmuebles)} inmuebles")
            return inmuebles
        else:
            print("❌ No se pudieron obtener inmuebles (sin claves numéricas en la respuesta)")
            print(f"Respuesta cruda: {json.dumps(response)[:500]}")
            return []
    
    def obtener_todos_los_inmuebles(self, max_inmuebles: int = 1000) -> List[Dict]:
        """
        Obtiene todos los inmuebles disponibles con paginación
        
        Args:
            max_inmuebles: Número máximo de inmuebles a obtener
            
        Returns:
            Lista completa de inmuebles
        """
        print(f"🔄 Obteniendo hasta {max_inmuebles} inmuebles de WASI...")
        
        todos_inmuebles = []
        offset = 0
        limit = 100  # WASI generalmente permite hasta 100 por petición
        
        while len(todos_inmuebles) < max_inmuebles:
            inmuebles = self.obtener_inmuebles(limit=limit, offset=offset)
            
            if not inmuebles:
                break
            
            todos_inmuebles.extend(inmuebles)
            
            if len(inmuebles) < limit:
                # No hay más inmuebles
                break
            
            offset += limit
            time.sleep(0.5)  # Pausa para no saturar la API
        
        print(f"✓ Total obtenidos: {len(todos_inmuebles)} inmuebles")
        return todos_inmuebles[:max_inmuebles]
    
    def obtener_detalle_inmueble(self, id_inmueble: str) -> Dict:
        """
        Obtiene el detalle completo de un inmueble específico
        
        Args:
            id_inmueble: ID del inmueble en WASI
            
        Returns:
            Diccionario con detalles del inmueble
        """
        params = {'id_property': id_inmueble}
        response = self._make_request('property', params)
        
        if response and 'data' in response and len(response['data']) > 0:
            return response['data'][0]
        return None
    
    def convertir_a_dataframe(self, inmuebles: List[Dict]) -> pd.DataFrame:
        """
        Convierte lista de inmuebles de WASI a DataFrame de pandas
        
        Args:
            inmuebles: Lista de inmuebles desde WASI
            
        Returns:
            DataFrame con los inmuebles procesados
        """
        if not inmuebles:
            return pd.DataFrame()
        
        print("🔧 Procesando datos de WASI...")
        
        # Extraer campos relevantes
        datos_procesados = []
        
        for inmueble in inmuebles:
            try:
                dato = {
                    # Identificación
                    'id': inmueble.get('id_property', ''),
                    'codigo': inmueble.get('code', ''),
                    
                    # Tipo y negocio
                    'tipo': inmueble.get('type', ''),
                    'tipo_negocio': inmueble.get('business_type', ''),
                    
                    # Ubicación
                    'ciudad': inmueble.get('city', ''),
                    'zona': inmueble.get('zone', ''),
                    'barrio': inmueble.get('neighborhood', ''),
                    'direccion': inmueble.get('address', ''),
                    'latitud': inmueble.get('latitude', 0),
                    'longitud': inmueble.get('longitude', 0),
                    
                    # Características
                    'habitaciones': inmueble.get('bedrooms', 0),
                    'banos': inmueble.get('bathrooms', 0),
                    'garajes': inmueble.get('garages', 0),
                    'area_construida': inmueble.get('constructed_area', 0),
                    'area_privada': inmueble.get('private_area', 0),
                    'area_total': inmueble.get('total_area', 0),
                    'estrato': inmueble.get('stratum', 0),
                    'antiguedad': inmueble.get('age', 0),
                    'piso': inmueble.get('floor', 0),
                    
                    # Precios
                    'precio': inmueble.get('sale_price', 0) or inmueble.get('rent_price', 0),
                    'precio_venta': inmueble.get('sale_price', 0),
                    'precio_arriendo': inmueble.get('rent_price', 0),
                    'administracion': inmueble.get('administration_price', 0),
                    
                    # Estado
                    'estado': inmueble.get('status', ''),
                    'disponible': inmueble.get('is_active', True),
                    
                    # Descripción
                    'titulo': inmueble.get('title', ''),
                    'descripcion': inmueble.get('description', ''),
                    
                    # URL
                    'url': f"https://facilinmobiliaria.com/main-inmueble-info-{inmueble.get('id_property', '')}.htm",
                    
                    # Fecha
                    'fecha_actualizacion': inmueble.get('updated_at', ''),
                }
                
                # Características adicionales (amenidades)
                caracteristicas = inmueble.get('features', [])
                if caracteristicas:
                    dato['tiene_piscina'] = any('piscina' in str(c).lower() for c in caracteristicas)
                    dato['tiene_gimnasio'] = any('gimnasio' in str(c).lower() for c in caracteristicas)
                    dato['tiene_parqueadero'] = any('parqueadero' in str(c).lower() or 'garaje' in str(c).lower() for c in caracteristicas)
                    dato['tiene_ascensor'] = any('ascensor' in str(c).lower() for c in caracteristicas)
                    dato['tiene_seguridad'] = any('seguridad' in str(c).lower() or 'vigilancia' in str(c).lower() for c in caracteristicas)
                else:
                    dato['tiene_piscina'] = False
                    dato['tiene_gimnasio'] = False
                    dato['tiene_parqueadero'] = False
                    dato['tiene_ascensor'] = False
                    dato['tiene_seguridad'] = False
                
                datos_procesados.append(dato)
                
            except Exception as e:
                print(f"⚠️ Error procesando inmueble {inmueble.get('id_property', 'unknown')}: {e}")
                continue
        
        df = pd.DataFrame(datos_procesados)
        print(f"✓ DataFrame creado con {len(df)} inmuebles")
        
        return df
    
    def sincronizar_datos(self, archivo_salida: str = 'inmuebles_wasi.csv', 
                          max_inmuebles: int = 1000) -> pd.DataFrame:
        """
        Sincroniza datos desde WASI y los guarda en CSV
        
        Args:
            archivo_salida: Nombre del archivo CSV de salida
            max_inmuebles: Número máximo de inmuebles a sincronizar
            
        Returns:
            DataFrame con los datos sincronizados
        """
        print("="*70)
        print("SINCRONIZACIÓN DE DATOS DESDE WASI")
        print("="*70)
        
        # Obtener inmuebles
        inmuebles = self.obtener_todos_los_inmuebles(max_inmuebles=max_inmuebles)
        
        if not inmuebles:
            print("❌ No se obtuvieron inmuebles")
            return pd.DataFrame()
        
        # Convertir a DataFrame
        df = self.convertir_a_dataframe(inmuebles)
        
        # Guardar en CSV
        df.to_csv(archivo_salida, index=False)
        print(f"\n✓ Datos guardados en: {archivo_salida}")
        
        # Mostrar resumen
        print("\n📊 RESUMEN DE SINCRONIZACIÓN")
        print("="*70)
        print(f"Total de inmuebles: {len(df)}")
        print(f"\nDistribución por tipo:")
        print(df['tipo'].value_counts())
        print(f"\nDistribución por ciudad:")
        print(df['ciudad'].value_counts())

        # Asegurar que 'precio' sea numérico para calcular la media
        try:
            precios_numericos = pd.to_numeric(df['precio'], errors='coerce')
            if precios_numericos.notna().any():
                print(f"\nPrecio promedio: ${precios_numericos.mean():,.2f}")
            else:
                print("\nPrecio promedio: N/A (no hay valores numéricos válidos en 'precio')")
        except Exception as e:
            print(f"\n⚠️ No se pudo calcular el precio promedio: {e}")
        
        return df


def sincronizar_wasi():
    """
    Función principal para sincronizar datos desde WASI
    """
    # Credenciales de WASI
    ID_COMPANY = "493728"
    WASI_TOKEN = "4kyL_tY1Q_e8yL_j0ju"
    
    # Crear conector
    connector = WasiConnector(ID_COMPANY, WASI_TOKEN)
    
    # Sincronizar datos
    df = connector.sincronizar_datos(
        archivo_salida='inmuebles_wasi_real.csv',
        max_inmuebles=1000
    )
    
    return df


if __name__ == "__main__":
    # Ejecutar sincronización
    df = sincronizar_wasi()
    
    if len(df) > 0:
        print("\n🎉 ¡Sincronización completada exitosamente!")
        print("\nPróximos pasos:")
        print("  1. Usa 'inmuebles_wasi_real.csv' en tu modelo")
        print("  2. Ejecuta 'python3 api_wasi.py' para iniciar la API con datos reales")
    else:
        print("\n❌ Error en la sincronización")

"""
Configuración centralizada de credenciales WASI
Este archivo contiene todas las credenciales necesarias para conectar con WASI
"""

# ============================================================================
# CREDENCIALES API WASI
# ============================================================================

# Credenciales para la API REST de WASI
WASI_API_CONFIG = {
    'id_company': '493728',
    'wasi_token': '4kyL_tY1Q_e8yL_j0ju',
    'base_url': 'https://api.wasi.co/v1',
    'documentacion': 'https://api.wasi.co'
}

# ============================================================================
# CREDENCIALES ACCESO WEB WASI
# ============================================================================

# Credenciales para acceso web a WASI.co
WASI_WEB_CONFIG = {
    'url': 'https://wasi.co',
    'usuario': 'Contacto@facilinmobiliaria.co',
    'clave': '5599441inmo'
}

# ============================================================================
# CONFIGURACIÓN URL PERSONALIZADA
# ============================================================================

# URL personalizada para inmuebles
WASI_URL_CONFIG = {
    'url_base': 'https://facilinmobiliaria.com',
    'url_template': 'https://facilinmobiliaria.com/main-inmueble-info-{id}.htm',
    'url_pattern': 'main-inmueble-info-[id].htm'
}

# ============================================================================
# CONFIGURACIÓN DE SINCRONIZACIÓN
# ============================================================================

# Configuración para sincronización de datos
SYNC_CONFIG = {
    'max_inmuebles_por_sincronizacion': 1000,
    'intervalo_sincronizacion_horas': 24,
    'archivo_salida_default': 'inmuebles_wasi_real.csv',
    'archivo_modelo_default': 'modelo_wasi.pkl',
    'timeout_request_segundos': 30,
    'pausa_entre_requests_segundos': 0.5
}

# ============================================================================
# FUNCIONES HELPER
# ============================================================================

def obtener_url_inmueble(id_inmueble: str) -> str:
    """
    Genera la URL personalizada para un inmueble
    
    Args:
        id_inmueble: ID del inmueble en WASI
        
    Returns:
        URL completa del inmueble
    """
    return WASI_URL_CONFIG['url_template'].format(id=id_inmueble)


def obtener_credenciales_api() -> dict:
    """
    Retorna las credenciales de la API de WASI
    
    Returns:
        Diccionario con id_company y wasi_token
    """
    return {
        'id_company': WASI_API_CONFIG['id_company'],
        'wasi_token': WASI_API_CONFIG['wasi_token']
    }


def obtener_credenciales_web() -> dict:
    """
    Retorna las credenciales de acceso web a WASI
    
    Returns:
        Diccionario con usuario y clave
    """
    return {
        'usuario': WASI_WEB_CONFIG['usuario'],
        'clave': WASI_WEB_CONFIG['clave']
    }


# ============================================================================
# INFORMACIÓN DEL SISTEMA
# ============================================================================

def mostrar_configuracion():
    """
    Muestra la configuración actual del sistema
    """
    print("="*70)
    print("CONFIGURACIÓN WASI")
    print("="*70)
    
    print("\n📡 API WASI:")
    print(f"  ID Company: {WASI_API_CONFIG['id_company']}")
    print(f"  Token: {WASI_API_CONFIG['wasi_token'][:10]}...")
    print(f"  URL Base: {WASI_API_CONFIG['base_url']}")
    print(f"  Documentación: {WASI_API_CONFIG['documentacion']}")
    
    print("\n🌐 Acceso Web:")
    print(f"  URL: {WASI_WEB_CONFIG['url']}")
    print(f"  Usuario: {WASI_WEB_CONFIG['usuario']}")
    print(f"  Clave: {'*' * len(WASI_WEB_CONFIG['clave'])}")
    
    print("\n🔗 URL Personalizada:")
    print(f"  Base: {WASI_URL_CONFIG['url_base']}")
    print(f"  Template: {WASI_URL_CONFIG['url_template']}")
    
    print("\n⚙️  Configuración de Sincronización:")
    print(f"  Max inmuebles: {SYNC_CONFIG['max_inmuebles_por_sincronizacion']}")
    print(f"  Intervalo: {SYNC_CONFIG['intervalo_sincronizacion_horas']} horas")
    print(f"  Archivo salida: {SYNC_CONFIG['archivo_salida_default']}")
    print(f"  Archivo modelo: {SYNC_CONFIG['archivo_modelo_default']}")
    
    print("\n" + "="*70)


if __name__ == "__main__":
    # Mostrar configuración cuando se ejecuta directamente
    mostrar_configuracion()
    
    # Ejemplos de uso
    print("\n📝 EJEMPLOS DE USO:")
    print("\nImportar credenciales:")
    print("  from config_wasi import obtener_credenciales_api")
    print("  creds = obtener_credenciales_api()")
    print(f"  # {obtener_credenciales_api()}")
    
    print("\nGenerar URL de inmueble:")
    print("  from config_wasi import obtener_url_inmueble")
    print("  url = obtener_url_inmueble('12345')")
    print(f"  # {obtener_url_inmueble('12345')}")

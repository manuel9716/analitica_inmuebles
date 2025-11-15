# 🔌 Integración con WASI - Guía Completa

Esta guía explica cómo usar el sistema con datos reales de WASI y cómo conectarlo con tu frontend.

## 📋 Índice

1. [Configuración Inicial](#configuración-inicial)
2. [Sincronizar Datos de WASI](#sincronizar-datos-de-wasi)
3. [Iniciar API con Datos Reales](#iniciar-api-con-datos-reales)
4. [Conectar desde Frontend](#conectar-desde-frontend)
5. [Ejemplos de Uso](#ejemplos-de-uso)
6. [Solución de Problemas](#solución-de-problemas)

---

## 🚀 Configuración Inicial

### Credenciales de WASI

Las credenciales ya están configuradas en el sistema:

```python
ID_COMPANY = "493728"
WASI_TOKEN = "4kyL_tY1Q_e8yL_j0ju"
```

### Instalación de Dependencias

```bash
# Si aún no las has instalado
pip3 install -r requirements.txt

# Instalar Flask y Flask-CORS para la API
pip3 install flask flask-cors
```

---

## 📡 Sincronizar Datos de WASI

### Opción 1: Sincronización Manual

```bash
# Ejecutar script de sincronización
python3 wasi_connector.py
```

**Esto hará:**
1. Conectarse a la API de WASI
2. Descargar hasta 1000 inmuebles
3. Procesar y limpiar los datos
4. Guardar en `inmuebles_wasi_real.csv`

**Salida esperada:**
```
📡 Obteniendo inmuebles de WASI...
✓ Obtenidos 100 inmuebles
✓ Total obtenidos: 1000 inmuebles
✓ DataFrame creado con 1000 inmuebles
✓ Datos guardados en: inmuebles_wasi_real.csv

📊 RESUMEN DE SINCRONIZACIÓN
Total de inmuebles: 1000
```

### Opción 2: Sincronización Automática

La API sincroniza automáticamente si:
- No existe el archivo de datos
- El archivo tiene más de 24 horas

---

## 🌐 Iniciar API con Datos Reales

### Paso 1: Iniciar el Servidor

```bash
python3 api_wasi.py
```

**El servidor hará:**
1. Verificar si hay datos recientes de WASI
2. Sincronizar si es necesario
3. Cargar o entrenar el modelo de IA
4. Iniciar servidor en `http://localhost:5000`

**Salida esperada:**
```
INICIALIZANDO SISTEMA CON DATOS REALES DE WASI
📡 Sincronizando datos desde WASI...
✓ Total obtenidos: 1000 inmuebles
🤖 Inicializando modelo de IA...
✓ Sistema listo para recibir peticiones

SERVIDOR INICIADO
🌐 Servidor listo para recibir peticiones desde tu frontend
```

### Paso 2: Verificar que Funciona

Abre tu navegador en: `http://localhost:5000`

Deberías ver:
```json
{
  "nombre": "API de Búsqueda de Inmuebles - WASI",
  "version": "2.0",
  "fuente_datos": "WASI API",
  "total_inmuebles": 1000,
  "endpoints": { ... }
}
```

---

## 💻 Conectar desde Frontend

### Endpoints Disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Información de la API |
| GET | `/estadisticas` | Estadísticas generales |
| **POST** | **`/buscar`** | **Búsqueda avanzada (principal)** |
| GET | `/similares/<id>` | Inmuebles similares |
| GET | `/tipos` | Tipos de inmuebles |
| GET | `/ciudades` | Ciudades disponibles |
| GET | `/filtros-disponibles` | Todos los filtros |
| GET | `/inmueble/<id>` | Detalle de inmueble |
| POST | `/sincronizar` | Forzar sincronización |

### Ejemplo JavaScript (Fetch API)

```javascript
// Búsqueda avanzada - LA FUNCIÓN PRINCIPAL
async function buscarInmuebles(criterios) {
  const response = await fetch('http://localhost:5000/buscar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(criterios)
  });
  
  const data = await response.json();
  return data;
}

// Uso
const criterios = {
  tipo: 'Apartamento',
  ciudad: 'Bogotá',
  habitaciones_min: 3,
  precio_max: 500000000,
  tiene_piscina: true
};

const resultado = await buscarInmuebles(criterios);
console.log(`Encontrados: ${resultado.total_encontrados} inmuebles`);
console.log(resultado.resultados); // Array de inmuebles
```

### Ejemplo React

```jsx
import React, { useState } from 'react';

function BuscadorInmuebles() {
  const [criterios, setCriterios] = useState({
    tipo: '',
    ciudad: '',
    habitaciones_min: '',
    precio_max: ''
  });
  
  const [resultados, setResultados] = useState([]);

  const buscar = async () => {
    const response = await fetch('http://localhost:5000/buscar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(criterios)
    });
    
    const data = await response.json();
    setResultados(data.resultados);
  };

  return (
    <div>
      <h1>Buscador de Inmuebles</h1>
      
      <input 
        placeholder="Tipo"
        onChange={(e) => setCriterios({...criterios, tipo: e.target.value})}
      />
      
      <input 
        placeholder="Ciudad"
        onChange={(e) => setCriterios({...criterios, ciudad: e.target.value})}
      />
      
      <button onClick={buscar}>Buscar</button>
      
      <div>
        {resultados.map(inmueble => (
          <div key={inmueble.id}>
            <h3>{inmueble.titulo}</h3>
            <p>Precio: ${inmueble.precio?.toLocaleString()}</p>
            <a href={inmueble.url}>Ver detalles</a>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Ejemplo Vue.js

```vue
<template>
  <div>
    <h1>Buscador de Inmuebles</h1>
    
    <input v-model="criterios.tipo" placeholder="Tipo">
    <input v-model="criterios.ciudad" placeholder="Ciudad">
    <button @click="buscar">Buscar</button>
    
    <div v-for="inmueble in resultados" :key="inmueble.id">
      <h3>{{ inmueble.titulo }}</h3>
      <p>Precio: ${{ inmueble.precio?.toLocaleString() }}</p>
      <a :href="inmueble.url">Ver detalles</a>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      criterios: {
        tipo: '',
        ciudad: ''
      },
      resultados: []
    }
  },
  methods: {
    async buscar() {
      const response = await fetch('http://localhost:5000/buscar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.criterios)
      });
      
      const data = await response.json();
      this.resultados = data.resultados;
    }
  }
}
</script>
```

---

## 📝 Ejemplos de Uso

### 1. Búsqueda Simple

```javascript
const criterios = {
  tipo: 'Casa',
  ciudad: 'Medellín'
};

const resultado = await buscarInmuebles(criterios);
```

### 2. Búsqueda Avanzada (Múltiples Criterios)

```javascript
const criterios = {
  tipo: 'Apartamento',
  ciudad: 'Bogotá',
  habitaciones_min: 3,
  banos_min: 2,
  precio_min: 200000000,
  precio_max: 500000000,
  tiene_piscina: true,
  tiene_gimnasio: true,
  tiene_parqueadero: true
};

const resultado = await buscarInmuebles(criterios);
```

### 3. Obtener Filtros Disponibles

```javascript
const response = await fetch('http://localhost:5000/filtros-disponibles');
const filtros = await response.json();

console.log('Tipos:', filtros.tipos);
console.log('Ciudades:', filtros.ciudades);
console.log('Rango de precios:', filtros.rangos_numericos.precio);
```

### 4. Obtener Inmuebles Similares

```javascript
const inmuebleId = 123;
const response = await fetch(`http://localhost:5000/similares/${inmuebleId}?n=5`);
const data = await response.json();

console.log('Inmueble de referencia:', data.inmueble_referencia);
console.log('Similares:', data.similares);
```

### 5. Forzar Sincronización

```javascript
const response = await fetch('http://localhost:5000/sincronizar', {
  method: 'POST'
});

const data = await response.json();
console.log('Sincronización completada:', data.mensaje);
```

---

## 🔧 Criterios de Búsqueda Soportados

### Campos Exactos
- `tipo`: Tipo de inmueble (Casa, Apartamento, etc.)
- `ciudad`: Ciudad
- `zona`: Zona de la ciudad
- `tipo_negocio`: 'Venta' o 'Arriendo'
- `habitaciones`: Número exacto de habitaciones
- `banos`: Número exacto de baños

### Rangos Numéricos
- `precio_min` / `precio_max`: Rango de precio
- `habitaciones_min` / `habitaciones_max`: Rango de habitaciones
- `banos_min` / `banos_max`: Rango de baños
- `area_total_min` / `area_total_max`: Rango de área

### Características Booleanas
- `tiene_piscina`: true/false
- `tiene_gimnasio`: true/false
- `tiene_parqueadero`: true/false
- `tiene_ascensor`: true/false
- `tiene_seguridad`: true/false

---

## 🔄 Flujo Completo

```
1. Usuario ingresa criterios en el frontend
   ↓
2. Frontend envía POST a /buscar con criterios
   ↓
3. API busca en datos de WASI usando IA
   ↓
4. API retorna resultados + estadísticas
   ↓
5. Frontend muestra resultados al usuario
```

---

## ⚠️ Solución de Problemas

### Error: "Connection refused"

**Problema:** El servidor no está corriendo

**Solución:**
```bash
python3 api_wasi.py
```

### Error: "CORS policy"

**Problema:** El frontend no puede acceder a la API

**Solución:** La API ya tiene CORS habilitado. Verifica que estés usando `http://localhost:5000`

### Error: "No se pudieron obtener inmuebles"

**Problema:** Error conectando con WASI

**Solución:**
1. Verifica las credenciales en `wasi_connector.py`
2. Verifica tu conexión a internet
3. Revisa la documentación de WASI: https://api.wasi.co

### Dataset vacío

**Problema:** No hay datos sincronizados

**Solución:**
```bash
# Sincronizar manualmente
python3 wasi_connector.py
```

---

## 📊 Estructura de Respuesta

### Respuesta de Búsqueda

```json
{
  "total_encontrados": 45,
  "total_retornados": 45,
  "criterios": {
    "tipo": "Casa",
    "ciudad": "Bogotá"
  },
  "estadisticas": {
    "precio_promedio": 350000000,
    "precio_minimo": 200000000,
    "precio_maximo": 500000000
  },
  "resultados": [
    {
      "id": "12345",
      "tipo": "Casa",
      "ciudad": "Bogotá",
      "habitaciones": 3,
      "banos": 2,
      "precio": 350000000,
      "url": "https://facilinmobiliaria.com/main-inmueble-info-12345.htm",
      "titulo": "Casa en venta en Bogotá",
      ...
    }
  ]
}
```

---

## 🎯 Resumen Rápido

```bash
# 1. Sincronizar datos de WASI
python3 wasi_connector.py

# 2. Iniciar API
python3 api_wasi.py

# 3. Desde tu frontend, hacer peticiones a:
# http://localhost:5000/buscar
```

**¡Listo! Tu frontend ya puede buscar inmuebles reales de WASI con IA.** 🎉

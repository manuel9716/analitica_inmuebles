# 🌐 Guía de Conexión Frontend - API Lista

## ✅ Estado: API Funcionando

**Servidor activo en:** `http://localhost:5001`

La API está corriendo con 200 inmuebles de ejemplo y lista para recibir peticiones desde tu frontend.

---

## 🚀 Conexión Rápida

### JavaScript Vanilla / React / Vue / Angular

```javascript
// URL base de la API
const API_URL = 'http://localhost:5001';

// Función principal de búsqueda
async function buscarInmuebles(criterios) {
  const response = await fetch(`${API_URL}/buscar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(criterios)
  });
  
  const data = await response.json();
  return data;
}

// Ejemplo de uso
const resultado = await buscarInmuebles({
  tipo: 'Casa',
  habitaciones: 3,
  precio_max: 300000
});

console.log(`Encontrados: ${resultado.total_encontrados} inmuebles`);
console.log(resultado.resultados); // Array de inmuebles
```

---

## 📋 Endpoints Disponibles

### 1. Información de la API
```javascript
GET http://localhost:5001/
```

**Respuesta:**
```json
{
  "nombre": "API de Análisis de Inmuebles",
  "version": "1.0",
  "endpoints": { ... }
}
```

### 2. Búsqueda Avanzada (PRINCIPAL) ⭐
```javascript
POST http://localhost:5001/buscar
Content-Type: application/json

{
  "tipo": "Casa",
  "habitaciones": 3,
  "precio_max": 300000,
  "tiene_jardin": true
}
```

**Respuesta:**
```json
{
  "total_encontrados": 13,
  "total_retornados": 13,
  "criterios": { ... },
  "resultados": [
    {
      "id": 38,
      "tipo": "Casa",
      "ubicacion": "Suburbio",
      "habitaciones": 3,
      "banos": 2,
      "area_m2": 132.4,
      "precio": 157000.0,
      "tiene_jardin": false,
      ...
    }
  ]
}
```

### 3. Estadísticas
```javascript
GET http://localhost:5001/estadisticas
```

### 4. Tipos Disponibles
```javascript
GET http://localhost:5001/tipos
```

### 5. Ubicaciones Disponibles
```javascript
GET http://localhost:5001/ubicaciones
```

### 6. Inmuebles Similares
```javascript
GET http://localhost:5001/similares/50?n=5
```

### 7. Filtros Disponibles
```javascript
GET http://localhost:5001/filtros-disponibles
```

---

## 💻 Ejemplos Completos

### Ejemplo 1: React Component

```jsx
import React, { useState, useEffect } from 'react';

function BuscadorInmuebles() {
  const [criterios, setCriterios] = useState({
    tipo: '',
    habitaciones: '',
    precio_max: ''
  });
  
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tipos, setTipos] = useState([]);

  // Cargar tipos disponibles al montar
  useEffect(() => {
    fetch('http://localhost:5001/tipos')
      .then(res => res.json())
      .then(data => setTipos(data.tipos))
      .catch(err => console.error(err));
  }, []);

  // Función de búsqueda
  const buscar = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:5001/buscar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(criterios)
      });
      
      const data = await response.json();
      setResultados(data.resultados);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="buscador-inmuebles">
      <h1>Buscador de Inmuebles</h1>
      
      {/* Formulario */}
      <div className="form">
        <select 
          value={criterios.tipo}
          onChange={(e) => setCriterios({...criterios, tipo: e.target.value})}
        >
          <option value="">Tipo de inmueble</option>
          {tipos.map(tipo => (
            <option key={tipo} value={tipo}>{tipo}</option>
          ))}
        </select>

        <input 
          type="number"
          placeholder="Habitaciones"
          value={criterios.habitaciones}
          onChange={(e) => setCriterios({...criterios, habitaciones: e.target.value})}
        />

        <input 
          type="number"
          placeholder="Precio máximo"
          value={criterios.precio_max}
          onChange={(e) => setCriterios({...criterios, precio_max: e.target.value})}
        />

        <button onClick={buscar} disabled={loading}>
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {/* Resultados */}
      <div className="resultados">
        <h2>Resultados: {resultados.length}</h2>
        {resultados.map(inmueble => (
          <div key={inmueble.id} className="inmueble-card">
            <h3>{inmueble.tipo} en {inmueble.ubicacion}</h3>
            <p>Habitaciones: {inmueble.habitaciones}</p>
            <p>Baños: {inmueble.banos}</p>
            <p>Área: {inmueble.area_m2} m²</p>
            <p className="precio">${inmueble.precio?.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BuscadorInmuebles;
```

### Ejemplo 2: Vue.js Component

```vue
<template>
  <div class="buscador-inmuebles">
    <h1>Buscador de Inmuebles</h1>
    
    <div class="form">
      <select v-model="criterios.tipo">
        <option value="">Tipo de inmueble</option>
        <option v-for="tipo in tipos" :key="tipo" :value="tipo">
          {{ tipo }}
        </option>
      </select>
      
      <input v-model="criterios.habitaciones" type="number" placeholder="Habitaciones">
      <input v-model="criterios.precio_max" type="number" placeholder="Precio máximo">
      
      <button @click="buscar" :disabled="loading">
        {{ loading ? 'Buscando...' : 'Buscar' }}
      </button>
    </div>
    
    <div class="resultados">
      <h2>Resultados: {{ resultados.length }}</h2>
      <div v-for="inmueble in resultados" :key="inmueble.id" class="inmueble-card">
        <h3>{{ inmueble.tipo }} en {{ inmueble.ubicacion }}</h3>
        <p>Habitaciones: {{ inmueble.habitaciones }}</p>
        <p>Baños: {{ inmueble.banos }}</p>
        <p>Área: {{ inmueble.area_m2 }} m²</p>
        <p class="precio">${{ inmueble.precio?.toLocaleString() }}</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      criterios: {
        tipo: '',
        habitaciones: '',
        precio_max: ''
      },
      resultados: [],
      tipos: [],
      loading: false
    }
  },
  mounted() {
    this.cargarTipos();
  },
  methods: {
    async cargarTipos() {
      const response = await fetch('http://localhost:5001/tipos');
      const data = await response.json();
      this.tipos = data.tipos;
    },
    async buscar() {
      this.loading = true;
      
      try {
        const response = await fetch('http://localhost:5001/buscar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.criterios)
        });
        
        const data = await response.json();
        this.resultados = data.resultados;
      } catch (error) {
        console.error('Error:', error);
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>
```

### Ejemplo 3: HTML + JavaScript Puro

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Buscador de Inmuebles</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .form { margin: 20px 0; }
        .form input, .form select, .form button { margin: 5px; padding: 10px; }
        .inmueble-card { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .precio { font-size: 20px; font-weight: bold; color: #2ecc71; }
    </style>
</head>
<body>
    <h1>Buscador de Inmuebles</h1>
    
    <div class="form">
        <select id="tipo">
            <option value="">Tipo de inmueble</option>
        </select>
        <input type="number" id="habitaciones" placeholder="Habitaciones">
        <input type="number" id="precio_max" placeholder="Precio máximo">
        <button onclick="buscar()">Buscar</button>
    </div>
    
    <div id="resultados"></div>

    <script>
        const API_URL = 'http://localhost:5001';

        // Cargar tipos al iniciar
        async function cargarTipos() {
            const res = await fetch(`${API_URL}/tipos`);
            const data = await res.json();
            
            const select = document.getElementById('tipo');
            data.tipos.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo;
                option.textContent = tipo;
                select.appendChild(option);
            });
        }

        // Buscar inmuebles
        async function buscar() {
            const criterios = {
                tipo: document.getElementById('tipo').value,
                habitaciones: document.getElementById('habitaciones').value,
                precio_max: document.getElementById('precio_max').value
            };
            
            // Remover valores vacíos
            Object.keys(criterios).forEach(key => {
                if (!criterios[key]) delete criterios[key];
            });
            
            const res = await fetch(`${API_URL}/buscar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(criterios)
            });
            
            const data = await res.json();
            mostrarResultados(data.resultados);
        }

        // Mostrar resultados
        function mostrarResultados(resultados) {
            const div = document.getElementById('resultados');
            div.innerHTML = `<h2>Encontrados: ${resultados.length} inmuebles</h2>`;
            
            resultados.forEach(inmueble => {
                div.innerHTML += `
                    <div class="inmueble-card">
                        <h3>${inmueble.tipo} en ${inmueble.ubicacion}</h3>
                        <p>Habitaciones: ${inmueble.habitaciones} | Baños: ${inmueble.banos}</p>
                        <p>Área: ${inmueble.area_m2} m²</p>
                        <p class="precio">$${inmueble.precio?.toLocaleString()}</p>
                    </div>
                `;
            });
        }

        // Inicializar
        cargarTipos();
    </script>
</body>
</html>
```

---

## 🔍 Criterios de Búsqueda Soportados

### Campos Exactos
- `tipo`: "Casa", "Apartamento", "Duplex", "Penthouse"
- `ubicacion`: "Centro", "Norte", "Sur", "Este", "Oeste", etc.
- `habitaciones`: Número exacto
- `banos`: Número exacto

### Rangos
- `habitaciones_min` / `habitaciones_max`
- `precio_min` / `precio_max`
- `area_m2_min` / `area_m2_max`

### Booleanos
- `tiene_jardin`: true/false
- `tiene_piscina`: true/false
- `tiene_gimnasio`: true/false
- `tiene_seguridad`: true/false
- `cerca_transporte`: true/false
- `cerca_escuelas`: true/false

---

## ✅ Servidor Corriendo

El servidor está activo y listo para recibir peticiones:

```
✓ URL: http://localhost:5001
✓ Dataset: 200 inmuebles
✓ Modelo: Entrenado y cargado
✓ CORS: Habilitado
```

**¡Puedes empezar a desarrollar tu frontend ahora mismo!** 🚀

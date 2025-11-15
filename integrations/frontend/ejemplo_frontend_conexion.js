/**
 * Ejemplo de conexión desde Frontend (React/Vue/Angular/Vanilla JS)
 * Muestra cómo consumir la API de búsqueda de inmuebles con datos reales de WASI
 */

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const API_BASE_URL = 'http://localhost:5000';

// ============================================================================
// FUNCIONES DE BÚSQUEDA
// ============================================================================

/**
 * Búsqueda avanzada de inmuebles (la opción 5 que mencionaste)
 * Esta es la función principal que usarás desde tu frontend
 */
async function buscarInmuebles(criterios) {
  try {
    const response = await fetch(`${API_BASE_URL}/buscar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(criterios)
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en búsqueda:', error);
    throw error;
  }
}

/**
 * Obtener filtros disponibles para mostrar en el formulario
 */
async function obtenerFiltrosDisponibles() {
  try {
    const response = await fetch(`${API_BASE_URL}/filtros-disponibles`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error obteniendo filtros:', error);
    throw error;
  }
}

/**
 * Obtener estadísticas generales
 */
async function obtenerEstadisticas() {
  try {
    const response = await fetch(`${API_BASE_URL}/estadisticas`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    throw error;
  }
}

/**
 * Obtener inmuebles similares
 */
async function obtenerSimilares(inmuebleId, cantidad = 5) {
  try {
    const response = await fetch(`${API_BASE_URL}/similares/${inmuebleId}?n=${cantidad}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error obteniendo similares:', error);
    throw error;
  }
}

/**
 * Obtener detalle de un inmueble específico
 */
async function obtenerDetalleInmueble(inmuebleId) {
  try {
    const response = await fetch(`${API_BASE_URL}/inmueble/${inmuebleId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error obteniendo detalle:', error);
    throw error;
  }
}

// ============================================================================
// EJEMPLOS DE USO
// ============================================================================

/**
 * EJEMPLO 1: Búsqueda básica de apartamentos en Bogotá
 */
async function ejemplo1_BusquedaBasica() {
  console.log('=== EJEMPLO 1: Búsqueda Básica ===');
  
  const criterios = {
    tipo: 'Apartamento',
    ciudad: 'Bogotá'
  };

  const resultado = await buscarInmuebles(criterios);
  
  console.log(`Encontrados: ${resultado.total_encontrados} inmuebles`);
  console.log(`Precio promedio: $${resultado.estadisticas.precio_promedio.toLocaleString()}`);
  console.log('Primeros 5 resultados:', resultado.resultados.slice(0, 5));
  
  return resultado;
}

/**
 * EJEMPLO 2: Búsqueda avanzada con múltiples criterios
 */
async function ejemplo2_BusquedaAvanzada() {
  console.log('=== EJEMPLO 2: Búsqueda Avanzada ===');
  
  const criterios = {
    tipo: 'Casa',
    ciudad: 'Medellín',
    habitaciones_min: 3,
    banos_min: 2,
    precio_max: 500000000, // 500 millones COP
    tiene_piscina: true,
    tiene_parqueadero: true
  };

  const resultado = await buscarInmuebles(criterios);
  
  console.log(`Encontrados: ${resultado.total_encontrados} inmuebles`);
  console.log('Resultados:', resultado.resultados);
  
  return resultado;
}

/**
 * EJEMPLO 3: Búsqueda por rango de precio
 */
async function ejemplo3_BusquedaPorPrecio() {
  console.log('=== EJEMPLO 3: Búsqueda por Precio ===');
  
  const criterios = {
    precio_min: 200000000, // 200 millones
    precio_max: 400000000, // 400 millones
    tipo_negocio: 'Venta'
  };

  const resultado = await buscarInmuebles(criterios);
  
  console.log(`Encontrados: ${resultado.total_encontrados} inmuebles`);
  
  return resultado;
}

/**
 * EJEMPLO 4: Cargar filtros disponibles para el formulario
 */
async function ejemplo4_CargarFiltros() {
  console.log('=== EJEMPLO 4: Cargar Filtros ===');
  
  const filtros = await obtenerFiltrosDisponibles();
  
  console.log('Tipos disponibles:', filtros.tipos);
  console.log('Ciudades disponibles:', filtros.ciudades);
  console.log('Rango de precios:', filtros.rangos_numericos.precio);
  
  return filtros;
}

// ============================================================================
// EJEMPLO COMPLETO PARA REACT
// ============================================================================

/**
 * Componente React de ejemplo
 */
const EjemploReactComponent = `
import React, { useState, useEffect } from 'react';

function BuscadorInmuebles() {
  const [criterios, setCriterios] = useState({
    tipo: '',
    ciudad: '',
    habitaciones_min: '',
    precio_max: ''
  });
  
  const [resultados, setResultados] = useState([]);
  const [filtros, setFiltros] = useState(null);
  const [loading, setLoading] = useState(false);

  // Cargar filtros disponibles al montar el componente
  useEffect(() => {
    fetch('http://localhost:5000/filtros-disponibles')
      .then(res => res.json())
      .then(data => setFiltros(data))
      .catch(err => console.error(err));
  }, []);

  // Función de búsqueda
  const buscar = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/buscar', {
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
    <div>
      <h1>Buscador de Inmuebles</h1>
      
      {/* Formulario de búsqueda */}
      <div>
        <select 
          value={criterios.tipo}
          onChange={(e) => setCriterios({...criterios, tipo: e.target.value})}
        >
          <option value="">Seleccione tipo</option>
          {filtros?.tipos.map(tipo => (
            <option key={tipo} value={tipo}>{tipo}</option>
          ))}
        </select>

        <select 
          value={criterios.ciudad}
          onChange={(e) => setCriterios({...criterios, ciudad: e.target.value})}
        >
          <option value="">Seleccione ciudad</option>
          {filtros?.ciudades.map(ciudad => (
            <option key={ciudad} value={ciudad}>{ciudad}</option>
          ))}
        </select>

        <input 
          type="number"
          placeholder="Habitaciones mínimas"
          value={criterios.habitaciones_min}
          onChange={(e) => setCriterios({...criterios, habitaciones_min: e.target.value})}
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
      <div>
        <h2>Resultados: {resultados.length}</h2>
        {resultados.map(inmueble => (
          <div key={inmueble.id} style={{border: '1px solid #ccc', padding: '10px', margin: '10px'}}>
            <h3>{inmueble.titulo}</h3>
            <p>Tipo: {inmueble.tipo}</p>
            <p>Ciudad: {inmueble.ciudad}</p>
            <p>Habitaciones: {inmueble.habitaciones}</p>
            <p>Precio: ${inmueble.precio?.toLocaleString()}</p>
            <a href={inmueble.url} target="_blank">Ver detalles</a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BuscadorInmuebles;
`;

// ============================================================================
// EJEMPLO PARA VANILLA JAVASCRIPT (HTML + JS)
// ============================================================================

const EjemploVanillaJS = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Buscador de Inmuebles</title>
</head>
<body>
    <h1>Buscador de Inmuebles</h1>
    
    <form id="formBusqueda">
        <select id="tipo" name="tipo">
            <option value="">Tipo de inmueble</option>
        </select>
        
        <select id="ciudad" name="ciudad">
            <option value="">Ciudad</option>
        </select>
        
        <input type="number" id="habitaciones_min" placeholder="Habitaciones mínimas">
        <input type="number" id="precio_max" placeholder="Precio máximo">
        
        <button type="submit">Buscar</button>
    </form>
    
    <div id="resultados"></div>

    <script>
        const API_URL = 'http://localhost:5000';

        // Cargar filtros al iniciar
        async function cargarFiltros() {
            const res = await fetch(\`\${API_URL}/filtros-disponibles\`);
            const filtros = await res.json();
            
            // Llenar select de tipos
            const selectTipo = document.getElementById('tipo');
            filtros.tipos.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo;
                option.textContent = tipo;
                selectTipo.appendChild(option);
            });
            
            // Llenar select de ciudades
            const selectCiudad = document.getElementById('ciudad');
            filtros.ciudades.forEach(ciudad => {
                const option = document.createElement('option');
                option.value = ciudad;
                option.textContent = ciudad;
                selectCiudad.appendChild(option);
            });
        }

        // Buscar inmuebles
        document.getElementById('formBusqueda').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const criterios = {
                tipo: document.getElementById('tipo').value,
                ciudad: document.getElementById('ciudad').value,
                habitaciones_min: document.getElementById('habitaciones_min').value,
                precio_max: document.getElementById('precio_max').value
            };
            
            // Remover valores vacíos
            Object.keys(criterios).forEach(key => {
                if (!criterios[key]) delete criterios[key];
            });
            
            const res = await fetch(\`\${API_URL}/buscar\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(criterios)
            });
            
            const data = await res.json();
            mostrarResultados(data.resultados);
        });

        // Mostrar resultados
        function mostrarResultados(resultados) {
            const div = document.getElementById('resultados');
            div.innerHTML = \`<h2>Encontrados: \${resultados.length} inmuebles</h2>\`;
            
            resultados.forEach(inmueble => {
                div.innerHTML += \`
                    <div style="border: 1px solid #ccc; padding: 10px; margin: 10px;">
                        <h3>\${inmueble.titulo}</h3>
                        <p>Tipo: \${inmueble.tipo}</p>
                        <p>Ciudad: \${inmueble.ciudad}</p>
                        <p>Precio: $\${inmueble.precio?.toLocaleString()}</p>
                        <a href="\${inmueble.url}" target="_blank">Ver detalles</a>
                    </div>
                \`;
            });
        }

        // Inicializar
        cargarFiltros();
    </script>
</body>
</html>
`;

// ============================================================================
// EXPORTAR FUNCIONES
// ============================================================================

// Para usar en módulos ES6
export {
  buscarInmuebles,
  obtenerFiltrosDisponibles,
  obtenerEstadisticas,
  obtenerSimilares,
  obtenerDetalleInmueble
};

// Para Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    buscarInmuebles,
    obtenerFiltrosDisponibles,
    obtenerEstadisticas,
    obtenerSimilares,
    obtenerDetalleInmueble
  };
}

// Imprimir ejemplos de código
console.log('=== EJEMPLO REACT ===');
console.log(EjemploReactComponent);
console.log('\n=== EJEMPLO VANILLA JS ===');
console.log(EjemploVanillaJS);

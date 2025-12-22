# 📘 Documentación Completa - Busco Fácil

**Plataforma de búsqueda inteligente de inmuebles con IA**

**Versión:** 1.0
**Última actualización:** Diciembre 2025

---

## 📋 Índice

1. [¿Qué es Busco Fácil?](#qué-es-busco-fácil)
2. [Funcionalidades Principales](#funcionalidades-principales)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [API Endpoints Completos](#api-endpoints-completos)
5. [Autenticación y Seguridad](#autenticación-y-seguridad)
6. [Base de Datos](#base-de-datos)
7. [Integraciones](#integraciones)
8. [Guía de Uso](#guía-de-uso)

---

## 🏠 ¿Qué es Busco Fácil?

**Busco Fácil** es una plataforma web moderna e inteligente para la búsqueda de propiedades inmobiliarias en Colombia (principalmente Cali y Valle del Cauca). La aplicación utiliza inteligencia artificial y procesamiento de lenguaje natural para entender las necesidades del usuario y mostrar los inmuebles más relevantes.

### Propósito

Facilitar la búsqueda de propiedades permitiendo a los usuarios:
- Buscar inmuebles usando lenguaje natural conversacional
- Usar búsqueda por voz
- Comparar propiedades lado a lado
- Agendar visitas
- Guardar favoritos
- Ver historial de búsquedas

### Características Destacadas

- **Chat con IA:** Interfaz conversacional que entiende lenguaje natural
- **Búsqueda por Voz:** Compatible con dispositivos móviles
- **Selección Múltiple:** Permite comparar hasta varios inmuebles
- **Síntesis de Voz:** Lee las respuestas en voz alta
- **Diseño Responsive:** Funciona en móviles, tablets y desktop
- **Sistema de Favoritos:** Guarda y organiza propiedades de interés
- **Historial Inteligente:** Recupera búsquedas anteriores con un clic

---

## 🎯 Funcionalidades Principales

### 1. Sistema de Búsqueda

#### Búsqueda por Texto Natural
**¿Para qué sirve?**
Permite al usuario escribir lo que busca de manera natural, sin necesidad de filtros complejos.

**Ejemplo de uso:**
```
"Apartamento en Pance, 3 habitaciones, entre 300 y 600 millones"
```

El sistema interpreta automáticamente:
- **Ubicación:** Pance
- **Tipo:** Apartamento
- **Habitaciones:** 3
- **Rango de precio:** $300,000,000 - $600,000,000

#### Búsqueda por Voz
**¿Para qué sirve?**
Facilita la búsqueda en dispositivos móviles o cuando el usuario prefiere hablar.

**Proceso:**
1. Usuario mantiene presionado el botón del micrófono
2. Habla su consulta
3. El sistema convierte voz a texto
4. Procesa la búsqueda automáticamente

#### Búsqueda con IA (NLP)
**¿Para qué sirve?**
Utiliza procesamiento de lenguaje natural avanzado para entender consultas complejas y contextuales.

**Características:**
- Entiende sinónimos y jerga local
- Interpreta múltiples criterios simultáneamente
- Aprende de búsquedas anteriores

### 2. Sistema de Selección y Refinamiento

**¿Para qué sirve?**
Permite al usuario seleccionar inmuebles de interés y refinar su búsqueda progresivamente.

**Flujo de uso:**
1. Usuario hace una búsqueda inicial
2. Selecciona 2-3 inmuebles que le interesan
3. Escribe: "Muéstrame más como estos pero con piscina"
4. El sistema filtra solo entre los seleccionados

**Beneficios:**
- Refinamiento progresivo
- No pierde el contexto de búsqueda
- Ahorra tiempo en búsquedas iterativas

### 3. Favoritos

**¿Para qué sirve?**
Guarda inmuebles de interés para revisarlos más tarde.

**Características:**
- Agregar/quitar con un clic
- Agregar notas personales a cada favorito
- Sincronización en la nube
- Acceso desde cualquier dispositivo

### 4. Historial de Búsquedas

**¿Para qué sirve?**
Permite recuperar búsquedas anteriores con todos sus resultados.

**Características:**
- Guarda búsqueda, filtros y resultados
- Recuperación instantánea
- Eliminar búsquedas individuales
- Limpiar todo el historial

### 5. Sistema de Citas

**¿Para qué sirve?**
Agenda visitas a inmuebles directamente desde la plataforma.

**Características:**
- Seleccionar fecha y horario preferido
- Envío automático de emails de confirmación
- Ver citas próximas
- Cancelar o reprogramar citas
- Integración con calendario

### 6. Soporte al Cliente

**¿Para qué sirve?**
Sistema de tickets para reportar problemas o hacer consultas.

**Características:**
- Crear tickets de soporte
- Categorización por tipo (técnico, consulta, sugerencia)
- Priorización (baja, media, alta, urgente)
- Seguimiento del estado
- Historial de tickets

### 7. Autenticación Completa

**¿Para qué sirve?**
Sistema de registro, login y recuperación de contraseña.

**Características:**
- Registro con verificación de email obligatoria
- Login seguro
- Recuperación de contraseña con código temporal
- Gestión de perfil de usuario
- Configuración personalizada

---

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico

**Frontend:**
- Next.js 13 (React)
- TypeScript
- Tailwind CSS
- Shadcn/ui
- Framer Motion

**Backend:**
- Supabase (PostgreSQL)
- Edge Functions (Deno)
- Row Level Security (RLS)

**Integraciones:**
- Resend (Emails transaccionales)
- APIs de inmobiliarias (Wasi, MetroCuadrado)
- Web Speech API (Voz)

### Estructura de Carpetas

```
project/
├── app/                    # Páginas Next.js
│   ├── api/               # API routes
│   ├── auth/              # Páginas de autenticación
│   ├── appointments/      # Gestión de citas
│   ├── favorites/         # Favoritos
│   ├── profile/           # Perfil de usuario
│   └── search-history/    # Historial
├── components/            # Componentes React
│   ├── auth/             # Auth dialogs
│   ├── chat/             # Chat interface
│   ├── listings/         # Tarjetas de inmuebles
│   └── ui/               # Componentes base
├── lib/                   # Lógica de negocio
│   ├── services/         # Servicios
│   ├── supabase/         # Cliente Supabase
│   └── types.ts          # TypeScript types
└── supabase/
    ├── functions/        # Edge Functions
    └── migrations/       # Migraciones DB
```

---

## 📡 API Endpoints Completos

### Base URL

```
https://[PROYECTO_ID].supabase.co/functions/v1
```

---

## 🏠 INMUEBLES (Públicos - Sin Autenticación)

### 1. Búsqueda de Inmuebles

#### `GET /listings-search`

**¿Para qué sirve?**
Buscar inmuebles con filtros específicos usando query parameters.

**Método de consumo:**
```javascript
const params = new URLSearchParams({
  location: 'Cali',
  zone: 'Pance',
  type: 'apartment',
  priceMin: '300000000',
  priceMax: '600000000',
  rooms: '3',
  bathrooms: '2',
  features: 'Piscina,Parqueadero',
  sort: 'matching',
  page: '1',
  size: '20'
});

const response = await fetch(
  `${baseUrl}/listings-search?${params}`,
  {
    headers: {
      'Content-Type': 'application/json'
    }
  }
);

const data = await response.json();
// data.items → Array de inmuebles
// data.total → Total de resultados
```

**Parámetros disponibles:**
- `location` - Ciudad (ej: Cali, Jamundí)
- `zone` - Zona específica (ej: Pance, Ciudad Jardín)
- `type` - Tipo: apartment, house, commercial, land
- `priceMin` / `priceMax` - Rango de precio en COP
- `areaMin` / `areaMax` - Área en m²
- `rooms` - Habitaciones (separadas por coma: "2,3,4")
- `bathrooms` - Baños (separados por coma)
- `features` - Características (separadas por coma)
- `sort` - Orden: matching, price-asc, price-desc, recent, area-asc, area-desc
- `page` - Número de página (default: 1)
- `size` - Resultados por página (default: 20)

**Respuesta:**
```json
{
  "items": [
    {
      "id": "1",
      "title": "Apartamento Moderno en Pance",
      "location": "Cali",
      "zone": "Pance",
      "price": 450000000,
      "area": 98,
      "rooms": 3,
      "bathrooms": 2,
      "type": "apartment",
      "features": ["Piscina", "Parqueadero"],
      "images": ["url1", "url2"],
      "matching": 0.95,
      "coordinates": { "lat": 3.3686, "lng": -76.5389 }
    }
  ],
  "total": 15,
  "page": 1,
  "size": 20
}
```

---

#### `POST /listings-search`

**¿Para qué sirve?**
Buscar inmuebles con filtros complejos enviados en el body (recomendado para búsquedas avanzadas).

**Método de consumo:**
```javascript
const response = await fetch(`${baseUrl}/listings-search`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    filters: {
      location: 'Cali',
      zone: 'Pance',
      type: 'apartment',
      price: { min: 300000000, max: 600000000 },
      area: { min: 80, max: 120 },
      rooms: [2, 3, 4],
      bathrooms: [2, 3],
      features: ['Piscina', 'Parqueadero']
    },
    sort: 'matching',
    page: 1,
    size: 20
  })
});

const data = await response.json();
```

---

#### `GET /listings-search/:listingId`

**¿Para qué sirve?**
Obtener la información detallada de un inmueble específico.

**Método de consumo:**
```javascript
const response = await fetch(
  `${baseUrl}/listings-search/123`,
  {
    headers: {
      'Content-Type': 'application/json'
    }
  }
);

const { listing } = await response.json();
```

**Respuesta:**
```json
{
  "listing": {
    "id": "123",
    "title": "Apartamento Moderno",
    "description": "Hermoso apartamento con excelente ubicación...",
    "price": 450000000,
    "area": 98,
    "rooms": 3,
    "bathrooms": 2,
    "features": ["Piscina", "Parqueadero", "Ascensor"],
    "images": ["url1", "url2", "url3"],
    "coordinates": { "lat": 3.3686, "lng": -76.5389 }
  }
}
```

---

### 2. Búsqueda con IA (NLP)

#### `POST /nlp-proxy`

**¿Para qué sirve?**
Procesar búsquedas en lenguaje natural usando inteligencia artificial.

**Método de consumo:**
```javascript
const response = await fetch(`${baseUrl}/nlp-proxy`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${anonKey}`
  },
  body: JSON.stringify({
    texto: 'Busco apartamento de 3 habitaciones en Pance con piscina, máximo 500 millones'
  })
});

const resultados = await response.json();
// Array de inmuebles ordenados por relevancia
```

**Características:**
- Entiende lenguaje conversacional
- Interpreta sinónimos y contexto
- Ordena por relevancia usando score de similitud
- Extrae automáticamente filtros del texto

---

## 🔐 AUTENTICACIÓN (Sin Autenticación Inicial)

### 3. Solicitar Recuperación de Contraseña

#### `POST /request-password-reset`

**¿Para qué sirve?**
Solicitar un código para restablecer la contraseña cuando el usuario la olvidó.

**Método de consumo:**
```javascript
const response = await fetch(`${baseUrl}/request-password-reset`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'usuario@ejemplo.com'
  })
});

const data = await response.json();
// Envía email con código/token
```

**Proceso:**
1. Usuario ingresa su email
2. Sistema genera token único
3. Envía email con enlace de recuperación
4. Token válido por 1 hora

---

### 4. Verificar Código de Reset

#### `POST /verify-reset-code`

**¿Para qué sirve?**
Verificar que el código/token de recuperación sea válido antes de cambiar la contraseña.

**Método de consumo:**
```javascript
const response = await fetch(`${baseUrl}/verify-reset-code`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    token: 'ABC123XYZ789'
  })
});

const { valid } = await response.json();
// valid: true/false
```

---

### 5. Restablecer Contraseña

#### `POST /reset-password`

**¿Para qué sirve?**
Cambiar la contraseña usando el token de recuperación válido.

**Método de consumo:**
```javascript
const response = await fetch(`${baseUrl}/reset-password`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    token: 'ABC123XYZ789',
    newPassword: 'NuevaContraseñaSegura123'
  })
});

const data = await response.json();
// Usuario puede iniciar sesión con nueva contraseña
```

---

## 👤 ENDPOINTS CON AUTENTICACIÓN

**IMPORTANTE:** Todos los endpoints siguientes requieren autenticación.

**Headers requeridos:**
```javascript
{
  'Authorization': `Bearer ${userToken}`,
  'Content-Type': 'application/json',
  'Apikey': `${supabaseAnonKey}`
}
```

**Obtener el token:**
```javascript
import { supabase } from '@/lib/supabase/client';

const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
```

---

### 6. Verificar Email

#### `POST /send-verification-email`

**¿Para qué sirve?**
Enviar un email de verificación cuando el usuario se registra.

**Método de consumo:**
```javascript
const response = await fetch(`${baseUrl}/send-verification-email`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: 'uuid-del-usuario',
    email: 'usuario@ejemplo.com',
    userName: 'Juan Pérez'
  })
});
```

**Proceso:**
1. Usuario se registra
2. Sistema envía email con enlace
3. Usuario hace clic en el enlace
4. Email queda verificado

---

## 💬 CONVERSACIONES

### 7. Gestión de Conversaciones

#### `GET /conversations`

**¿Para qué sirve?**
Listar todas las conversaciones del chat del usuario.

**Método de consumo:**
```javascript
const response = await fetch(`${baseUrl}/conversations`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const { conversations } = await response.json();
```

**Respuesta:**
```json
{
  "conversations": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "title": "Búsqueda de apartamento en Pance",
      "created_at": "2025-12-01T10:00:00Z",
      "updated_at": "2025-12-01T11:30:00Z"
    }
  ]
}
```

---

#### `POST /conversations`

**¿Para qué sirve?**
Crear una nueva conversación de chat.

**Método de consumo:**
```javascript
const response = await fetch(`${baseUrl}/conversations`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Búsqueda de casa campestre'
  })
});

const { conversation } = await response.json();
// conversation.id → ID de la nueva conversación
```

---

#### `GET /conversations/:conversationId/messages`

**¿Para qué sirve?**
Obtener todos los mensajes de una conversación específica.

**Método de consumo:**
```javascript
const response = await fetch(
  `${baseUrl}/conversations/${conversationId}/messages`,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);

const { messages } = await response.json();
```

**Respuesta:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "role": "user",
      "content": "Busco apartamento en Pance",
      "filters": { "zone": "Pance", "type": "apartment" },
      "listings": [...],
      "created_at": "2025-12-01T10:05:00Z"
    },
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "role": "assistant",
      "content": "He encontrado 15 apartamentos...",
      "created_at": "2025-12-01T10:05:02Z"
    }
  ]
}
```

---

#### `POST /conversations/:conversationId/messages`

**¿Para qué sirve?**
Agregar un nuevo mensaje a una conversación.

**Método de consumo:**
```javascript
const response = await fetch(
  `${baseUrl}/conversations/${conversationId}/messages`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      role: 'user',
      content: 'Busco apartamento en Pance',
      filters: { zone: 'Pance', type: 'apartment' },
      listings: []
    })
  }
);

const { message } = await response.json();
```

---

#### `DELETE /conversations/:conversationId`

**¿Para qué sirve?**
Eliminar una conversación completa con todos sus mensajes.

**Método de consumo:**
```javascript
const response = await fetch(
  `${baseUrl}/conversations/${conversationId}`,
  {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const { success } = await response.json();
```

---

## ⭐ FAVORITOS

### 8. Gestión de Favoritos

#### `GET /favorites`

**¿Para qué sirve?**
Obtener la lista completa de inmuebles favoritos del usuario.

**Método de consumo:**
```javascript
const response = await fetch(`${baseUrl}/favorites`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const { favorites } = await response.json();
```

**Respuesta:**
```json
{
  "favorites": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "listing_id": "123",
      "listing_data": {
        "title": "Apartamento en Pance",
        "price": 450000000,
        "zone": "Pance"
      },
      "notes": "Me gustó mucho la ubicación",
      "created_at": "2025-12-01T10:00:00Z"
    }
  ]
}
```

---

#### `GET /favorites/check/:listingId`

**¿Para qué sirve?**
Verificar rápidamente si un inmueble específico está en favoritos.

**Método de consumo:**
```javascript
const response = await fetch(
  `${baseUrl}/favorites/check/123`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const { isFavorite } = await response.json();
// isFavorite: true/false
```

---

#### `POST /favorites`

**¿Para qué sirve?**
Agregar un inmueble a la lista de favoritos.

**Método de consumo:**
```javascript
const response = await fetch(`${baseUrl}/favorites`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    listing_id: '123',
    listing_data: {
      id: '123',
      title: 'Apartamento Moderno',
      price: 450000000,
      zone: 'Pance',
      images: ['url1']
    },
    conversation_id: 'uuid',
    notes: 'Excelente ubicación, cerca del trabajo'
  })
});

const { favorite } = await response.json();
```

---

#### `PUT /favorites/:listingId`

**¿Para qué sirve?**
Actualizar las notas de un favorito existente.

**Método de consumo:**
```javascript
const response = await fetch(`${baseUrl}/favorites/123`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    notes: 'Actualicé mis notas sobre este inmueble'
  })
});
```

---

#### `DELETE /favorites/:listingId`

**¿Para qué sirve?**
Eliminar un inmueble de la lista de favoritos.

**Método de consumo:**
```javascript
const response = await fetch(`${baseUrl}/favorites/123`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { success } = await response.json();
```

---

## 🎯 SELECCIÓN DE INMUEBLES

### 9. Selección Múltiple para Comparar

#### `GET /listings-selection`

**¿Para qué sirve?**
Obtener los inmuebles que el usuario ha seleccionado temporalmente para comparar o refinar búsqueda.

**Método de consumo:**
```javascript
const response = await fetch(`${baseUrl}/listings-selection`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const { selectedListings, count } = await response.json();
```

---

#### `GET /listings-selection/compare?ids=1,2,3`

**¿Para qué sirve?**
Comparar varios inmuebles seleccionados lado a lado.

**Método de consumo:**
```javascript
const ids = ['1', '2', '3'].join(',');
const response = await fetch(
  `${baseUrl}/listings-selection/compare?ids=${ids}`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const { comparison } = await response.json();
```

**Respuesta:**
```json
{
  "comparison": {
    "listings": [
      {
        "id": "1",
        "title": "Apartamento A",
        "price": 450000000,
        "area": 98,
        "rooms": 3
      },
      {
        "id": "2",
        "title": "Apartamento B",
        "price": 380000000,
        "area": 85,
        "rooms": 3
      }
    ],
    "count": 2
  }
}
```

---

#### `POST /listings-selection`

**¿Para qué sirve?**
Agregar un inmueble a la selección temporal.

**Método de consumo:**
```javascript
const response = await fetch(`${baseUrl}/listings-selection`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    listing_id: '123',
    listing_data: {
      id: '123',
      title: 'Apartamento Moderno',
      price: 450000000
    },
    notes: 'Para comparar con los otros'
  })
});
```

---

#### `DELETE /listings-selection/:listingId`

**¿Para qué sirve?**
Quitar un inmueble de la selección temporal.

**Método de consumo:**
```javascript
const response = await fetch(`${baseUrl}/listings-selection/123`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

#### `DELETE /listings-selection`

**¿Para qué sirve?**
Limpiar completamente la selección temporal (quitar todos los inmuebles seleccionados).

**Método de consumo:**
```javascript
const response = await fetch(`${baseUrl}/listings-selection`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { success } = await response.json();
```

---

## 🔍 HISTORIAL DE BÚSQUEDAS

### 10. Gestión del Historial

#### `GET /search-history`

**¿Para qué sirve?**
Obtener el historial completo de búsquedas del usuario con sus resultados.

**Método de consumo:**
```javascript
const response = await fetch(`${baseUrl}/search-history`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const { searchHistory } = await response.json();
```

**Respuesta:**
```json
{
  "searchHistory": [
    {
      "id": "uuid",
      "query": "Apartamento en Pance 3 habitaciones",
      "filters": {
        "zone": "Pance",
        "type": "apartment",
        "rooms": [3]
      },
      "results_count": 15,
      "results": [...],
      "created_at": "2025-12-01T10:00:00Z"
    }
  ]
}
```

---

#### `POST /search-history`

**¿Para qué sirve?**
Guardar una nueva búsqueda en el historial.

**Método de consumo:**
```javascript
const response = await fetch(`${baseUrl}/search-history`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: 'Casa campestre en Jamundí',
    filters: {
      location: 'Jamundí',
      type: 'house'
    },
    results_count: 8,
    results: [...]
  })
});
```

---

#### `DELETE /search-history/:searchId`

**¿Para qué sirve?**
Eliminar una búsqueda específica del historial.

**Método de consumo:**
```javascript
const response = await fetch(`${baseUrl}/search-history/${searchId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { success } = await response.json();
```

---

#### `DELETE /search-history`

**¿Para qué sirve?**
Limpiar completamente el historial de búsquedas.

**Método de consumo:**
```javascript
const response = await fetch(`${baseUrl}/search-history`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { success } = await response.json();
```

---

## 📅 CITAS

### 11. Sistema de Agendamiento

#### `GET /appointments`

**¿Para qué sirve?**
Obtener todas las citas del usuario.

**Método de consumo:**
```javascript
const response = await fetch(`${baseUrl}/appointments`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const { appointments } = await response.json();
```

**Respuesta:**
```json
{
  "appointments": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "listing_id": "123",
      "listing_data": {...},
      "time_slot": "morning",
      "preferred_date": "2025-12-15",
      "contact_name": "Juan Pérez",
      "contact_email": "juan@ejemplo.com",
      "contact_phone": "+57 300 123 4567",
      "status": "pending",
      "notes": "Prefiero en la mañana",
      "created_at": "2025-12-01T10:00:00Z"
    }
  ]
}
```

---

#### `GET /appointments/upcoming`

**¿Para qué sirve?**
Obtener solo las citas próximas (pendientes o confirmadas, con fecha >= hoy).

**Método de consumo:**
```javascript
const response = await fetch(`${baseUrl}/appointments/upcoming`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const { appointments } = await response.json();
```

---

#### `GET /appointments/:appointmentId`

**¿Para qué sirve?**
Obtener los detalles de una cita específica.

**Método de consumo:**
```javascript
const response = await fetch(
  `${baseUrl}/appointments/${appointmentId}`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const { appointment } = await response.json();
```

---

#### `POST /appointments`

**¿Para qué sirve?**
Crear una nueva cita para visitar un inmueble.

**Método de consumo:**
```javascript
const response = await fetch(`${baseUrl}/appointments`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    listing_id: '123',
    listing_data: {
      id: '123',
      title: 'Apartamento en Pance',
      zone: 'Pance',
      price: 450000000
    },
    time_slot: 'morning',
    preferred_date: '2025-12-15',
    contact_name: 'Juan Pérez',
    contact_email: 'juan@ejemplo.com',
    contact_phone: '+57 300 123 4567',
    notes: 'Prefiero visitar entre 9am y 11am'
  })
});

const { appointment } = await response.json();
```

**Valores de `time_slot`:**
- `morning` - Mañana (9am - 12pm)
- `afternoon` - Tarde (2pm - 5pm)

**Valores de `status`:**
- `pending` - Pendiente de confirmación
- `confirmed` - Confirmada
- `cancelled` - Cancelada
- `completed` - Completada

---

#### `PUT /appointments/:appointmentId`

**¿Para qué sirve?**
Actualizar una cita existente (cambiar fecha, hora, estado, etc).

**Método de consumo:**
```javascript
const response = await fetch(
  `${baseUrl}/appointments/${appointmentId}`,
  {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: 'confirmed',
      time_slot: 'afternoon',
      preferred_date: '2025-12-16',
      notes: 'Cambio de horario'
    })
  }
);
```

---

#### `DELETE /appointments/:appointmentId`

**¿Para qué sirve?**
Cancelar/eliminar una cita.

**Método de consumo:**
```javascript
const response = await fetch(
  `${baseUrl}/appointments/${appointmentId}`,
  {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const { success } = await response.json();
```

---

### 12. Emails de Citas

#### `POST /send-appointment-email`

**¿Para qué sirve?**
Enviar email de confirmación de cita al usuario y/o al agente inmobiliario.

**Método de consumo:**
```javascript
const response = await fetch(`${baseUrl}/send-appointment-email`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    appointmentId: 'uuid',
    userEmail: 'juan@ejemplo.com',
    listingTitle: 'Apartamento en Pance',
    date: '2025-12-15',
    timeSlot: 'morning'
  })
});
```

---

## 🎫 SOPORTE

### 13. Sistema de Tickets

#### `GET /support-tickets`

**¿Para qué sirve?**
Listar todos los tickets de soporte del usuario.

**Método de consumo:**
```javascript
const response = await fetch(`${baseUrl}/support-tickets`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const { tickets } = await response.json();
```

**Respuesta:**
```json
{
  "tickets": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "Juan Pérez",
      "email": "juan@ejemplo.com",
      "subject": "Problema con búsqueda",
      "message": "No puedo ver los resultados...",
      "category": "technical",
      "priority": "medium",
      "status": "open",
      "created_at": "2025-12-01T10:00:00Z",
      "updated_at": "2025-12-01T10:00:00Z"
    }
  ]
}
```

---

#### `GET /support-tickets/:ticketId`

**¿Para qué sirve?**
Obtener los detalles de un ticket específico.

**Método de consumo:**
```javascript
const response = await fetch(
  `${baseUrl}/support-tickets/${ticketId}`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const { ticket } = await response.json();
```

---

#### `POST /support-tickets`

**¿Para qué sirve?**
Crear un nuevo ticket de soporte.

**Método de consumo:**
```javascript
const response = await fetch(`${baseUrl}/support-tickets`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Juan Pérez',
    email: 'juan@ejemplo.com',
    subject: 'Problema con la búsqueda',
    message: 'No puedo ver los resultados de mi búsqueda',
    category: 'technical',
    priority: 'medium'
  })
});

const { ticket } = await response.json();
```

**Categorías disponibles:**
- `technical` - Problemas técnicos
- `inquiry` - Consultas generales
- `billing` - Facturación
- `suggestion` - Sugerencias
- `other` - Otros

**Prioridades disponibles:**
- `low` - Baja
- `medium` - Media
- `high` - Alta
- `urgent` - Urgente

**Estados:**
- `open` - Abierto
- `in_progress` - En progreso
- `resolved` - Resuelto
- `closed` - Cerrado

---

#### `PUT /support-tickets/:ticketId`

**¿Para qué sirve?**
Actualizar un ticket existente (agregar información adicional).

**Método de consumo:**
```javascript
const response = await fetch(
  `${baseUrl}/support-tickets/${ticketId}`,
  {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: 'Información adicional sobre el problema...',
      priority: 'high'
    })
  }
);
```

---

## 👤 PERFIL DE USUARIO

### 14. Gestión de Perfil

#### `GET /user-profile`

**¿Para qué sirve?**
Obtener la información del perfil del usuario autenticado.

**Método de consumo:**
```javascript
const response = await fetch(`${baseUrl}/user-profile`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const { profile } = await response.json();
```

**Respuesta:**
```json
{
  "profile": {
    "id": "uuid",
    "email": "juan@ejemplo.com",
    "full_name": "Juan Pérez García",
    "phone": "+57 300 123 4567",
    "avatar_url": "https://...",
    "bio": "Buscando apartamento en Cali",
    "document_type": "CC",
    "document_number": "1234567890",
    "created_at": "2025-12-01T10:00:00Z",
    "updated_at": "2025-12-01T11:00:00Z"
  }
}
```

---

#### `PUT /user-profile`

**¿Para qué sirve?**
Actualizar la información del perfil del usuario.

**Método de consumo:**
```javascript
const response = await fetch(`${baseUrl}/user-profile`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    full_name: 'Juan Pérez García',
    phone: '+57 300 123 4567',
    bio: 'Buscando apartamento en el sur de Cali',
    document_type: 'CC',
    document_number: '1234567890'
  })
});

const { profile } = await response.json();
```

**Tipos de documento:**
- `CC` - Cédula de Ciudadanía
- `CE` - Cédula de Extranjería
- `Pasaporte` - Pasaporte

---

## ⚙️ CONFIGURACIÓN DE USUARIO

### 15. Preferencias

#### `GET /user-settings`

**¿Para qué sirve?**
Obtener las configuraciones y preferencias del usuario.

**Método de consumo:**
```javascript
const response = await fetch(`${baseUrl}/user-settings`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const { settings } = await response.json();
```

**Respuesta:**
```json
{
  "settings": {
    "user_id": "uuid",
    "notifications_enabled": true,
    "email_notifications": true,
    "search_alerts": false,
    "newsletter": false,
    "voice_enabled": true,
    "voice_language": "es-ES",
    "voice_gender": "female",
    "voice_rate": 1.0,
    "created_at": "2025-12-01T10:00:00Z",
    "updated_at": "2025-12-01T10:00:00Z"
  }
}
```

---

#### `PUT /user-settings`

**¿Para qué sirve?**
Actualizar las configuraciones del usuario.

**Método de consumo:**
```javascript
const response = await fetch(`${baseUrl}/user-settings`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    notifications_enabled: true,
    email_notifications: false,
    voice_enabled: true,
    voice_language: 'es-MX',
    voice_gender: 'male',
    voice_rate: 1.2
  })
});

const { settings } = await response.json();
```

**Opciones de voz:**
- `voice_enabled` - Habilitar/deshabilitar síntesis de voz
- `voice_language` - Idioma (es-ES, es-MX, es-CO)
- `voice_gender` - Género (male, female)
- `voice_rate` - Velocidad (0.5 - 2.0)

---

#### `DELETE /user-settings`

**¿Para qué sirve?**
Restaurar configuraciones a valores por defecto.

**Método de consumo:**
```javascript
const response = await fetch(`${baseUrl}/user-settings`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { success } = await response.json();
```

---

## 📧 EMAILS

### 16. Envío de Email Genérico

#### `POST /send-email`

**¿Para qué sirve?**
Enviar un email genérico desde la plataforma.

**Método de consumo:**
```javascript
const response = await fetch(`${baseUrl}/send-email`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: 'destinatario@ejemplo.com',
    subject: 'Asunto del email',
    html: '<p>Contenido del email en HTML</p>'
  })
});
```

---

## 🔧 ADMINISTRACIÓN

### 17. Crear Usuario Admin

#### `POST /create-admin-user`

**¿Para qué sirve?**
Crear un usuario con permisos de administrador (solo para uso interno).

**Método de consumo:**
```javascript
const response = await fetch(`${baseUrl}/create-admin-user`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'admin@buscofacil.com',
    password: 'ContraseñaSegura123',
    full_name: 'Administrador'
  })
});
```

---

## 🌐 API DE NEXT.JS

### 18. Chat con IA

#### `POST /api/chat`

**¿Para qué sirve?**
Endpoint del chat conversacional que procesa mensajes y devuelve respuestas.

**Método de consumo:**
```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'Busco apartamento en Pance',
    conversationId: 'uuid-opcional'
  })
});

const data = await response.json();
```

---

## 🔐 Autenticación y Seguridad

### Sistema de Autenticación

#### Registro de Usuario

1. Usuario completa formulario con email, contraseña y nombre
2. Sistema crea cuenta en Supabase
3. Se genera token de verificación único
4. Se envía email con enlace de verificación
5. Usuario debe verificar email antes de poder iniciar sesión

#### Inicio de Sesión

```javascript
import { supabase } from '@/lib/supabase/client';

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'usuario@ejemplo.com',
  password: 'contraseña123'
});

if (data.session) {
  const token = data.session.access_token;
  // Usar este token en los headers de las requests
}
```

#### Obtener Usuario Actual

```javascript
const { data: { user } } = await supabase.auth.getUser();
```

#### Cerrar Sesión

```javascript
await supabase.auth.signOut();
```

### Seguridad

#### Row Level Security (RLS)

Todas las tablas tienen políticas RLS que garantizan:
- Los usuarios solo ven sus propios datos
- No pueden acceder a datos de otros usuarios
- Solo `service_role` puede realizar operaciones administrativas

#### Tokens

- Tokens de verificación: Expiran en 24 horas
- Tokens de recuperación: Expiran en 1 hora
- Se marcan como usados después de su uso
- Generados con `crypto.getRandomValues()`

#### CORS

Todos los endpoints soportan CORS con:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Client-Info, Apikey
```

---

## 💾 Base de Datos

### Tablas Principales

#### `auth.users`
Usuarios del sistema (gestionado por Supabase Auth)

#### `profiles`
Perfiles de usuario con información adicional

#### `conversations`
Conversaciones del chat

#### `messages`
Mensajes de las conversaciones

#### `search_history`
Historial de búsquedas

#### `favorites`
Inmuebles favoritos

#### `selected_listings`
Selección temporal para comparar

#### `appointments`
Citas agendadas

#### `support_tickets`
Tickets de soporte

#### `user_settings`
Configuraciones de usuario

#### `verification_tokens`
Tokens de verificación y recuperación

#### `wasi_listings`
Cache de inmuebles de Wasi

#### `api_integrations_config`
Configuración de integraciones

---

## 🔌 Integraciones

### Resend (Emails)

**¿Para qué sirve?**
Envío de emails transaccionales (verificación, recuperación de contraseña, confirmación de citas).

**Configuración:**
```
RESEND_API_KEY=re_8AuNsUwS_GNBP5i5iqdLwEZ3kGtiAFS5N
```

### APIs de Inmobiliarias

#### Wasi
Integración con API de Wasi para obtener listados de inmuebles.

#### MetroCuadrado
Búsqueda de propiedades en MetroCuadrado.

### Web Speech API

**¿Para qué sirve?**
- **Speech Recognition:** Convierte voz a texto (búsqueda por voz)
- **Speech Synthesis:** Lee respuestas en voz alta

---

## 📱 Guía de Uso

### Para Usuarios Finales

#### 1. Búsqueda Básica

1. Ingresar a la plataforma
2. Escribir o hablar lo que busca
3. Ver resultados
4. Seleccionar inmuebles de interés
5. Ver detalles
6. Agendar visita

#### 2. Búsqueda Avanzada

1. Hacer búsqueda inicial
2. Seleccionar 2-3 inmuebles de interés
3. Escribir: "Muéstrame más como estos"
4. Refinar con características adicionales
5. Repetir hasta encontrar el ideal

#### 3. Favoritos

1. Hacer clic en el corazón de un inmueble
2. Agregar notas (opcional)
3. Ver en la sección "Favoritos"
4. Organizar y comparar

#### 4. Agendar Visita

1. Ver detalles del inmueble
2. Clic en "Agendar visita"
3. Seleccionar fecha y horario
4. Completar datos de contacto
5. Recibir confirmación por email

### Para Desarrolladores

#### Ejemplo Completo de Flujo

```javascript
import { supabase } from '@/lib/supabase/client';

// 1. Login
const { data: { session } } = await supabase.auth.signInWithPassword({
  email: 'usuario@ejemplo.com',
  password: 'password123'
});

const token = session.access_token;
const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// 2. Buscar inmuebles
const searchResponse = await fetch(
  `${baseUrl}/functions/v1/listings-search`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filters: {
        location: 'Cali',
        zone: 'Pance',
        type: 'apartment',
        price: { min: 300000000, max: 600000000 },
        rooms: [3]
      },
      page: 1,
      size: 20
    })
  }
);

const { items } = await searchResponse.json();

// 3. Agregar a favoritos
const favoriteResponse = await fetch(
  `${baseUrl}/functions/v1/favorites`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      listing_id: items[0].id,
      listing_data: items[0],
      notes: 'Me gusta mucho'
    })
  }
);

// 4. Agendar cita
const appointmentResponse = await fetch(
  `${baseUrl}/functions/v1/appointments`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      listing_id: items[0].id,
      listing_data: items[0],
      time_slot: 'morning',
      preferred_date: '2025-12-15',
      contact_name: 'Juan Pérez',
      contact_email: 'juan@ejemplo.com',
      contact_phone: '+57 300 123 4567'
    })
  }
);

// 5. Ver historial
const historyResponse = await fetch(
  `${baseUrl}/functions/v1/search-history`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const { searchHistory } = await historyResponse.json();
```

---

## 📊 Resumen de Endpoints

| Endpoint | Método | Auth | Descripción |
|----------|--------|------|-------------|
| `/listings-search` | GET, POST | ❌ | Búsqueda de inmuebles |
| `/listings-search/:id` | GET | ❌ | Detalle de inmueble |
| `/nlp-proxy` | POST | ❌ | Búsqueda con IA |
| `/request-password-reset` | POST | ❌ | Solicitar reset |
| `/verify-reset-code` | POST | ❌ | Verificar código |
| `/reset-password` | POST | ❌ | Cambiar contraseña |
| `/send-verification-email` | POST | ✅ | Email verificación |
| `/conversations` | GET, POST, PUT, DELETE | ✅ | Gestión conversaciones |
| `/conversations/:id/messages` | GET, POST | ✅ | Mensajes |
| `/favorites` | GET, POST, PUT, DELETE | ✅ | Favoritos |
| `/favorites/check/:id` | GET | ✅ | Verificar favorito |
| `/listings-selection` | GET, POST, PUT, DELETE | ✅ | Selección múltiple |
| `/listings-selection/compare` | GET | ✅ | Comparar inmuebles |
| `/search-history` | GET, POST, DELETE | ✅ | Historial |
| `/appointments` | GET, POST, PUT, DELETE | ✅ | Citas |
| `/appointments/upcoming` | GET | ✅ | Citas próximas |
| `/send-appointment-email` | POST | ✅ | Email de cita |
| `/support-tickets` | GET, POST, PUT | ✅ | Soporte |
| `/user-profile` | GET, PUT | ✅ | Perfil |
| `/user-settings` | GET, PUT, DELETE | ✅ | Configuración |
| `/send-email` | POST | ✅ | Email genérico |
| `/create-admin-user` | POST | ✅ | Crear admin |
| `/api/chat` | POST | ❌ | Chat IA (Next.js) |

---

## 🎨 Identidad de Marca

### Colores

- **Primario:** #054089 (Azul corporativo)
- **Acento:** #0756A3
- **Secundario:** #60D9FA (Cyan)
- **Texto:** #1F2937

### Tipografía

- Sistema: San Serif (system-ui, -apple-system, Segoe UI)
- Pesos: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Iconos

- Librería: Lucide React
- Tamaño típico: 20-24px

---

## 🚀 Deploy y Producción

### Variables de Entorno Requeridas

```env
# Next.js
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...

# Supabase Secrets (Edge Functions)
RESEND_API_KEY=re_8AuNsUwS_GNBP5i5iqdLwEZ3kGtiAFS5N
```

### Checklist de Deploy

- [ ] Configurar variables de entorno
- [ ] Migrar base de datos
- [ ] Desplegar Edge Functions
- [ ] Configurar dominio personalizado
- [ ] Configurar Resend con dominio propio
- [ ] Habilitar HTTPS
- [ ] Configurar CORS
- [ ] Verificar RLS policies
- [ ] Probar autenticación
- [ ] Probar envío de emails

---

## 📞 Soporte

Para soporte técnico, usa el sistema de tickets integrado en la plataforma o contacta a:

**Email:** soporte@buscofacil.com
**WhatsApp:** +57 300 123 4567

---

## 📝 Notas Finales

- Todos los precios están en pesos colombianos (COP)
- Las coordenadas usan formato estándar: `{ lat: number, lng: number }`
- Todas las fechas están en formato ISO 8601
- Los tokens JWT expiran según configuración de Supabase (default: 1 hora)
- Los resultados de búsqueda están ordenados por relevancia (matching score)

---

**Última actualización:** Diciembre 2025
**Versión del documento:** 1.0
**Autor:** Equipo de Desarrollo Busco Fácil

# Sistema de Notificaciones por Email para Citas

Este documento explica cómo configurar y utilizar el sistema de notificaciones por email cuando se crea una nueva cita.

## 📋 Descripción General

Cuando un cliente solicita una cita a través de la aplicación móvil, se envía automáticamente un email al vendedor asignado con:

- Información del cliente (nombre, email, teléfono)
- Detalles del inmueble (título, dirección, precio)
- Fecha y hora solicitada
- Notas del cliente (si las hay)
- Enlace directo al panel de administración para gestionar la cita

## 🔧 Configuración Requerida

### 1. Variables de Entorno

Asegúrate de tener configuradas las siguientes variables en tu archivo `.env`:

```env
# URL del panel de administración
EXPO_PUBLIC_ADMIN_URL=https://admin.buscofacil.com

# Supabase (ya configuradas)
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 2. Configurar Resend API Key en Supabase

La Edge Function utiliza [Resend](https://resend.com) para enviar emails. Debes configurar la API key:

1. Crea una cuenta en [Resend](https://resend.com)
2. Obtén tu API Key desde el dashboard
3. Configura la API Key en Supabase:
   - Ve a tu proyecto en Supabase Dashboard
   - Navega a **Settings** → **Edge Functions**
   - Agrega un nuevo secret:
     - Name: `RESEND_API_KEY`
     - Value: tu API key de Resend

### 3. Verificar Dominio de Envío (Opcional pero Recomendado)

Para producción, es recomendable verificar tu dominio en Resend:

1. En Resend Dashboard, ve a **Domains**
2. Agrega tu dominio (ej: `buscofacil.com`)
3. Configura los registros DNS según las instrucciones
4. Actualiza el `from` en la Edge Function si es necesario

## �� Edge Function: send-appointment-email

La Edge Function está ubicada en:
```
supabase/functions/send-appointment-email/index.ts
```

### Despliegue de la Edge Function

⚠️ **IMPORTANTE**: La Edge Function debe ser desplegada manualmente en Supabase.

#### Opción 1: Usando Supabase CLI (Recomendado)

```bash
# Instalar Supabase CLI si no lo tienes
npm install -g supabase

# Iniciar sesión
supabase login

# Vincular tu proyecto
supabase link --project-ref tu-project-ref

# Desplegar la función
supabase functions deploy send-appointment-email
```

#### Opción 2: Manualmente desde Dashboard

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a **Edge Functions**
3. Crea una nueva función llamada `send-appointment-email`
4. Copia el contenido de `supabase/functions/send-appointment-email/index.ts`
5. Pega el código y guarda

### Endpoint de la Edge Function

Una vez desplegada, la función estará disponible en:
```
https://tu-proyecto.supabase.co/functions/v1/send-appointment-email
```

## 📧 Plantilla de Email

La plantilla de email incluye:

### Diseño Profesional
- Header con gradiente morado (colores de la marca)
- Diseño responsive que se adapta a móviles
- Secciones bien organizadas y visualmente atractivas

### Contenido
1. **Alerta de Acción Requerida**: Notificación prominente
2. **Información del Cliente**: Nombre, email, teléfono
3. **Detalles del Inmueble**: Título, precio, dirección
4. **Fecha y Hora**: Fecha y hora solicitadas
5. **Notas del Cliente**: Si el cliente dejó notas
6. **Vendedor Asignado**: Información del vendedor
7. **Botón CTA**: Enlace directo al panel de administración

### Personalización

Si necesitas personalizar la plantilla, edita la función `createEmailTemplate` en:
```typescript
supabase/functions/send-appointment-email/index.ts
```

## 🔄 Flujo de Funcionamiento

1. **Cliente solicita cita** → `schedule-visit.tsx`
2. **Se crea el registro** → `appointmentsAppService.createAppointment()`
3. **Se envía notificación** → `appointmentsAppService.sendAppointmentNotificationEmail()`
4. **Edge Function procesa** → `send-appointment-email`
5. **Resend envía email** → Al vendedor asignado
6. **Vendedor recibe email** → Con enlace al admin

## 🧪 Pruebas

### Probar el Envío de Email

Puedes probar el envío manualmente haciendo una petición directa a la Edge Function:

```bash
curl -X POST \
  https://tu-proyecto.supabase.co/functions/v1/send-appointment-email \
  -H "Authorization: Bearer TU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": "test-123",
    "clientName": "Juan Pérez",
    "clientEmail": "juan@example.com",
    "clientPhone": "+573001234567",
    "vendorName": "María García",
    "vendorEmail": "maria@example.com",
    "propertyTitle": "Casa en Chapinero",
    "propertyAddress": "Calle 60 #10-20, Chapinero, Bogotá",
    "propertyPrice": 450000000,
    "appointmentDate": "viernes, 15 de diciembre de 2023",
    "appointmentTime": "10:00 AM",
    "notes": "Prefiero visitar por la mañana",
    "adminUrl": "https://admin.buscofacil.com"
  }'
```

### Verificar Logs

Para verificar que el email se está enviando correctamente:

1. Revisa los logs de la Edge Function en Supabase Dashboard
2. Revisa los logs en la consola del navegador al crear una cita
3. Verifica en Resend Dashboard el historial de emails enviados

## ⚙️ Manejo de Errores

El sistema maneja errores de forma silenciosa para no interrumpir la creación de la cita:

- Si el email falla, la cita se crea de todas formas
- Los errores se registran en los logs
- El usuario no ve errores relacionados con el email

Esto asegura que problemas con el servicio de email no afecten la funcionalidad principal.

## 📝 Notas Adicionales

### Límites de Resend

- Plan gratuito: 100 emails/día
- Para producción, considera un plan pago según tus necesidades

### Personalización del Remitente

Por defecto, los emails se envían desde:
```
BuscoFácil <citas@buscofacil.com>
```

Para cambiar esto, edita la línea en la Edge Function:
```typescript
from: 'Tu Nombre <tu-email@tu-dominio.com>',
```

### URL del Panel de Administración

El enlace en el email apunta a:
```
{adminUrl}/appointments/{appointmentId}
```

Asegúrate de que tu panel de administración pueda manejar esta ruta.

## 🔐 Seguridad

- Las API keys se almacenan de forma segura en Supabase
- Las variables de entorno no se exponen al cliente
- La Edge Function valida los datos antes de enviar

## 🆘 Solución de Problemas

### Email no se envía

1. Verifica que `RESEND_API_KEY` esté configurada en Supabase
2. Revisa los logs de la Edge Function
3. Verifica que la función esté desplegada correctamente
4. Confirma que el email del vendedor sea válido

### Email llega a spam

1. Verifica tu dominio en Resend
2. Configura SPF, DKIM y DMARC
3. Evita palabras que activen filtros de spam

### Plantilla no se ve bien

1. Prueba en diferentes clientes de email
2. Verifica que el HTML sea válido
3. Usa herramientas como Litmus para testing

## 📚 Referencias

- [Resend Documentation](https://resend.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Email HTML Best Practices](https://www.campaignmonitor.com/dev-resources/guides/coding/)

---

**¿Necesitas ayuda?** Contacta al equipo de desarrollo.

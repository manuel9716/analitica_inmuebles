import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AppointmentEmailRequest {
  appointmentId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  vendorName: string;
  vendorEmail: string;
  propertyTitle: string;
  propertyAddress: string;
  propertyPrice?: number;
  appointmentDate: string;
  appointmentTime: string;
  notes?: string;
  adminUrl: string;
  emailType?: 'nueva' | 'cancelada' | 'reprogramada';
  previousDate?: string;
  previousTime?: string;
}

const getEmailConfig = (emailType: string) => {
  switch (emailType) {
    case 'cancelada':
      return {
        icon: '❌',
        title: 'Cita Cancelada',
        subtitle: 'Un cliente ha cancelado una cita',
        alertTitle: '⚠️ Notificación de Cancelación',
        alertText: 'El cliente ha cancelado esta cita. Puedes revisar los detalles y tomar las acciones necesarias.',
        alertColor: '#f44336',
        alertBg: '#ffebee',
      };
    case 'reprogramada':
      return {
        icon: '🔄',
        title: 'Cita Reprogramada',
        subtitle: 'Un cliente ha reprogramado una cita',
        alertTitle: '🔔 Cambio de Fecha y Hora',
        alertText: 'El cliente ha solicitado cambiar la fecha u hora de la cita. Por favor revisa los nuevos detalles y confirma.',
        alertColor: '#ff9800',
        alertBg: '#fff3e0',
      };
    default:
      return {
        icon: '🏠',
        title: 'Nueva Solicitud de Cita',
        subtitle: 'Se ha solicitado una visita a un inmueble',
        alertTitle: '⏰ Acción Requerida',
        alertText: 'Un cliente ha solicitado agendar una visita. Por favor revisa los detalles y confirma o modifica la cita lo antes posible.',
        alertColor: '#ffc107',
        alertBg: '#fef3cd',
      };
  }
};

const createEmailTemplate = (data: AppointmentEmailRequest): string => {
  const emailType = data.emailType || 'nueva';
  const config = getEmailConfig(emailType);

  const formattedPrice = data.propertyPrice
    ? new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
      }).format(data.propertyPrice)
    : 'No especificado';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Cita Solicitada - BuscoFácil</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .header p {
      margin: 8px 0 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .content {
      padding: 30px 20px;
    }
    .alert {
      padding: 16px;
      margin-bottom: 24px;
      border-radius: 4px;
    }
    .alert-title {
      font-weight: 600;
      margin: 0 0 8px;
      font-size: 16px;
    }
    .alert-text {
      margin: 0;
      font-size: 14px;
    }
    .section {
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 1px solid #e5e5e5;
    }
    .section:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin: 0 0 16px;
    }
    .info-grid {
      display: grid;
      gap: 12px;
    }
    .info-item {
      display: flex;
      align-items: flex-start;
    }
    .info-label {
      font-weight: 600;
      color: #666;
      min-width: 140px;
      font-size: 14px;
    }
    .info-value {
      color: #333;
      font-size: 14px;
      flex: 1;
    }
    .property-card {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
      margin-top: 12px;
    }
    .property-title {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin: 0 0 8px;
    }
    .property-price {
      font-size: 20px;
      font-weight: 700;
      color: #667eea;
      margin: 0 0 8px;
    }
    .property-address {
      color: #666;
      font-size: 14px;
      margin: 0;
    }
    .notes-box {
      background-color: #f8f9fa;
      border-left: 3px solid #667eea;
      padding: 16px;
      border-radius: 4px;
      margin-top: 12px;
    }
    .notes-text {
      color: #555;
      font-size: 14px;
      margin: 0;
      font-style: italic;
    }
    .button-container {
      text-align: center;
      margin: 32px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .footer p {
      margin: 4px 0;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 20px 16px;
      }
      .info-item {
        flex-direction: column;
      }
      .info-label {
        min-width: auto;
        margin-bottom: 4px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${config.icon} ${config.title}</h1>
      <p>${config.subtitle}</p>
    </div>

    <div class="content">
      <div class="alert" style="background-color: ${config.alertBg}; border-left: 4px solid ${config.alertColor};">
        <p class="alert-title" style="color: ${config.alertColor};">${config.alertTitle}</p>
        <p class="alert-text" style="color: ${config.alertColor};">
          ${config.alertText}
        </p>
      </div>

      <div class="section">
        <h2 class="section-title">📋 Información del Cliente</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Nombre:</span>
            <span class="info-value">${data.clientName}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Email:</span>
            <span class="info-value">${data.clientEmail}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Teléfono:</span>
            <span class="info-value">${data.clientPhone}</span>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">🏡 Inmueble</h2>
        <div class="property-card">
          <p class="property-title">${data.propertyTitle}</p>
          <p class="property-price">${formattedPrice}</p>
          <p class="property-address">📍 ${data.propertyAddress}</p>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">📅 ${emailType === 'reprogramada' ? 'Nueva Fecha y Hora' : 'Fecha y Hora Solicitada'}</h2>
        ${emailType === 'reprogramada' && data.previousDate && data.previousTime ? `
        <div style="background-color: #ffebee; padding: 12px; border-radius: 6px; margin-bottom: 16px;">
          <p style="margin: 0 0 8px; font-size: 14px; color: #666;"><strong>Anterior:</strong></p>
          <p style="margin: 0; font-size: 14px; color: #333;">📅 ${data.previousDate} - ⏰ ${data.previousTime}</p>
        </div>
        <div style="background-color: #e8f5e9; padding: 12px; border-radius: 6px;">
          <p style="margin: 0 0 8px; font-size: 14px; color: #666;"><strong>Nuevo:</strong></p>
          <p style="margin: 0; font-size: 14px; color: #333;">📅 ${data.appointmentDate} - ⏰ ${data.appointmentTime}</p>
        </div>
        ` : `
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Fecha:</span>
            <span class="info-value">${data.appointmentDate}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Hora:</span>
            <span class="info-value">${data.appointmentTime}</span>
          </div>
        </div>
        `}
      </div>

      ${data.notes ? `
      <div class="section">
        <h2 class="section-title">📝 Notas del Cliente</h2>
        <div class="notes-box">
          <p class="notes-text">${data.notes}</p>
        </div>
      </div>
      ` : ''}

      <div class="section">
        <h2 class="section-title">👤 Vendedor Asignado</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Nombre:</span>
            <span class="info-value">${data.vendorName}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Email:</span>
            <span class="info-value">${data.vendorEmail}</span>
          </div>
        </div>
      </div>

      <div class="button-container">
        <a href="${data.adminUrl}/appointments/${data.appointmentId}" class="button">
          Revisar y Gestionar Cita
        </a>
      </div>
    </div>

    <div class="footer">
      <p><strong>BuscoFácil</strong> - Sistema de Gestión de Citas</p>
      <p>Este es un correo automático, por favor no responder.</p>
      <p>© ${new Date().getFullYear()} BuscoFácil. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const data: AppointmentEmailRequest = await req.json();

    const emailHtml = createEmailTemplate(data);

    const emailType = data.emailType || 'nueva';
    let subject = '';

    switch (emailType) {
      case 'cancelada':
        subject = `❌ Cita Cancelada: ${data.propertyTitle}`;
        break;
      case 'reprogramada':
        subject = `🔄 Cita Reprogramada: ${data.propertyTitle}`;
        break;
      default:
        subject = `Nueva Cita Solicitada: ${data.propertyTitle}`;
    }

    const emailPayload = {
      to: [data.vendorEmail],
      subject: subject,
      html: emailHtml,
    };

    console.log('[send-appointment-email] Enviando email a:', data.vendorEmail);
    console.log('[send-appointment-email] Asunto:', emailPayload.subject);

    // API Key hardcodeada temporalmente para desarrollo
    const resendApiKey = 're_LFmoiXZG_Ko87Xm93n7RYEZNQPxuZtpgN';

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'BuscoFácil <onboarding@resend.dev>',
        ...emailPayload,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('[send-appointment-email] Error de Resend:', errorText);
      throw new Error(`Error al enviar email: ${errorText}`);
    }

    const result = await resendResponse.json();
    console.log('[send-appointment-email] Email enviado exitosamente:', result);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email enviado exitosamente',
        emailId: result.id,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('[send-appointment-email] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
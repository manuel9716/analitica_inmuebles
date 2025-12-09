/**
 * Servicio de Citas para la App Móvil
 * Solo funcionalidades para usuarios finales (user_type: 'end_user')
 */

import { supabase } from '@/lib/supabase';
import { Appointment, CreateAppointmentInput, AppointmentStatus } from '@/types';

export type SortOption = 'fecha_asc' | 'fecha_desc' | 'distancia';
export type FilterStatus = 'todas' | 'pendiente' | 'confirmada' | 'completada' | 'cancelada';

export interface AppointmentFilters {
  searchQuery?: string;
  status?: FilterStatus;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: SortOption;
  userLocation?: { lat: number; lng: number };
}

export const appointmentsAppService = {
  /**
   * Crear una nueva cita
   */
  async createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const appointmentData = {
        ...input,
        duracion_minutos: input.duracion_minutos || 60,
        canal_comunicacion: input.canal_comunicacion || 'app',
        estado: 'pendiente' as AppointmentStatus,
        confirmada_cliente: false,
        confirmada_vendedor: false,
        cliente_id: user?.id || input.cliente_id,
      };

      console.log('[appointmentsAppService] ===== CREANDO CITA =====');
      console.log('[appointmentsAppService] Input recibido:', JSON.stringify(input, null, 2));
      console.log('[appointmentsAppService] Datos a insertar:', JSON.stringify(appointmentData, null, 2));

      const { data, error } = await supabase
        .from('appointments_system')
        .insert(appointmentData)
        .select()
        .single();

      if (error) {
        console.error('[appointmentsAppService] Error creating appointment:', error);
        throw new Error(error.message);
      }

      console.log('[appointmentsAppService] ===== CITA CREADA EXITOSAMENTE =====');
      console.log('[appointmentsAppService] ID:', data.id);
      console.log('[appointmentsAppService] Cliente:', {
        nombre: data.cliente_nombre,
        email: data.cliente_email,
        celular: data.cliente_celular
      });
      console.log('[appointmentsAppService] Vendedor:', {
        nombre: data.vendedor_nombre,
        email: data.vendedor_email,
        celular: data.vendedor_celular
      });

      // Enviar email de notificación (no bloquear si falla)
      try {
        await this.sendAppointmentNotificationEmail(data);
      } catch (emailError) {
        console.error('[appointmentsAppService] Error enviando email (no crítico):', emailError);
      }

      return data as Appointment;
    } catch (error) {
      console.error('[appointmentsAppService] Error:', error);
      throw error;
    }
  },

  /**
   * Obtener citas próximas del cliente
   */
  async getUpcomingClientAppointments(clienteId?: string): Promise<Appointment[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = clienteId || user?.id;

      if (!userId) {
        console.log('[appointmentsAppService] No user ID');
        return [];
      }

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('appointments_system')
        .select('*')
        .eq('cliente_id', userId)
        .gte('fecha_cita', today)
        .in('estado', ['pendiente', 'confirmada', 'en_camino'])
        .order('fecha_cita', { ascending: true })
        .order('hora_inicio', { ascending: true });

      if (error) {
        console.error('[appointmentsAppService] Error fetching appointments:', error);
        throw error;
      }

      console.log('[appointmentsAppService] Found', data?.length || 0, 'upcoming appointments');
      return (data as Appointment[]) || [];
    } catch (error) {
      console.error('[appointmentsAppService] Error:', error);
      throw error;
    }
  },

  /**
   * Obtener todas las citas del cliente con filtros
   */
  async getAllClientAppointments(
    clienteId?: string,
    filters?: AppointmentFilters
  ): Promise<Appointment[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = clienteId || user?.id;

      if (!userId) {
        return [];
      }

      let query = supabase
        .from('appointments_system')
        .select('*')
        .eq('cliente_id', userId);

      // Filtro por estado
      if (filters?.status && filters.status !== 'todas') {
        if (filters.status === 'cancelada') {
          query = query.in('estado', ['cancelada_cliente', 'cancelada_vendedor']);
        } else {
          query = query.eq('estado', filters.status);
        }
      }

      // Filtro por fecha desde
      if (filters?.dateFrom) {
        query = query.gte('fecha_cita', filters.dateFrom);
      }

      // Filtro por fecha hasta
      if (filters?.dateTo) {
        query = query.lte('fecha_cita', filters.dateTo);
      }

      // Ordenamiento por fecha (se aplica antes de buscar)
      if (filters?.sortBy === 'fecha_asc') {
        query = query.order('fecha_cita', { ascending: true }).order('hora_inicio', { ascending: true });
      } else if (filters?.sortBy === 'fecha_desc' || !filters?.sortBy) {
        query = query.order('fecha_cita', { ascending: false }).order('hora_inicio', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        console.error('[appointmentsAppService] Error:', error);
        throw error;
      }

      let results = (data as Appointment[]) || [];

      // Búsqueda por texto
      if (filters?.searchQuery && filters.searchQuery.trim()) {
        const searchLower = filters.searchQuery.toLowerCase();
        results = results.filter(apt =>
          apt.inmueble_titulo?.toLowerCase().includes(searchLower) ||
          apt.inmueble_direccion?.toLowerCase().includes(searchLower) ||
          apt.inmueble_ciudad?.toLowerCase().includes(searchLower) ||
          apt.vendedor_nombre?.toLowerCase().includes(searchLower)
        );
      }

      // Ordenamiento por distancia (se aplica después de obtener datos)
      if (filters?.sortBy === 'distancia' && filters.userLocation) {
        results = this.sortByDistance(results, filters.userLocation);
      }

      return results;
    } catch (error) {
      console.error('[appointmentsAppService] Error:', error);
      throw error;
    }
  },

  /**
   * Ordenar citas por distancia
   */
  sortByDistance(
    appointments: Appointment[],
    userLocation: { lat: number; lng: number }
  ): Appointment[] {
    return appointments
      .map(apt => ({
        ...apt,
        distance: apt.inmueble_coordenadas
          ? this.calculateDistance(
              userLocation.lat,
              userLocation.lng,
              apt.inmueble_coordenadas.lat,
              apt.inmueble_coordenadas.lng
            )
          : Infinity,
      }))
      .sort((a, b) => a.distance - b.distance);
  },

  /**
   * Calcular distancia entre dos puntos (fórmula de Haversine)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  toRad(value: number): number {
    return (value * Math.PI) / 180;
  },

  /**
   * Obtener una cita por ID
   */
  async getAppointmentById(appointmentId: string): Promise<Appointment | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error} = await supabase
        .from('appointments_system')
        .select('*')
        .eq('id', appointmentId)
        .eq('cliente_id', user?.id)
        .maybeSingle();

      if (error) {
        console.error('[appointmentsAppService] Error:', error);
        throw error;
      }

      return data as Appointment | null;
    } catch (error) {
      console.error('[appointmentsAppService] Error:', error);
      throw error;
    }
  },

  /**
   * Cliente confirma asistencia a la cita
   */
  async confirmAppointmentByClient(appointmentId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('appointments_system')
        .update({
          confirmada_cliente: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', appointmentId)
        .eq('cliente_id', user?.id);

      if (error) {
        console.error('[appointmentsAppService] Error:', error);
        throw error;
      }

      console.log('[appointmentsAppService] Client confirmed appointment');
    } catch (error) {
      console.error('[appointmentsAppService] Error:', error);
      throw error;
    }
  },

  /**
   * Cliente cancela la cita
   */
  async cancelAppointmentByClient(
    appointmentId: string,
    motivo?: string
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Primero obtener los datos de la cita para el email
      console.log('[appointmentsAppService] Obteniendo cita para cancelar:', appointmentId);
      const { data: appointment, error: fetchError } = await supabase
        .from('appointments_system')
        .select('*')
        .eq('id', appointmentId)
        .eq('cliente_id', user?.id)
        .maybeSingle();

      if (fetchError) {
        console.error('[appointmentsAppService] Error obteniendo cita:', fetchError);
        throw new Error(`Error obteniendo cita: ${fetchError.message}`);
      }

      if (!appointment) {
        console.error('[appointmentsAppService] Cita no encontrada');
        throw new Error('Cita no encontrada');
      }

      console.log('[appointmentsAppService] Cita obtenida:', appointment.id);

      const updateData: any = {
        estado: 'cancelada_cliente',
        cancelada_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (motivo) {
        updateData.notas_cliente = motivo;
      }

      console.log('[appointmentsAppService] Cancelando cita:', appointmentId);
      console.log('[appointmentsAppService] Motivo:', motivo);

      const { error } = await supabase
        .from('appointments_system')
        .update(updateData)
        .eq('id', appointmentId)
        .eq('cliente_id', user?.id);

      if (error) {
        console.error('[appointmentsAppService] Error cancelando cita:', error);
        throw error;
      }

      console.log('[appointmentsAppService] Cita cancelada exitosamente por el cliente');

      // Enviar email de notificación de cancelación (no bloquear si falla)
      try {
        await this.sendAppointmentNotificationEmail({
          ...appointment,
          ...updateData,
          emailType: 'cancelada',
        });
      } catch (emailError) {
        console.error('[appointmentsAppService] Error enviando email (no crítico):', emailError);
      }
    } catch (error) {
      console.error('[appointmentsAppService] Error:', error);
      throw error;
    }
  },

  /**
   * Cliente actualiza el estado a "en camino"
   */
  async markAsOnTheWay(appointmentId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('appointments_system')
        .update({
          estado: 'en_camino',
          updated_at: new Date().toISOString(),
        })
        .eq('id', appointmentId)
        .eq('cliente_id', user?.id);

      if (error) {
        console.error('[appointmentsAppService] Error:', error);
        throw error;
      }

      console.log('[appointmentsAppService] Client is on the way');
    } catch (error) {
      console.error('[appointmentsAppService] Error:', error);
      throw error;
    }
  },

  /**
   * Reagendar una cita
   */
  async rescheduleAppointment(
    appointmentId: string,
    nuevaFecha: string,
    nuevaHora: string,
    motivo?: string
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Primero obtener los datos anteriores de la cita para el email
      console.log('[appointmentsAppService] Obteniendo cita para reprogramar:', appointmentId);
      const { data: appointment, error: fetchError } = await supabase
        .from('appointments_system')
        .select('*')
        .eq('id', appointmentId)
        .eq('cliente_id', user?.id)
        .maybeSingle();

      if (fetchError) {
        console.error('[appointmentsAppService] Error obteniendo cita:', fetchError);
        throw new Error(`Error obteniendo cita: ${fetchError.message}`);
      }

      if (!appointment) {
        console.error('[appointmentsAppService] Cita no encontrada');
        throw new Error('Cita no encontrada');
      }

      console.log('[appointmentsAppService] Cita obtenida para reprogramar:', appointment.id);

      // Guardar fecha y hora anteriores para el email
      const previousDate = appointment.fecha_cita;
      const previousTime = appointment.hora_cita || appointment.hora_inicio;

      const updateData: any = {
        fecha_cita: nuevaFecha,
        hora_inicio: nuevaHora,
        hora_cita: nuevaHora,
        estado: 'reagendada',
        confirmada_cliente: false,
        confirmada_vendedor: false,
        updated_at: new Date().toISOString(),
      };

      if (motivo) {
        updateData.notas_cliente = motivo;
      }

      console.log('[appointmentsAppService] Reprogramando cita:', appointmentId);
      console.log('[appointmentsAppService] Fecha anterior:', previousDate, 'Hora:', previousTime);
      console.log('[appointmentsAppService] Nueva fecha:', nuevaFecha, 'Hora:', nuevaHora);

      const { error } = await supabase
        .from('appointments_system')
        .update(updateData)
        .eq('id', appointmentId)
        .eq('cliente_id', user?.id);

      if (error) {
        console.error('[appointmentsAppService] Error:', error);
        throw error;
      }

      console.log('[appointmentsAppService] Cita reprogramada exitosamente');

      // Enviar email de notificación de reprogramación (no bloquear si falla)
      try {
        await this.sendAppointmentNotificationEmail({
          ...appointment,
          ...updateData,
          emailType: 'reprogramada',
          previousDate: previousDate,
          previousTime: previousTime,
        });
      } catch (emailError) {
        console.error('[appointmentsAppService] Error enviando email (no crítico):', emailError);
      }
    } catch (error) {
      console.error('[appointmentsAppService] Error:', error);
      throw error;
    }
  },

  /**
   * Agregar notas del cliente a la cita
   */
  async addClientNotes(appointmentId: string, notas: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('appointments_system')
        .update({
          notas_cliente: notas,
          updated_at: new Date().toISOString(),
        })
        .eq('id', appointmentId)
        .eq('cliente_id', user?.id);

      if (error) {
        console.error('[appointmentsAppService] Error:', error);
        throw error;
      }

      console.log('[appointmentsAppService] Notes added');
    } catch (error) {
      console.error('[appointmentsAppService] Error:', error);
      throw error;
    }
  },

  /**
   * Obtener estadísticas de citas del cliente
   */
  async getClientAppointmentStats(clienteId?: string): Promise<{
    total: number;
    pendientes: number;
    confirmadas: number;
    completadas: number;
    canceladas: number;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = clienteId || user?.id;

      if (!userId) {
        return {
          total: 0,
          pendientes: 0,
          confirmadas: 0,
          completadas: 0,
          canceladas: 0,
        };
      }

      const { data, error } = await supabase
        .from('appointments_system')
        .select('estado')
        .eq('cliente_id', userId);

      if (error) {
        console.error('[appointmentsAppService] Error:', error);
        throw error;
      }

      const stats = {
        total: data.length,
        pendientes: data.filter(a => a.estado === 'pendiente').length,
        confirmadas: data.filter(a => a.estado === 'confirmada').length,
        completadas: data.filter(a => a.estado === 'completada').length,
        canceladas: data.filter(a =>
          a.estado === 'cancelada_cliente' || a.estado === 'cancelada_vendedor'
        ).length,
      };

      return stats;
    } catch (error) {
      console.error('[appointmentsAppService] Error:', error);
      throw error;
    }
  },

  /**
   * Enviar email de notificación al vendedor cuando se crea una cita
   */
  async sendAppointmentNotificationEmail(appointment: any): Promise<void> {
    try {
      const adminUrl = process.env.EXPO_PUBLIC_ADMIN_URL || 'https://admin.buscofacil.com';

      const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-CO', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      };

      const emailData: any = {
        appointmentId: appointment.id,
        clientName: appointment.cliente_nombre,
        clientEmail: appointment.cliente_email,
        clientPhone: appointment.cliente_celular,
        vendorName: appointment.vendedor_nombre,
        vendorEmail: appointment.vendedor_email,
        propertyTitle: appointment.inmueble_titulo,
        propertyAddress: appointment.inmueble_direccion,
        propertyPrice: appointment.inmueble_precio,
        appointmentDate: formatDate(appointment.fecha_cita),
        appointmentTime: appointment.hora_cita || appointment.hora_inicio,
        notes: appointment.notas_cliente,
        adminUrl: adminUrl,
        emailType: appointment.emailType || 'nueva',
      };

      // Si es reprogramación, agregar fecha y hora anteriores
      if (appointment.emailType === 'reprogramada' && appointment.previousDate) {
        emailData.previousDate = formatDate(appointment.previousDate);
        emailData.previousTime = appointment.previousTime;
      }

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Configuración de Supabase no disponible');
      }

      const url = `${supabaseUrl}/functions/v1/send-appointment-email`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al enviar email (${response.status})`);
      }

      const result = await response.json();
      console.log('[appointmentsAppService] Email enviado:', emailData.emailType);
    } catch (error: any) {
      // Solo registrar error en modo debug, ya que el email es no crítico
      if (process.env.NODE_ENV === 'development') {
        console.warn('[appointmentsAppService] Email notification failed (non-critical)');
      }
      throw error;
    }
  },
};

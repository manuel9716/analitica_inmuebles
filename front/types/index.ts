export interface PropertyFilters {
  propertyType?: 'casa' | 'apartamento' | 'lote' | 'oficina' | 'local';
  transactionType?: 'venta' | 'arriendo';
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  minArea?: number;
  maxArea?: number;
  location?: string;
  city?: string;
  neighborhood?: string;
  estrato?: number;
  features?: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  createdAt: string;
  filters?: PropertyFilters;
  selectedListingIds?: string[];
  frozenSelection?: boolean;
  availableListingIds?: string[];
}

export interface Listing {
  id: string;
  title: string;
  price: number;
  location: string;
  city?: string;
  neighborhood?: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[];
  description: string;
  propertyType: string;
  transactionType: string;
  estrato?: number;
  parking?: number;
  features?: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
  source?: string;
}

export type UserType = 'end_user' | 'admin' | 'broker' | 'propietario' | 'trabajador_facil' | 'asesor';

export interface UserProfile {
  id: string;
  full_name?: string;
  phone?: string;
  document_type?: 'CC' | 'CE' | 'PA';
  document_number?: string;
  user_type: UserType;
  created_at?: string;
  updated_at?: string;
}

export interface VoiceSettings {
  voice_enabled: boolean;
  voice_gender: 'male' | 'female';
  voice_rate: number;
  voice_pitch: number;
  voice_volume: number;
}

export interface Conversation {
  id: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SearchHistory {
  id: string;
  user_id: string;
  query: string;
  filters: PropertyFilters;
  results: Listing[];
  results_count?: number;
  created_at: string;
}

export type AppointmentStatus =
  | 'pendiente'
  | 'confirmada'
  | 'en_camino'
  | 'en_curso'
  | 'completada'
  | 'cancelada_cliente'
  | 'cancelada_vendedor'
  | 'no_asistio_cliente'
  | 'no_asistio_vendedor'
  | 'reagendada';

export interface Appointment {
  id: string;

  cliente_nombre: string;
  cliente_email: string;
  cliente_celular: string;
  cliente_id?: string;

  vendedor_nombre: string;
  vendedor_email: string;
  vendedor_celular: string;
  vendedor_id?: string;

  inmueble_id: string;
  inmueble_titulo: string;
  inmueble_tipo: string;
  inmueble_direccion: string;
  inmueble_ciudad: string;
  inmueble_departamento: string;
  inmueble_coordenadas?: {
    lat: number;
    lng: number;
  };
  inmueble_precio?: number;
  inmueble_imagen_url?: string;
  inmueble_url?: string;
  inmueble_habitaciones?: number;
  inmueble_banos?: number;
  inmueble_area?: number;
  inmueble_parqueaderos?: number;
  inmueble_estrato?: number;
  inmueble_barrio?: string;
  inmueble_tipo_negocio?: string;
  inmueble_descripcion?: string;
  inmueble_caracteristicas?: string[];
  inmueble_imagenes?: string[];
  inmueble_datos_completos?: any;

  fecha_cita: string;
  hora_inicio: string;
  hora_cita?: string;
  duracion_minutos: number;

  estado: AppointmentStatus;

  confirmada_cliente: boolean;
  confirmada_vendedor: boolean;

  notas_cliente?: string;
  notas_vendedor?: string;
  notas_sistema?: string;

  canal_comunicacion: 'app' | 'whatsapp' | 'llamada';

  created_at: string;
  updated_at: string;

  distance?: number;
}

export interface CreateAppointmentInput {
  cliente_nombre: string;
  cliente_email: string;
  cliente_celular: string;
  cliente_id?: string;

  vendedor_nombre: string;
  vendedor_email: string;
  vendedor_celular: string;
  vendedor_id?: string;

  inmueble_id: string;
  inmueble_titulo: string;
  inmueble_tipo: string;
  inmueble_direccion: string;
  inmueble_ciudad: string;
  inmueble_departamento: string;
  inmueble_coordenadas?: { lat: number; lng: number };
  inmueble_precio?: number;
  inmueble_imagen_url?: string;
  inmueble_url?: string;

  fecha_cita: string;
  hora_inicio: string;
  duracion_minutos?: number;

  notas_cliente?: string;
  canal_comunicacion?: 'app' | 'whatsapp' | 'llamada';
}

export interface Favorite {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
}

export interface SearchResponse {
  searchId: string;
  sources: string[];
  items: Listing[];
  total: number;
  summary: string;
  filters: PropertyFilters;
}

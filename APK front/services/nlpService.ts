import { PropertyFilters, Listing } from '@/types';
import { parseQuery as parseQueryLocal } from '@/utils/parseQuery';
import { apiClient } from './apiClient';

interface NLPApiResponse {
  criterios_inferidos?: {
    tipo?: string;
    habitaciones_min?: number;
    habitaciones_max?: number;
    banos_min?: number;
    banos_max?: number;
    precio_min?: number;
    precio_max?: number;
    area_min?: number;
    area_max?: number;
    tipo_negocio?: string;
    estrato?: number;
    zona?: string;
    ciudad?: string;
  };
  resultados?: any[];
  mensaje?: string;
  filters?: {
    type?: string;
    zone?: string;
    location?: string;
    rooms?: number[];
    bathrooms?: number[];
    price?: {
      min?: number;
      max?: number;
    };
    area?: {
      min?: number;
      max?: number;
    };
    transactionType?: string;
    estrato?: number;
    features?: string[];
  };
  confidence?: number;
}

function mapNLPResponseToFilters(nlpResponse: NLPApiResponse): PropertyFilters {
  const filters: PropertyFilters = {};

  // Handle new format (criterios_inferidos)
  if (nlpResponse.criterios_inferidos) {
    const criterios = nlpResponse.criterios_inferidos;

    if (criterios.tipo) {
      const typeMap: Record<string, PropertyFilters['propertyType']> = {
        'house': 'casa',
        'apartment': 'apartamento',
        'apartaestudio': 'apartamento',
        'commercial': 'local',
        'lot': 'lote',
        'office': 'oficina',
        'casa': 'casa',
        'apartamento': 'apartamento',
        'local': 'local',
        'lote': 'lote',
        'oficina': 'oficina',
      };
      filters.propertyType = typeMap[criterios.tipo.toLowerCase()];
    }

    if (criterios.zona || criterios.ciudad) {
      const location = criterios.zona || criterios.ciudad;
      filters.location = location;
      filters.city = location;
    }

    if (criterios.habitaciones_min) {
      filters.bedrooms = criterios.habitaciones_min;
    }

    if (criterios.banos_min) {
      filters.bathrooms = criterios.banos_min;
    }

    if (criterios.precio_min || criterios.precio_max) {
      if (criterios.precio_min) {
        filters.minPrice = criterios.precio_min;
      }
      if (criterios.precio_max) {
        filters.maxPrice = criterios.precio_max;
      }
    }

    if (criterios.area_min || criterios.area_max) {
      if (criterios.area_min) {
        filters.minArea = criterios.area_min;
      }
      if (criterios.area_max) {
        filters.maxArea = criterios.area_max;
      }
    }

    if (criterios.tipo_negocio) {
      const transactionMap: Record<string, PropertyFilters['transactionType']> = {
        'sale': 'venta',
        'rent': 'arriendo',
        'venta': 'venta',
        'arriendo': 'arriendo',
        'alquiler': 'arriendo',
      };
      filters.transactionType = transactionMap[criterios.tipo_negocio.toLowerCase()];
    }

    if (criterios.estrato) {
      filters.estrato = criterios.estrato;
    }

    return filters;
  }

  // Handle old format (filters) - fallback
  if (nlpResponse.filters) {
    if (nlpResponse.filters.type) {
      const typeMap: Record<string, PropertyFilters['propertyType']> = {
        'house': 'casa',
        'apartment': 'apartamento',
        'commercial': 'local',
        'lot': 'lote',
        'office': 'oficina',
        'casa': 'casa',
        'apartamento': 'apartamento',
        'local': 'local',
        'lote': 'lote',
        'oficina': 'oficina',
      };
      filters.propertyType = typeMap[nlpResponse.filters.type.toLowerCase()];
    }

    if (nlpResponse.filters.zone || nlpResponse.filters.location) {
      const location = nlpResponse.filters.zone || nlpResponse.filters.location;
      filters.location = location;
      filters.city = location;
    }

    if (nlpResponse.filters.rooms && nlpResponse.filters.rooms.length > 0) {
      filters.bedrooms = nlpResponse.filters.rooms[0];
    }

    if (nlpResponse.filters.bathrooms && nlpResponse.filters.bathrooms.length > 0) {
      filters.bathrooms = nlpResponse.filters.bathrooms[0];
    }

    if (nlpResponse.filters.price) {
      if (nlpResponse.filters.price.min) {
        filters.minPrice = nlpResponse.filters.price.min;
      }
      if (nlpResponse.filters.price.max) {
        filters.maxPrice = nlpResponse.filters.price.max;
      }
    }

    if (nlpResponse.filters.area) {
      if (nlpResponse.filters.area.min) {
        filters.minArea = nlpResponse.filters.area.min;
      }
      if (nlpResponse.filters.area.max) {
        filters.maxArea = nlpResponse.filters.area.max;
      }
    }

    if (nlpResponse.filters.transactionType) {
      const transactionMap: Record<string, PropertyFilters['transactionType']> = {
        'sale': 'venta',
        'rent': 'arriendo',
        'venta': 'venta',
        'arriendo': 'arriendo',
      };
      filters.transactionType = transactionMap[nlpResponse.filters.transactionType.toLowerCase()];
    }

    if (nlpResponse.filters.estrato) {
      filters.estrato = nlpResponse.filters.estrato;
    }

    if (nlpResponse.filters.features && nlpResponse.filters.features.length > 0) {
      filters.features = nlpResponse.filters.features;
    }
  }

  return filters;
}

function mapNLPResultToListing(result: any): Listing {
  // Build a comprehensive description
  let description = result.descripcion || '';
  if (!description && result.direccion) {
    description = `Propiedad ubicada en ${result.direccion}`;
  }
  if (!description) {
    const parts = [];
    if (result.tipo) parts.push(result.tipo);
    if (result.habitaciones) parts.push(`${result.habitaciones} habitaciones`);
    if (result.banos) parts.push(`${result.banos} baños`);
    if (result.area_privada || result.area_construida) {
      const area = result.area_privada || result.area_construida;
      parts.push(`${area}m²`);
    }
    description = parts.join(', ');
  }

  // Build features array
  const features = [];
  if (result.tiene_piscina) features.push('Piscina');
  if (result.tiene_gimnasio) features.push('Gimnasio');
  if (result.tiene_parqueadero || result.garajes > 0) features.push('Parqueadero');
  if (result.tiene_ascensor) features.push('Ascensor');
  if (result.tiene_seguridad) features.push('Seguridad');

  return {
    id: result.id?.toString() || Date.now().toString(),
    title: result.titulo || `${result.tipo || 'Inmueble'} en ${result.ciudad || 'Sin especificar'}`,
    price: result.precio_venta || result.precio || 0,
    location: result.direccion || result.ciudad || result.zona || 'Sin ubicación',
    city: result.ciudad || result.zona,
    neighborhood: result.barrio,
    bedrooms: result.habitaciones || 0,
    bathrooms: parseInt(result.banos) || result.banos_encoded || 0,
    area: result.area_privada || result.area_construida || result.area_total || 0,
    images: result.imagenes || (result.imagen_principal ? [result.imagen_principal] : []),
    description,
    propertyType: result.tipo?.toLowerCase() || 'casa',
    transactionType: result.tipo_negocio === 'arriendo' ? 'arriendo' : 'venta',
    estrato: result.estrato,
    parking: result.garajes,
    features: features.length > 0 ? features : undefined,
    coordinates: result.latitud && result.longitud ? {
      lat: result.latitud,
      lng: result.longitud,
    } : undefined,
    source: 'NLP API',
  };
}

export const nlpService = {
  async processQuery(query: string): Promise<PropertyFilters> {
    try {
      console.log('[NLP Service] Calling edge function nlp-proxy');
      console.log('[NLP Service] Query:', query);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const data = await apiClient.callEdgeFunction(
        'nlp-proxy',
        'POST',
        { query },
        false,
        controller.signal
      );

      clearTimeout(timeoutId);

      if (!data || (!data.filters && !data.criterios_inferidos)) {
        throw new Error('Invalid response from NLP API');
      }

      console.log('[NLP Service] API Response:', data);

      const filters = mapNLPResponseToFilters(data);
      console.log('[NLP Service] Mapped filters:', filters);

      return filters;
    } catch (error) {
      console.error('[NLP Service] Error calling NLP API:', error);
      console.log('[NLP Service] Falling back to local parsing');
      return parseQueryLocal(query);
    }
  },

  async processQueryWithResults(query: string): Promise<{ filters: PropertyFilters; listings?: Listing[]; message?: string }> {
    try {
      console.log('[NLP Service] Calling edge function nlp-proxy with results');
      console.log('[NLP Service] Query:', query);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const data = await apiClient.callEdgeFunction(
        'nlp-proxy',
        'POST',
        { query },
        false,
        controller.signal
      );

      clearTimeout(timeoutId);

      if (!data || (!data.filters && !data.criterios_inferidos)) {
        throw new Error('Invalid response from NLP API');
      }

      console.log('[NLP Service] API Response with results:', data);

      const filters = mapNLPResponseToFilters(data);
      console.log('[NLP Service] Mapped filters:', filters);

      const listings = data.resultados ? data.resultados.map(mapNLPResultToListing) : undefined;
      console.log('[NLP Service] Mapped listings count:', listings?.length);

      return {
        filters,
        listings,
        message: data.mensaje,
      };
    } catch (error) {
      console.error('[NLP Service] Error calling NLP API:', error);
      console.log('[NLP Service] Falling back to local parsing');
      return {
        filters: parseQueryLocal(query),
        listings: undefined,
        message: undefined,
      };
    }
  },
};

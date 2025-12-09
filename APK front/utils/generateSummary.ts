import { PropertyFilters } from '@/types';

export function generateSearchSummary(filters: PropertyFilters, total: number): string {
  if (total === 0) {
    return generateNoResultsSummary(filters);
  }

  const parts: string[] = [];

  parts.push(`Encontré ${total} ${total === 1 ? 'propiedad' : 'propiedades'}`);

  if (filters.propertyType) {
    const typeNames = {
      casa: 'casa',
      apartamento: 'apartamento',
      lote: 'lote',
      oficina: 'oficina',
      local: 'local comercial',
    };
    const typeName = typeNames[filters.propertyType] || filters.propertyType;
    parts.push(typeName + (total > 1 ? 's' : ''));
  }

  if (filters.location) {
    parts.push(`en ${filters.location}`);
  }

  if (filters.bedrooms) {
    parts.push(`con ${filters.bedrooms} ${filters.bedrooms === 1 ? 'habitación' : 'habitaciones'}`);
  }

  if (filters.bathrooms) {
    parts.push(`y ${filters.bathrooms} ${filters.bathrooms === 1 ? 'baño' : 'baños'}`);
  }

  if (filters.minPrice || filters.maxPrice) {
    if (filters.minPrice && filters.maxPrice) {
      parts.push(
        `entre $${(filters.minPrice / 1000000).toFixed(0)}M y $${(filters.maxPrice / 1000000).toFixed(0)}M`
      );
    } else if (filters.minPrice) {
      parts.push(`desde $${(filters.minPrice / 1000000).toFixed(0)}M`);
    } else if (filters.maxPrice) {
      parts.push(`hasta $${(filters.maxPrice / 1000000).toFixed(0)}M`);
    }
  }

  return parts.join(' ') + '.';
}

function generateNoResultsSummary(filters: PropertyFilters): string {
  const parts: string[] = ['No encontré propiedades'];

  if (filters.propertyType) {
    const typeNames = {
      casa: 'casas',
      apartamento: 'apartamentos',
      lote: 'lotes',
      oficina: 'oficinas',
      local: 'locales comerciales',
    };
    parts.push(typeNames[filters.propertyType] || filters.propertyType);
  }

  if (filters.location) {
    parts.push(`en ${filters.location}`);
  }

  if (filters.bedrooms) {
    parts.push(`con ${filters.bedrooms} ${filters.bedrooms === 1 ? 'habitación' : 'habitaciones'}`);
  }

  parts.push('con esas características exactas.');

  return parts.join(' ');
}

export function generateAlternativeSuggestions(filters: PropertyFilters): string {
  const suggestions: string[] = [];

  if (filters.location) {
    suggestions.push(`Prueba ampliar la búsqueda a zonas cercanas a ${filters.location}`);
  }

  if (filters.maxPrice) {
    const newMax = filters.maxPrice * 1.2;
    suggestions.push(
      `Intenta aumentar el presupuesto hasta $${(newMax / 1000000).toFixed(0)}M`
    );
  }

  if (filters.bedrooms && filters.bedrooms > 2) {
    suggestions.push(`Considera buscar propiedades con ${filters.bedrooms - 1} habitaciones`);
  }

  if (suggestions.length === 0) {
    return 'Intenta ajustar tus criterios de búsqueda o prueba con otra ubicación.';
  }

  return suggestions.join(', o ') + '.';
}

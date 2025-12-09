import { PropertyFilters } from '@/types';

const locationPatterns = [
  { pattern: /pance/i, value: 'Pance' },
  { pattern: /ciudad\s+jard[ií]n/i, value: 'Ciudad Jardín' },
  { pattern: /jamund[ií]/i, value: 'Jamundí' },
  { pattern: /el\s+ingenio|ingenio/i, value: 'El Ingenio' },
  { pattern: /norte/i, value: 'Norte' },
  { pattern: /sur/i, value: 'Sur' },
  { pattern: /oeste/i, value: 'Oeste' },
  { pattern: /cali/i, value: 'Cali' },
  { pattern: /yumbo/i, value: 'Yumbo' },
  { pattern: /palmira/i, value: 'Palmira' },
];

const typePatterns = [
  { pattern: /apartamento|apto|apart/i, value: 'apartamento' as const },
  { pattern: /casa|vivienda/i, value: 'casa' as const },
  { pattern: /local\s+comercial|local|negocio/i, value: 'local' as const },
  { pattern: /lote|terreno|tierra/i, value: 'lote' as const },
  { pattern: /oficina/i, value: 'oficina' as const },
  { pattern: /campestre|finca/i, value: 'casa' as const },
];

function extractLocation(query: string): string | undefined {
  for (const { pattern, value } of locationPatterns) {
    if (pattern.test(query)) {
      return value;
    }
  }
  return undefined;
}

function extractType(query: string): 'casa' | 'apartamento' | 'lote' | 'oficina' | 'local' | undefined {
  for (const { pattern, value } of typePatterns) {
    if (pattern.test(query)) {
      return value;
    }
  }
  return undefined;
}

function extractPrice(query: string): { min?: number; max?: number } | undefined {
  const priceRange = query.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*m(?:illones)?/i);
  if (priceRange) {
    return {
      min: parseFloat(priceRange[1]) * 1000000,
      max: parseFloat(priceRange[2]) * 1000000,
    };
  }

  const maxPrice = query.match(/hasta\s+(\d+(?:\.\d+)?)\s*m(?:illones)?/i);
  if (maxPrice) {
    return { max: parseFloat(maxPrice[1]) * 1000000 };
  }

  const minPrice = query.match(/desde\s+(\d+(?:\.\d+)?)\s*m(?:illones)?/i);
  if (minPrice) {
    return { min: parseFloat(minPrice[1]) * 1000000 };
  }

  const singlePrice = query.match(/(\d+)\s*m(?:illones)?/i);
  if (singlePrice) {
    const price = parseFloat(singlePrice[1]) * 1000000;
    return { min: price * 0.8, max: price * 1.2 };
  }

  return undefined;
}

function extractRooms(query: string): number | undefined {
  const roomsRange = query.match(/(\d+)\s*-\s*(\d+)\s*(?:hab(?:itaciones)?|cuartos)/i);
  if (roomsRange) {
    return parseInt(roomsRange[1]);
  }

  const singleRoom = query.match(/(\d+)\s*(?:hab(?:itaciones)?|cuartos)/i);
  if (singleRoom) {
    return parseInt(singleRoom[1]);
  }

  return undefined;
}

function extractBathrooms(query: string): number | undefined {
  const bathrooms = query.match(/(\d+)\s*ba[ñn]os?/i);
  if (bathrooms) {
    return parseInt(bathrooms[1]);
  }
  return undefined;
}

function extractArea(query: string): { min?: number; max?: number } | undefined {
  const areaRange = query.match(/(\d+)\s*-\s*(\d+)\s*m[²2]/i);
  if (areaRange) {
    return {
      min: parseInt(areaRange[1]),
      max: parseInt(areaRange[2]),
    };
  }

  const singleArea = query.match(/(\d+)\s*m[²2]/i);
  if (singleArea) {
    const area = parseInt(singleArea[1]);
    return { min: area * 0.9, max: area * 1.1 };
  }

  return undefined;
}

function extractTransactionType(query: string): 'venta' | 'arriendo' | undefined {
  if (/arriendo|alquiler|rentar/i.test(query)) {
    return 'arriendo';
  }
  if (/venta|comprar|vender/i.test(query)) {
    return 'venta';
  }
  return undefined;
}

function extractEstrato(query: string): number | undefined {
  const estrato = query.match(/estrato\s*(\d)/i);
  if (estrato) {
    return parseInt(estrato[1]);
  }
  return undefined;
}

function extractFeatures(query: string): string[] {
  const features: string[] = [];

  const featurePatterns = [
    { pattern: /piscina/i, value: 'Piscina' },
    { pattern: /jacuzzi/i, value: 'Jacuzzi' },
    { pattern: /gimnasio/i, value: 'Gimnasio' },
    { pattern: /parqueadero|garaje/i, value: 'Parqueadero' },
    { pattern: /jard[ií]n|patio/i, value: 'Jardín' },
    { pattern: /terraza|balc[óo]n/i, value: 'Terraza' },
    { pattern: /bbq|asador|parrilla/i, value: 'BBQ' },
    { pattern: /sal[óo]n\s+social/i, value: 'Salón social' },
    { pattern: /zona\s+de\s+juegos/i, value: 'Zona de juegos' },
    { pattern: /portería|vigilancia/i, value: 'Portería' },
    { pattern: /ascensor/i, value: 'Ascensor' },
    { pattern: /cuarto\s+[úu]til/i, value: 'Cuarto útil' },
  ];

  for (const { pattern, value } of featurePatterns) {
    if (pattern.test(query)) {
      features.push(value);
    }
  }

  return features;
}

export function parseQuery(query: string): PropertyFilters {
  const filters: PropertyFilters = {};

  const location = extractLocation(query);
  if (location) {
    filters.location = location;
    filters.city = location;
  }

  const type = extractType(query);
  if (type) {
    filters.propertyType = type;
  }

  const price = extractPrice(query);
  if (price) {
    if (price.min) filters.minPrice = price.min;
    if (price.max) filters.maxPrice = price.max;
  }

  const rooms = extractRooms(query);
  if (rooms) filters.bedrooms = rooms;

  const bathrooms = extractBathrooms(query);
  if (bathrooms) filters.bathrooms = bathrooms;

  const area = extractArea(query);
  if (area) {
    if (area.min) filters.minArea = area.min;
    if (area.max) filters.maxArea = area.max;
  }

  const transactionType = extractTransactionType(query);
  if (transactionType) filters.transactionType = transactionType;

  const estrato = extractEstrato(query);
  if (estrato) filters.estrato = estrato;

  const features = extractFeatures(query);
  if (features.length > 0) {
    filters.features = features;
  }

  return filters;
}

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Listing {
  id: string;
  title: string;
  price: number;
  location: string;
  city: string;
  neighborhood: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[];
  description: string;
  propertyType: string;
  transactionType: string;
  estrato: number;
  source: string;
  coordinates: { lat: number; lng: number };
  features?: string[];
  matching?: number;
}

interface SearchFilters {
  propertyType?: string;
  location?: string;
  city?: string;
  bedrooms?: number;
  bathrooms?: number;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  transactionType?: string;
  estrato?: number;
  features?: string[];
}

interface SearchRequest {
  filters?: SearchFilters;
  query?: string;
  sort?: string;
  page?: number;
  size?: number;
  selectedListings?: string[];
}

const MOCK_LISTINGS: Listing[] = [
  {
    id: '1',
    title: 'Hermosa casa en Pance con vista panorámica',
    price: 450000000,
    location: 'Pance',
    city: 'Cali',
    neighborhood: 'Pance',
    bedrooms: 3,
    bathrooms: 2,
    area: 180,
    images: [
      'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg',
      'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg',
    ],
    description: 'Casa con excelente ubicación, acabados de primera',
    propertyType: 'casa',
    transactionType: 'venta',
    estrato: 5,
    source: 'Fincaraíz',
    coordinates: { lat: 3.3482, lng: -76.5557 },
    features: ['Parqueadero', 'Jardín'],
  },
  {
    id: '2',
    title: 'Apartamento moderno en Ciudad Jardín',
    price: 380000000,
    location: 'Ciudad Jardín',
    city: 'Cali',
    neighborhood: 'Ciudad Jardín',
    bedrooms: 3,
    bathrooms: 2,
    area: 95,
    images: [
      'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg',
      'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg',
    ],
    description: 'Apartamento nuevo con acabados de lujo',
    propertyType: 'apartamento',
    transactionType: 'venta',
    estrato: 6,
    source: 'Metrocuadrado',
    coordinates: { lat: 3.3966, lng: -76.5422 },
    features: ['Gimnasio', 'Salón social'],
  },
  {
    id: '3',
    title: 'Casa campestre en Jamundí con piscina',
    price: 550000000,
    location: 'Jamundí',
    city: 'Jamundí',
    neighborhood: 'Jamundí',
    bedrooms: 4,
    bathrooms: 3,
    area: 250,
    images: [
      'https://images.pexels.com/photos/1974596/pexels-photo-1974596.jpeg',
      'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg',
    ],
    description: 'Casa campestre con amplias zonas verdes y piscina',
    propertyType: 'casa',
    transactionType: 'venta',
    estrato: 4,
    source: 'Properati',
    coordinates: { lat: 3.2644, lng: -76.5311 },
    features: ['Piscina', 'Jardín', 'BBQ'],
  },
  {
    id: '4',
    title: 'Local comercial en el norte de Cali',
    price: 320000000,
    location: 'Norte',
    city: 'Cali',
    neighborhood: 'Norte',
    bedrooms: 0,
    bathrooms: 2,
    area: 120,
    images: [
      'https://images.pexels.com/photos/534220/pexels-photo-534220.jpeg',
      'https://images.pexels.com/photos/439227/pexels-photo-439227.jpeg',
    ],
    description: 'Local comercial en excelente ubicación',
    propertyType: 'local',
    transactionType: 'venta',
    estrato: 5,
    source: 'Inmuebles24',
    coordinates: { lat: 3.4516, lng: -76.5320 },
    features: ['Parqueadero', 'Bodega'],
  },
  {
    id: '5',
    title: 'Apartamento en Pance cerca al río',
    price: 420000000,
    location: 'Pance',
    city: 'Cali',
    neighborhood: 'Pance',
    bedrooms: 3,
    bathrooms: 2,
    area: 105,
    images: [
      'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg',
      'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg',
    ],
    description: 'Apartamento con balcón y vista al río',
    propertyType: 'apartamento',
    transactionType: 'venta',
    estrato: 5,
    source: 'Fincaraíz',
    coordinates: { lat: 3.3501, lng: -76.5548 },
    features: ['Balcón', 'Vista'],
  },
  {
    id: '6',
    title: 'Casa en El Ingenio con jardín',
    price: 480000000,
    location: 'El Ingenio',
    city: 'Cali',
    neighborhood: 'El Ingenio',
    bedrooms: 4,
    bathrooms: 3,
    area: 200,
    images: [
      'https://images.pexels.com/photos/1115804/pexels-photo-1115804.jpeg',
      'https://images.pexels.com/photos/280222/pexels-photo-280222.jpeg',
    ],
    description: 'Casa con amplio jardín y terraza',
    propertyType: 'casa',
    transactionType: 'venta',
    estrato: 6,
    source: 'Metrocuadrado',
    coordinates: { lat: 3.3890, lng: -76.5234 },
    features: ['Jardín', 'Terraza', 'Parqueadero'],
  },
  {
    id: '7',
    title: 'Lote para construir en Yumbo',
    price: 280000000,
    location: 'Yumbo',
    city: 'Yumbo',
    neighborhood: 'Yumbo',
    bedrooms: 0,
    bathrooms: 0,
    area: 400,
    images: [
      'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg',
      'https://images.pexels.com/photos/323705/pexels-photo-323705.jpeg',
    ],
    description: 'Lote plano listo para construir',
    propertyType: 'lote',
    transactionType: 'venta',
    estrato: 3,
    source: 'Properati',
    coordinates: { lat: 3.5682, lng: -76.5058 },
    features: [],
  },
  {
    id: '8',
    title: 'Apartamento en Ciudad Jardín con parqueadero',
    price: 360000000,
    location: 'Ciudad Jardín',
    city: 'Cali',
    neighborhood: 'Ciudad Jardín',
    bedrooms: 2,
    bathrooms: 2,
    area: 85,
    images: [
      'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg',
      'https://images.pexels.com/photos/439227/pexels-photo-439227.jpeg',
    ],
    description: 'Apartamento con 2 parqueaderos y cuarto útil',
    propertyType: 'apartamento',
    transactionType: 'venta',
    estrato: 6,
    source: 'Inmuebles24',
    coordinates: { lat: 3.3955, lng: -76.5411 },
    features: ['Parqueadero', 'Cuarto útil'],
  },
];

function calculateMatching(listing: Listing, filters: SearchFilters): number {
  let score = 0;
  let totalCriteria = 0;

  if (filters.propertyType) {
    totalCriteria++;
    if (listing.propertyType === filters.propertyType) score++;
  }

  if (filters.location || filters.city) {
    totalCriteria++;
    const searchLoc = (filters.location || filters.city || '').toLowerCase();
    const matchesLocation = listing.location?.toLowerCase().includes(searchLoc);
    const matchesCity = listing.city?.toLowerCase().includes(searchLoc);
    const matchesNeighborhood = listing.neighborhood?.toLowerCase().includes(searchLoc);
    if (matchesLocation || matchesCity || matchesNeighborhood) score++;
  }

  if (filters.bedrooms) {
    totalCriteria++;
    if (listing.bedrooms === filters.bedrooms) score++;
  }

  if (filters.bathrooms) {
    totalCriteria++;
    if (listing.bathrooms === filters.bathrooms) score++;
  }

  if (filters.minPrice || filters.maxPrice) {
    totalCriteria++;
    const inRange = (!filters.minPrice || listing.price >= filters.minPrice) &&
                    (!filters.maxPrice || listing.price <= filters.maxPrice);
    if (inRange) score++;
  }

  if (filters.minArea || filters.maxArea) {
    totalCriteria++;
    const inRange = (!filters.minArea || listing.area >= filters.minArea) &&
                    (!filters.maxArea || listing.area <= filters.maxArea);
    if (inRange) score++;
  }

  if (filters.transactionType) {
    totalCriteria++;
    if (listing.transactionType === filters.transactionType) score++;
  }

  if (filters.estrato) {
    totalCriteria++;
    if (listing.estrato === filters.estrato) score++;
  }

  if (filters.features && filters.features.length > 0) {
    totalCriteria++;
    const hasAllFeatures = filters.features.every(feature =>
      listing.features?.some(f => f.toLowerCase().includes(feature.toLowerCase()))
    );
    if (hasAllFeatures) score++;
  }

  return totalCriteria > 0 ? (score / totalCriteria) * 100 : 0;
}

function filterListings(listings: Listing[], filters: SearchFilters): Listing[] {
  return listings.filter(listing => {
    if (filters.propertyType && listing.propertyType !== filters.propertyType) return false;

    if (filters.location || filters.city) {
      const searchLoc = (filters.location || filters.city || '').toLowerCase();
      const matchesLocation = listing.location?.toLowerCase().includes(searchLoc);
      const matchesCity = listing.city?.toLowerCase().includes(searchLoc);
      const matchesNeighborhood = listing.neighborhood?.toLowerCase().includes(searchLoc);
      if (!matchesLocation && !matchesCity && !matchesNeighborhood) return false;
    }

    if (filters.bedrooms && listing.bedrooms !== filters.bedrooms) return false;
    if (filters.bathrooms && listing.bathrooms !== filters.bathrooms) return false;

    if (filters.minPrice && listing.price < filters.minPrice) return false;
    if (filters.maxPrice && listing.price > filters.maxPrice) return false;

    if (filters.minArea && listing.area < filters.minArea) return false;
    if (filters.maxArea && listing.area > filters.maxArea) return false;

    if (filters.transactionType && listing.transactionType !== filters.transactionType) return false;

    if (filters.estrato && listing.estrato !== filters.estrato) return false;

    if (filters.features && filters.features.length > 0) {
      const hasAllFeatures = filters.features.every(feature =>
        listing.features?.some(f => f.toLowerCase().includes(feature.toLowerCase()))
      );
      if (!hasAllFeatures) return false;
    }

    return true;
  });
}

function generateSummary(filters: SearchFilters, total: number): string {
  if (total === 0) {
    return `No encontré ${getPropertyTypeName(filters.propertyType)} en ${filters.location || filters.city || 'esa zona'} con esas características exactas.`;
  }

  let summary = `Encontré ${total} ${getPropertyTypeName(filters.propertyType, total > 1)}`;

  if (filters.location || filters.city) {
    summary += ` en ${filters.location || filters.city}`;
  }

  if (filters.bedrooms) {
    summary += ` con ${filters.bedrooms} ${filters.bedrooms === 1 ? 'habitación' : 'habitaciones'}`;
  }

  if (filters.minPrice || filters.maxPrice) {
    const minStr = filters.minPrice ? (filters.minPrice / 1000000).toFixed(0) : '0';
    const maxStr = filters.maxPrice ? (filters.maxPrice / 1000000).toFixed(0) : '∞';
    summary += ` entre $${minStr}M y $${maxStr}M`;
  }

  if (filters.features && filters.features.length > 0) {
    summary += ` con ${filters.features.join(', ')}`;
  }

  summary += '.';
  return summary;
}

function getPropertyTypeName(type: string | undefined, plural: boolean = false): string {
  const types: Record<string, { singular: string; plural: string }> = {
    apartamento: { singular: 'apartamento', plural: 'apartamentos' },
    casa: { singular: 'casa', plural: 'casas' },
    local: { singular: 'local comercial', plural: 'locales comerciales' },
    lote: { singular: 'lote', plural: 'lotes' },
    oficina: { singular: 'oficina', plural: 'oficinas' },
  };

  const typeInfo = types[type || ''] || { singular: 'inmueble', plural: 'inmuebles' };
  return plural ? typeInfo.plural : typeInfo.singular;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const requestData: SearchRequest = await req.json();
    const { filters = {}, sort = 'matching', page = 1, size = 20, selectedListings = [] } = requestData;

    let baseListings = MOCK_LISTINGS;

    if (selectedListings && selectedListings.length > 0) {
      baseListings = MOCK_LISTINGS.filter(listing => selectedListings.includes(listing.id));
    }

    const filteredListings = filterListings(baseListings, filters);

    const listingsWithMatching = filteredListings.map(listing => ({
      ...listing,
      matching: calculateMatching(listing, filters),
    }));

    if (sort === 'matching') {
      listingsWithMatching.sort((a, b) => (b.matching || 0) - (a.matching || 0));
    } else if (sort === 'price_asc') {
      listingsWithMatching.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
      listingsWithMatching.sort((a, b) => b.price - a.price);
    }

    const startIndex = (page - 1) * size;
    const endIndex = startIndex + size;
    const paginatedListings = listingsWithMatching.slice(startIndex, endIndex);

    const sources = Array.from(new Set(filteredListings.map(l => l.source)));
    const summary = generateSummary(filters, filteredListings.length);

    const response = {
      items: paginatedListings,
      total: filteredListings.length,
      page,
      size,
      sources,
      summary,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in listings-search:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error en la búsqueda' }),
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
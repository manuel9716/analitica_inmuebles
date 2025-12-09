import { Listing } from '@/types';

export const MOCK_LISTINGS: Listing[] = [
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
    features: ['Parqueadero'],
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
    features: ['Terraza'],
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

export function filterListings(listings: Listing[], filters: any): Listing[] {
  return listings.filter(listing => {
    if (filters.propertyType && listing.propertyType !== filters.propertyType) return false;

    if (filters.location) {
      const searchLoc = filters.location.toLowerCase();
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
      const hasAllFeatures = filters.features.every((feature: string) =>
        listing.features?.some(f => f.toLowerCase().includes(feature.toLowerCase()))
      );
      if (!hasAllFeatures) return false;
    }

    return true;
  });
}

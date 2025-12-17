import React, { useState } from 'react';
import { View, ScrollView, TextInput, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { apiClient } from '@/services/apiClient';
import { nlpService } from '@/services/nlpService';
import type { PropertyFilters, Listing } from '@/types';

const sortOptions = [
  { value: 'matching', label: 'Afinidad IA (matching)' },
  { value: 'price_asc', label: 'Precio ascendente' },
  { value: 'price_desc', label: 'Precio descendente' },
  { value: 'newest', label: 'Más recientes' },
] as const;

export default function IADebugScreen() {
  const [query, setQuery] = useState('Apartamento en Chapinero 2 habitaciones máximo 2 millones');
  const [sort, setSort] = useState<'matching' | 'price_asc' | 'price_desc' | 'newest'>('matching');

  const [nlpFilters, setNlpFilters] = useState<PropertyFilters | null>(null);
  const [nlpRaw, setNlpRaw] = useState<any | null>(null);
  const [searchResults, setSearchResults] = useState<Listing[] | null>(null);
  const [searchRaw, setSearchRaw] = useState<any | null>(null);

  const [loadingNlp, setLoadingNlp] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunNlp = async () => {
    setLoadingNlp(true);
    setError(null);
    setNlpFilters(null);
    setNlpRaw(null);

    try {
      const filters = await nlpService.processQuery(query);
      setNlpFilters(filters);

      // Para debug, volvemos a llamar a la API de forma cruda vía Edge Function
      const raw = await apiClient.callEdgeFunction('nlp-proxy', 'POST', { query }, false);
      setNlpRaw(raw);
    } catch (e: any) {
      setError(e?.message || 'Error procesando NLP');
    } finally {
      setLoadingNlp(false);
    }
  };

  const handleRunSearch = async () => {
    setLoadingSearch(true);
    setError(null);
    setSearchResults(null);
    setSearchRaw(null);

    try {
      // Usamos los filtros inferidos si existen, si no, el front enviará {}.
      const filtersToUse: PropertyFilters | undefined = nlpFilters || undefined;

      const response = await apiClient.searchProperties(query, filtersToUse, {
        sort,
      });

      setSearchResults(response.items || []);

      // Para ver la respuesta cruda de la Edge Function listings-search,
      // repetimos la llamada manualmente.
      const requestBody: any = {
        filters: filtersToUse || {},
        query,
        sort,
        page: 1,
        size: 20,
      };

      const raw = await apiClient.callEdgeFunction('listings-search', 'POST', requestBody, false);
      setSearchRaw(raw);
    } catch (e: any) {
      setError(e?.message || 'Error ejecutando búsqueda IA');
    } finally {
      setLoadingSearch(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16, backgroundColor: '#020617' }}>
      <Text style={{ fontSize: 22, fontWeight: '600', color: 'white', marginBottom: 12 }}>
        Debug IA (NLP + Búsqueda)
      </Text>

      <Text style={{ color: '#9ca3af', marginBottom: 4 }}>Consulta en lenguaje natural</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Escribe lo que buscaría un usuario..."
        placeholderTextColor="#6b7280"
        multiline
        style={{
          minHeight: 80,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#374151',
          padding: 10,
          color: 'white',
          marginBottom: 12,
        }}
      />

      <Text style={{ color: '#9ca3af', marginBottom: 4 }}>Orden de resultados (sort)</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
        {sortOptions.map(opt => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => setSort(opt.value)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 9999,
              borderWidth: 1,
              borderColor: sort === opt.value ? '#22c55e' : '#374151',
              backgroundColor: sort === opt.value ? '#022c22' : 'transparent',
              marginRight: 8,
              marginBottom: 8,
            }}
          >
            <Text style={{ color: sort === opt.value ? '#bbf7d0' : '#e5e7eb', fontSize: 12 }}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flexDirection: 'row', marginBottom: 16 }}>
        <TouchableOpacity
          onPress={handleRunNlp}
          style={{
            flex: 1,
            backgroundColor: '#2563eb',
            paddingVertical: 10,
            borderRadius: 8,
            alignItems: 'center',
            marginRight: 8,
          }}
        >
          {loadingNlp ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ color: 'white', fontWeight: '600' }}>Probar NLP (nlp-proxy)</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleRunSearch}
          style={{
            flex: 1,
            backgroundColor: '#16a34a',
            paddingVertical: 10,
            borderRadius: 8,
            alignItems: 'center',
            marginLeft: 8,
          }}
        >
          {loadingSearch ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ color: 'white', fontWeight: '600' }}>Probar búsqueda (listings-search)</Text>
          )}
        </TouchableOpacity>
      </View>

      {error && (
        <Text style={{ color: '#fecaca', marginBottom: 12 }}>Error: {error}</Text>
      )}

      {nlpFilters && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: '#a5b4fc', fontWeight: '600', marginBottom: 4 }}>
            Filtros inferidos (mapeados para el front)
          </Text>
          <Text style={{ color: '#e5e7eb', fontSize: 12, fontFamily: 'Courier' }}>
            {JSON.stringify(nlpFilters, null, 2)}
          </Text>
        </View>
      )}

      {nlpRaw && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: '#a5b4fc', fontWeight: '600', marginBottom: 4 }}>
            Respuesta cruda de nlp-proxy
          </Text>
          <Text style={{ color: '#e5e7eb', fontSize: 12, fontFamily: 'Courier' }}>
            {JSON.stringify(nlpRaw, null, 2)}
          </Text>
        </View>
      )}

      {searchResults && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: '#a5b4fc', fontWeight: '600', marginBottom: 4 }}>
            Resultados (mapeados a Listing[])
          </Text>
          <Text style={{ color: '#e5e7eb', fontSize: 12, fontFamily: 'Courier' }}>
            {JSON.stringify(searchResults.slice(0, 5), null, 2)}
          </Text>
          <Text style={{ color: '#9ca3af', fontSize: 12 }}>
            Mostrando hasta 5 elementos de {searchResults.length}
          </Text>
        </View>
      )}

      {searchRaw && (
        <View style={{ marginBottom: 32 }}>
          <Text style={{ color: '#a5b4fc', fontWeight: '600', marginBottom: 4 }}>
            Respuesta cruda de listings-search
          </Text>
          <Text style={{ color: '#e5e7eb', fontSize: 12, fontFamily: 'Courier' }}>
            {JSON.stringify(searchRaw, null, 2)}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

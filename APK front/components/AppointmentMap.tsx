import React from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';

interface AppointmentMapProps {
  latitude: number;
  longitude: number;
  title: string;
  description: string;
}

const WebMap = ({ latitude, longitude, title }: { latitude: number; longitude: number; title: string }) => {
  const mapUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  return (
    <View style={styles.webMapContainer}>
      <iframe
        style={styles.webMap as any}
        src={mapUrl}
        frameBorder="0"
        scrolling="no"
        title={title}
      />
    </View>
  );
};

export default function AppointmentMap({
  latitude,
  longitude,
  title,
  description,
}: AppointmentMapProps) {
  if (Platform.OS === 'web') {
    return <WebMap latitude={latitude} longitude={longitude} title={title} />;
  }

  return <View style={styles.map}><Text>Mapa no disponible</Text></View>;
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  webMapContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  webMap: {
    width: '100%',
    height: '100%',
    border: 'none',
  },
});

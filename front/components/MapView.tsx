import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

interface MapViewProps {
  latitude: number;
  longitude: number;
  title: string;
}

export default function MapView({ latitude, longitude, title }: MapViewProps) {
  if (Platform.OS === 'web') {
    const MapIframe = require('react-native-web').View;
    return (
      <View style={styles.container}>
        <iframe
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}&layer=mapnik&marker=${latitude},${longitude}`}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          title={title}
        />
      </View>
    );
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * { margin: 0; padding: 0; }
          html, body { height: 100%; width: 100%; }
          #map { height: 100%; width: 100%; }
          .leaflet-control-zoom {
            border: 2px solid rgba(0,0,0,0.2);
            border-radius: 4px;
          }
          .leaflet-control-zoom a {
            font-size: 18px;
            line-height: 30px;
            width: 30px;
            height: 30px;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map', {
            center: [${latitude}, ${longitude}],
            zoom: 15,
            scrollWheelZoom: false,
            dragging: true,
            touchZoom: true,
            doubleClickZoom: true,
            boxZoom: true,
            tap: true,
            zoomControl: true
          });

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
          }).addTo(map);

          const marker = L.marker([${latitude}, ${longitude}]).addTo(map);
          marker.bindPopup('${title.replace(/'/g, "\\'")}');
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 300,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
  },
});

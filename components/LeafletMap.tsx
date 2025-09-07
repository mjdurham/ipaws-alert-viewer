'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents, CircleMarker, Polygon, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { IPAWSAlert } from '@/types/ipaws';
import { parseAlertBoundaries, parseAlertMarkers, getAlertBounds } from '@/lib/geocodeParser';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LeafletMapProps {
  alerts: IPAWSAlert[];
  onBoundsChange: (bounds: { north: number; south: number; east: number; west: number }) => void;
  center?: { latitude: number; longitude: number };
  selectedAlert?: IPAWSAlert | null;
  onAlertClick?: (alert: IPAWSAlert) => void;
}

// Component to handle map events
function MapEventHandler({ onBoundsChange, onMapReady }: { onBoundsChange: (bounds: any) => void; onMapReady?: () => void }) {
  const map = useMapEvents({
    moveend: () => {
      const bounds = map.getBounds();
      onBoundsChange({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      });
    },
    load: () => {
      onMapReady?.();
    }
  });
  
  useEffect(() => {
    // Call onMapReady immediately if map is already loaded
    if (map && onMapReady) {
      onMapReady();
    }
  }, [map, onMapReady]);
  
  return null;
}

// Component to handle center changes
function MapCenterHandler({ center }: { center?: { latitude: number; longitude: number } }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.flyTo([center.latitude, center.longitude], 10);
    }
  }, [center, map]);
  
  return null;
}

// Component to handle selected alert and zoom to its boundaries
function SelectedAlertHandler({ selectedAlert }: { selectedAlert?: IPAWSAlert | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (!selectedAlert) return;
    
    const points = getAlertBounds(selectedAlert);
    
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [selectedAlert, map]);
  
  return null;
}

// Locate control component
function LocateControl() {
  const map = useMap();
  
  useEffect(() => {
    // Create custom locate button
    const LocateButton = L.Control.extend({
      options: {
        position: 'topright'
      },
      
      onAdd: function() {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const button = L.DomUtil.create('a', 'leaflet-control-locate', container);
        button.innerHTML = '📍';
        button.href = '#';
        button.title = 'Locate me';
        button.style.fontSize = '18px';
        button.style.width = '30px';
        button.style.height = '30px';
        button.style.lineHeight = '30px';
        button.style.textAlign = 'center';
        button.style.cursor = 'pointer';
        
        L.DomEvent.on(button, 'click', function(e) {
          L.DomEvent.preventDefault(e);
          map.locate({ setView: true, maxZoom: 12 });
        });
        
        return container;
      }
    });
    
    const control = new LocateButton();
    control.addTo(map);
    
    // Handle location found
    map.on('locationfound', (e) => {
      const radius = e.accuracy / 2;
      L.marker(e.latlng).addTo(map);
      L.circle(e.latlng, radius).addTo(map);
    });
    
    // Handle location error
    map.on('locationerror', (e) => {
      alert('Location access denied or unavailable');
    });
    
    return () => {
      control.remove();
    };
  }, [map]);
  
  return null;
}

const LeafletMap: React.FC<LeafletMapProps> = ({ alerts, onBoundsChange, center, selectedAlert, onAlertClick }) => {
  const [mapCenter] = useState<[number, number]>([39.50, -98.35]);
  const [zoom] = useState(4);
  const [mapReady, setMapReady] = useState(false);
  
  const handleMapReady = useCallback(() => {
    setMapReady(true);
  }, []);
  
  // Process alerts to get marker positions
  const markers = React.useMemo(() => {
    return parseAlertMarkers(alerts);
  }, [alerts]);
  
  const getSeverityColor = (alert: IPAWSAlert) => {
    const severity = alert.info?.[0]?.severity;
    switch (severity) {
      case 'Extreme': return '#FF0000';
      case 'Severe': return '#FFA500';
      case 'Moderate': return '#FFFF00';
      case 'Minor': return '#00FF00';
      default: return '#0080FF';
    }
  };
  
  // Process selected alert boundaries
  const boundaries = React.useMemo(() => {
    return parseAlertBoundaries(selectedAlert);
  }, [selectedAlert]);
  
  return (
    <MapContainer
      center={mapCenter}
      zoom={zoom}
      style={{ width: '100%', height: '100%' }}
      className="leaflet-container"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapEventHandler 
        onBoundsChange={onBoundsChange} 
        onMapReady={handleMapReady}
      />
      <MapCenterHandler center={center} />
      <SelectedAlertHandler selectedAlert={selectedAlert} />
      <LocateControl />
      
      {/* Render boundaries for selected alert only when map is ready */}
      {mapReady && boundaries.polygons.map((polygon, idx) => (
        <Polygon
          key={`polygon-${idx}`}
          positions={polygon}
          interactive={false}
          pathOptions={{
            color: '#FF0000',
            weight: 2,
            opacity: 0.8,
            fillColor: '#FF0000',
            fillOpacity: 0.2
          }}
        />
      ))}
      
      {mapReady && boundaries.circles.map((circle, idx) => (
        <Circle
          key={`circle-${idx}`}
          center={circle.center}
          radius={circle.radius}
          interactive={false}
          pathOptions={{
            color: '#FF0000',
            weight: 2,
            opacity: 0.8,
            fillColor: '#FF0000',
            fillOpacity: 0.2
          }}
        />
      ))}
      
      {markers.map(marker => (
        <CircleMarker
          key={marker.id}
          center={marker.position}
          radius={8}
          pathOptions={{
            fillColor: getSeverityColor(marker.alert),
            color: selectedAlert === marker.alert ? '#000' : 'white',
            weight: selectedAlert === marker.alert ? 3 : 2,
            opacity: 1,
            fillOpacity: 0.8
          }}
          eventHandlers={{
            click: () => {
              if (onAlertClick) {
                onAlertClick(marker.alert);
              }
            }
          }}
        />
      ))}
    </MapContainer>
  );
};

export default LeafletMap;
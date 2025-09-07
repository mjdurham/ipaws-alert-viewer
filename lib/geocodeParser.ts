import { IPAWSAlert, AlertArea, CircleGeoJSON } from '@/types/ipaws';
import { Polygon } from 'geojson';

export interface ParsedBoundary {
  polygons: Array<[number, number][]>;
  circles: Array<{
    center: [number, number];
    radius: number;
  }>;
}

export interface ParsedMarker {
  id: string;
  position: [number, number];
  alert: IPAWSAlert;
}

/**
 * Parse polygon data from various formats into Leaflet-compatible coordinates
 */
function parsePolygon(polygon: Polygon | undefined): Array<[number, number][]> {
  const result: Array<[number, number][]> = [];
  
  if (!polygon) return result;
  
  // Handle GeoJSON format
  const coordinates = polygon.coordinates;
  if (Array.isArray(coordinates) && coordinates.length > 0) {
    // GeoJSON polygon format [[[lon, lat], ...]]
    const coords = coordinates[0].map((coord) => {
      return [coord[1], coord[0]] as [number, number]; // Swap to [lat, lon] for Leaflet
    }).filter((c: [number, number]) => !isNaN(c[0]) && !isNaN(c[1]));
    
    if (coords.length > 2) {
      result.push(coords);
    }
  }
  
  return result;
}

/**
 * Parse circle data from GeoJSON format
 */
function parseCircles(circle: CircleGeoJSON | undefined): Array<{ center: [number, number]; radius: number }> {
  const result: Array<{ center: [number, number]; radius: number }> = [];
  
  if (!circle) return result;

  // Handle GeoJSON Circle with radius
  if (circle.coordinates) {
    const [lon, lat] = circle.coordinates;
    const radiusKm = circle.radius || 0;
    
    if (!isNaN(lat) && !isNaN(lon) && radiusKm > 0) {
      result.push({
        center: [lat, lon],
        radius: radiusKm * 1000 // Convert km to meters for Leaflet
      });
    }
  }
  
  return result;
}

/**
 * Parse alert boundaries for rendering on the map
 */
export function parseAlertBoundaries(alert: IPAWSAlert | null | undefined): ParsedBoundary {
  const result: ParsedBoundary = {
    polygons: [],
    circles: []
  };
  
  if (!alert || !alert.info) return result;
  
  alert.info.forEach(info => {
    if (!info.area) return;
    
    info.area.forEach(area => {
      // Parse polygons
      const polygons = parsePolygon(area.polygon);
      result.polygons.push(...polygons);
      
      // Parse circles
      const circles = parseCircles(area.circle);
      result.circles.push(...circles);
    });
  });
  
  return result;
}

/**
 * Get the center point of an area (for marker placement)
 */
export function getAreaCenter(area: AlertArea): [number, number] | null {
  // Try to get center from polygon
  if (area.polygon) {
    const polygons = parsePolygon(area.polygon);
    if (polygons.length > 0 && polygons[0].length > 0) {
      const coords = polygons[0];
      const lat = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
      const lon = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
      return [lat, lon];
    }
  }
  
  // Try to get center from circle
  if (area.circle) {
    const circles = parseCircles(area.circle);
    if (circles.length > 0) {
      return circles[0].center;
    }
  }
  
  return null;
}

/**
 * Parse all alerts to extract marker positions
 */
export function parseAlertMarkers(alerts: IPAWSAlert[]): ParsedMarker[] {
  const markers: ParsedMarker[] = [];
  
  alerts.forEach(alert => {
    if (!alert.info) return;
    
    alert.info.forEach(info => {
      if (!info.area) return;
      
      info.area.forEach(area => {
        const center = getAreaCenter(area);
        if (center) {
          markers.push({
            id: `${alert.cogId}-${Math.random()}`,
            position: center,
            alert
          });
        }
      });
    });
  });
  
  return markers;
}

/**
 * Get bounds for zooming to an alert
 */
export function getAlertBounds(alert: IPAWSAlert | null | undefined): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  
  if (!alert || !alert.info) return points;
  
  alert.info.forEach(info => {
    if (!info.area) return;
    
    info.area.forEach(area => {
      // Get points from polygons
      const polygons = parsePolygon(area.polygon);
      polygons.forEach(polygon => {
        points.push(...polygon);
      });
      
      // Get points from circles
      const circles = parseCircles(area.circle);
      circles.forEach(circle => {
        points.push(circle.center);
      });
    });
  });
  
  return points;
}
import axios from 'axios';
import { IPAWSAlert } from '@/types/ipaws';

const API_BASE_URL = 'https://www.fema.gov/api/open/v1/IpawsArchivedAlerts';

export interface FetchAlertsParams {
  startDate: Date;
  endDate: Date;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  zipCode?: string;
}

export async function fetchIPAWSAlerts(params: FetchAlertsParams): Promise<IPAWSAlert[]> {
  const { startDate, endDate, bounds } = params;
  
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  let filter = `sent ge '${startDateStr}' and sent le '${endDateStr}'`;
  
  const queryParams = new URLSearchParams({
    '$filter': filter,
    '$top': '1000',
    '$orderby': 'sent desc'
  });
  
  try {
    const response = await axios.get(`${API_BASE_URL}?${queryParams.toString()}`);
    
    if (response.data && response.data.IpawsArchivedAlerts) {
      const alerts = response.data.IpawsArchivedAlerts;
      
      if (bounds) {
        return filterAlertsByBounds(alerts, bounds);
      }
      
      return alerts;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching IPAWS alerts:', error);
    return [];
  }
}

function filterAlertsByBounds(alerts: IPAWSAlert[], bounds: { north: number; south: number; east: number; west: number }) {
  return alerts.filter(alert => {
    if (!alert.info || alert.info.length === 0) return false;
    
    for (const info of alert.info) {
      if (!info.area) continue;
      
      for (const area of info.area) {
        if (area.polygon && area.polygon.length > 0) {
          for (const polygon of area.polygon) {
            const coords = parsePolygon(polygon);
            if (coords && isPolygonInBounds(coords, bounds)) {
              return true;
            }
          }
        }
        
        if (area.circle && area.circle.length > 0) {
          for (const circle of area.circle) {
            const circleData = parseCircle(circle);
            if (circleData && isCircleInBounds(circleData, bounds)) {
              return true;
            }
          }
        }
      }
    }
    
    return false;
  });
}

function parsePolygon(polygonStr: string): Array<[number, number]> | null {
  try {
    const coords = polygonStr.split(' ').map(coord => {
      const [lat, lon] = coord.split(',').map(Number);
      return [lon, lat] as [number, number];
    });
    return coords;
  } catch {
    return null;
  }
}

function parseCircle(circleStr: string): { center: [number, number]; radius: number } | null {
  try {
    const parts = circleStr.split(' ');
    if (parts.length !== 2) return null;
    
    const [lat, lon] = parts[0].split(',').map(Number);
    const radius = parseFloat(parts[1]);
    
    return { center: [lon, lat], radius };
  } catch {
    return null;
  }
}

function isPolygonInBounds(coords: Array<[number, number]>, bounds: { north: number; south: number; east: number; west: number }): boolean {
  for (const [lon, lat] of coords) {
    if (lat >= bounds.south && lat <= bounds.north && lon >= bounds.west && lon <= bounds.east) {
      return true;
    }
  }
  return false;
}

function isCircleInBounds(circle: { center: [number, number]; radius: number }, bounds: { north: number; south: number; east: number; west: number }): boolean {
  const [lon, lat] = circle.center;
  return lat >= bounds.south && lat <= bounds.north && lon >= bounds.west && lon <= bounds.east;
}

export async function geocodeZipCode(zipCode: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
      params: {
        postalcode: zipCode,
        country: 'USA',
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'IPAWS-Alert-Viewer'
      }
    });
    
    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error geocoding zip code:', error);
    return null;
  }
}
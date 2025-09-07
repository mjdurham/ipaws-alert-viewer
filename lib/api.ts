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
  
  const filter = `sent ge '${startDateStr}' and sent le '${endDateStr}'`;
  
  const queryParams = new URLSearchParams({
    '$filter': filter,
    '$top': '1000',
    '$orderby': 'sent desc'
  });
  
  try {
    const response = await axios.get(`${API_BASE_URL}?${queryParams.toString()}`);
    
    if (response.data && response.data.IpawsArchivedAlerts) {
      const alerts = response.data.IpawsArchivedAlerts;
      
      return alerts;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching IPAWS alerts:', error);
    return [];
  }
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
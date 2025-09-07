import { Polygon, Point } from 'geojson';

export interface IPAWSAlert {
  cogId: string;
  identifier: string;
  sent: string;
  msgType: string;
  source?: string;
  info?: AlertInfo[];
}

export interface AlertInfo {
  headline?: string;
  description?: string;
  instruction?: string;
  severity?: string;
  urgency?: string;
  certainty?: string;
  effective?: string;
  expires?: string;
  eventCode?: EventCode[];
  area?: AlertArea[];
}

export interface EventCode {
  valueName?: string;
  value?: string;
}

// Circle in IPAWS is represented as a Point with a radius property
export interface CircleGeoJSON {
  type: 'Circle';
  coordinates: [number, number]; // [longitude, latitude]
  radius?: number; // Radius in kilometers
}

export interface AlertArea {
  areaDesc?: string;
  polygon?: Polygon;
  circle?: CircleGeoJSON;
  geocode?: Geocode[];
}

export interface Geocode {
  valueName?: string;
  value?: string;
}

export interface AlertMarker {
  id: string;
  longitude: number;
  latitude: number;
  alert: IPAWSAlert;
}
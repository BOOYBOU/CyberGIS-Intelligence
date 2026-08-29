export interface VideoItem {
  video_id: string;
  title: string;
  author: string;
  channel_id: string;
  published_time: string;
  published_year?: number;
  views: string;
  duration: string;
  thumbnail: string;
  url: string;
  embed_url: string;
  lat: number;
  lng: number;
  distance_km: number;
  distance_miles: number;
  geotag_source: string;
  bearing_deg?: number; // Estimated camera POV direction (0-360 deg)
  fov_deg?: number;     // Estimated field of view width
  epoch_label?: string; // e.g. "2010–2014 Legacy Archive"
  description_snippet?: string;
}

export interface GeocodeData {
  name: string;
  display_name: string;
  lat: number;
  lng: number;
  type?: string;
}

export interface SearchParams {
  location_name: string;
  lat: number;
  lng: number;
  radius_km: number;
  keyword: string;
  api_key: string;
  polygon_coords?: [number, number][]; // Custom OSINT polygon scanning
}

export interface PresetLocation {
  name: string;
  country: string;
  lat: number;
  lng: number;
  description: string;
}

export type GlobalMapTheme = 'esri_sat' | 'google_sat' | 'google_streets';

export interface TimelineFilter {
  minYear: number;
  maxYear: number;
  enabled: boolean;
}

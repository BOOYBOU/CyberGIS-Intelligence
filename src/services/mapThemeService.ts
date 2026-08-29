import { GlobalMapTheme } from '../types';

export interface ThemeConfig {
  id: GlobalMapTheme;
  name: string;
  category: 'satellite' | 'streets';
  leaflet: {
    url: string;
    fallbackUrl?: string;
    maxZoom: number;
    maxNativeZoom: number;
    subdomains: string[];
    attribution?: string;
  };
}

export const MAP_THEMES: Record<GlobalMapTheme, ThemeConfig> = {
  google_sat: {
    id: 'google_sat',
    name: 'Google Satellite Ultra-HD (Zoom 22)',
    category: 'satellite',
    leaflet: {
      url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      fallbackUrl: 'https://mt{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',
      maxZoom: 22,
      maxNativeZoom: 21,
      subdomains: ['0', '1', '2', '3']
    }
  },
  esri_sat: {
    id: 'esri_sat',
    name: 'Esri World Imagery 4K Ultra-HD',
    category: 'satellite',
    leaflet: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      fallbackUrl: 'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      maxZoom: 22,
      maxNativeZoom: 19,
      subdomains: ['a', 'b', 'c', 'd']
    }
  },
  google_streets: {
    id: 'google_streets',
    name: 'Google Streets Tactical (Zoom 22)',
    category: 'streets',
    leaflet: {
      url: 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      fallbackUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      maxZoom: 22,
      maxNativeZoom: 20,
      subdomains: ['0', '1', '2', '3']
    }
  }
};



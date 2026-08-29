# GeoFind 3D - OSINT YouTube Geospatial Intelligence

A high-performance 3D/2D geospatial intelligence web application for discovering, scraping, and analyzing public geotagged YouTube videos within any geographical coordinate or radius worldwide.

Surpasses the architecture of `youtube-geofind` with zero required API keys, high-performance 3D Globe visualization (Globe.gl + Three.js), 2D precision tactical map (Leaflet), OpenStreetMap Nominatim geocoding, multi-vector public YouTube scraping, and multi-format exports (KML, GeoJSON, CSV, JSON).

---

## 🚀 Standalone Python Flask Quickstart

### Prerequisites
- Python 3.8+ installed on your system.

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the Application
```bash
python app.py
```
Open your browser and navigate to:
```
http://localhost:5000
```

---

## ⚡ Features

1. **High-Performance 3D Globe & 2D Tactical Map**:
   - Seamless toggle between 3D spherical globe with atmospheric night lighting and 2D Dark Matter tactical map.
   - Smooth camera fly-to animations on city search.
   - Pulsating radar beacon and radial distance circle overlay.

2. **OSINT Discovery & Scraping Engine**:
   - Zero API keys required by default (public InnerTube & OSM Nominatim scraping).
   - Optional YouTube Data API v3 key support for enterprise investigators.
   - Dynamic radius selector (5 km to 500 km).
   - Preset OSINT hotspots (Agadir, Tokyo, New York, Kyiv, Paris, Dubai).

3. **Synchronized Video Intelligence**:
   - Video title, author/channel, distance from target origin, coordinates, publication date.
   - High-definition embedded player modal with timecode jumping and channel lookup.
   - Coordinate copy in decimal format and instant OpenStreetMap link.

4. **Multi-Format Intelligence Export**:
   - **KML**: Direct import into Google Earth Pro for 3D flight paths.
   - **GeoJSON**: Integration with QGIS, ArcGIS, and Mapbox.
   - **CSV**: Spreadsheet analysis in Excel / Google Sheets.
   - **JSON**: OSINT graph intelligence.

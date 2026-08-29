import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  geocodeLocation,
  reverseGeocode,
  getSearchSuggestions,
  searchGeotaggedVideos
} from './src/server/geofindEngine';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Geocoding endpoints
  app.get('/geocode', async (req, res) => {
    const query = (req.query.q as string) || '';
    try {
      const geo = await geocodeLocation(query);
      if (geo) {
        res.json({ status: 'success', data: geo });
      } else {
        res.status(404).json({ status: 'error', message: `Could not geocode "${query}"` });
      }
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  app.get('/reverse_geocode', async (req, res) => {
    const lat = parseFloat((req.query.lat as string) || '0');
    const lng = parseFloat((req.query.lng as string) || '0');
    try {
      const geo = await reverseGeocode(lat, lng);
      res.json({ status: 'success', data: geo });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  app.get('/suggest', async (req, res) => {
    const query = (req.query.q as string) || '';
    try {
      const suggestions = await getSearchSuggestions(query);
      res.json({ status: 'success', suggestions });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // YouTube proxy
  app.get('/api/youtube/*', async (req, res) => {
    const endpoint = (req.params as any)[0] || '';
    const queryParams = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    const targetUrl = `https://www.googleapis.com/youtube/v3/${endpoint}${queryParams}`;
    try {
      const apiRes = await fetch(targetUrl, {
        headers: { Accept: 'application/json' }
      });
      const data = await apiRes.json();
      res.status(apiRes.status).json(data);
    } catch (err: any) {
      res.status(502).json({ error: { message: err.message } });
    }
  });

  // Search videos endpoint
  app.post('/search_videos', async (req, res) => {
    try {
      const data = req.body || {};
      let lat = parseFloat(data.lat || 0);
      let lng = parseFloat(data.lng || 0);
      const radiusKm = parseFloat(data.radius_km || data.radius || 50);
      let locName = data.location_name || data.location || '';
      const keyword = data.keyword || '';
      const apiKey = data.api_key || process.env.YOUTUBE_API_KEY || '';
      const polygonCoords = data.polygon_coords || undefined;

      if (lat === 0 && lng === 0 && locName) {
        const geo = await geocodeLocation(locName);
        if (geo) {
          lat = geo.lat;
          lng = geo.lng;
          locName = geo.name;
        }
      }

      const minYear = data.min_year ? parseInt(data.min_year, 10) : 2010;
      const maxYear = data.max_year ? parseInt(data.max_year, 10) : 2026;

      const videos = await searchGeotaggedVideos(
        lat,
        lng,
        radiusKm,
        locName,
        keyword,
        apiKey,
        polygonCoords,
        minYear,
        maxYear
      );

      res.json({
        status: 'success',
        query_params: {
          lat,
          lng,
          radius_km: radiusKm,
          location_name: locName,
          keyword,
          polygon: !!polygonCoords,
          archive_span: '2010-2026'
        },
        count: videos.length,
        videos
      });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // Vite middleware for dev or Static files for prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GeoFind Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

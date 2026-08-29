import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';
import { geocodeLocation, reverseGeocode, getSearchSuggestions, searchGeotaggedVideos } from './src/server/geofindEngine';

function geofindBackendPlugin(): Plugin {
  return {
    name: 'geofind-backend-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const parsedUrl = new URL(req.url || '/', 'http://localhost');

        if (parsedUrl.pathname === '/geocode') {
          const query = parsedUrl.searchParams.get('q') || '';
          try {
            const geo = await geocodeLocation(query);
            res.setHeader('Content-Type', 'application/json');
            if (geo) {
              res.end(JSON.stringify({ status: 'success', data: geo }));
            } else {
              res.statusCode = 404;
              res.end(JSON.stringify({ status: 'error', message: `Could not geocode "${query}"` }));
            }
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ status: 'error', message: err.message }));
          }
          return;
        }

        if (parsedUrl.pathname === '/reverse_geocode') {
          const lat = parseFloat(parsedUrl.searchParams.get('lat') || '0');
          const lng = parseFloat(parsedUrl.searchParams.get('lng') || '0');
          try {
            const geo = await reverseGeocode(lat, lng);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'success', data: geo }));
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ status: 'error', message: err.message }));
          }
          return;
        }

        if (parsedUrl.pathname === '/suggest') {
          const query = parsedUrl.searchParams.get('q') || '';
          try {
            const suggestions = await getSearchSuggestions(query);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'success', suggestions }));
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ status: 'error', message: err.message }));
          }
          return;
        }

        if (parsedUrl.pathname.startsWith('/api/youtube/')) {
          const endpoint = parsedUrl.pathname.replace('/api/youtube/', '');
          const queryParams = parsedUrl.search;
          const targetUrl = `https://www.googleapis.com/youtube/v3/${endpoint}${queryParams}`;
          try {
            const apiRes = await fetch(targetUrl, {
              headers: { 'Accept': 'application/json' }
            });
            const data = await apiRes.json();
            res.statusCode = apiRes.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          } catch (err: any) {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: { message: err.message } }));
          }
          return;
        }

        if (parsedUrl.pathname === '/search_videos') {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });
            req.on('end', async () => {
              try {
                const data = JSON.parse(body || '{}');
                let lat = parseFloat(data.lat || 0);
                let lng = parseFloat(data.lng || 0);
                const radiusKm = parseFloat(data.radius_km || data.radius || 50);
                let locName = data.location_name || data.location || '';
                const keyword = data.keyword || '';
                const apiKey = data.api_key || '';
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

                const videos = await searchGeotaggedVideos(lat, lng, radiusKm, locName, keyword, apiKey, polygonCoords, minYear, maxYear);
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    status: 'success',
                    query_params: { lat, lng, radius_km: radiusKm, location_name: locName, keyword, polygon: !!polygonCoords, archive_span: '2010-2026' },
                    count: videos.length,
                    videos
                  })
                );
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ status: 'error', message: err.message }));
              }
            });
            return;
          }
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    geofindBackendPlugin()
  ],
  server: {
    port: 3000,
    host: '0.0.0.0'
  }
});

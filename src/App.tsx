import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Map2D } from './components/Map2D';
import { Globe3DView } from './components/Globe3DView';
import { Sidebar } from './components/Sidebar';
import { VideoModal } from './components/VideoModal';
import { ExportModal } from './components/ExportModal';
import { SolarSystemModal } from './components/SolarSystemModal';
import { VideoItem, PresetLocation, GlobalMapTheme, TimelineFilter } from './types';
import { CelestialBodyData, SOLAR_SYSTEM_DATA } from './services/solarSystemService';
import { isCoordinateInWater, resolveInhabitedLandCoordinate, ensureVideoOnLand } from './services/landGeotagResolver';

const PIN_STORAGE_KEY = 'GEOLOCKED_VIDEO_PINS_V2';

function getLocalLockedPins(): Record<string, { lat: number; lng: number; bearing_deg?: number }> {
  try {
    const raw = localStorage.getItem(PIN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalLockedPins(records: Record<string, { lat: number; lng: number; bearing_deg?: number }>) {
  try {
    localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // ignore
  }
}

export default function App() {
  const [currentTheme, setCurrentTheme] = useState<GlobalMapTheme>(() => {
    try {
      return (localStorage.getItem('GLOBAL_MAP_THEME') as GlobalMapTheme) || 'google_sat';
    } catch {
      return 'google_sat';
    }
  });

  const handleThemeChange = (newTheme: GlobalMapTheme) => {
    setCurrentTheme(newTheme);
    try {
      localStorage.setItem('GLOBAL_MAP_THEME', newTheme);
    } catch {
      // ignore
    }
  };

  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Tactical OSINT Target States with Persistence
  const [targetName, setTargetName] = useState(() => {
    try {
      return localStorage.getItem('LAST_TARGET_NAME') || 'Agadir, Morocco';
    } catch {
      return 'Agadir, Morocco';
    }
  });
  const [lat, setLat] = useState(() => {
    try {
      const saved = localStorage.getItem('LAST_LAT');
      return saved ? parseFloat(saved) : 30.4278;
    } catch {
      return 30.4278;
    }
  });
  const [lng, setLng] = useState(() => {
    try {
      const saved = localStorage.getItem('LAST_LNG');
      return saved ? parseFloat(saved) : -9.5981;
    } catch {
      return -9.5981;
    }
  });
  const [radiusKm, setRadiusKm] = useState(50);
  const [searchInput, setSearchInput] = useState(() => {
    try {
      return localStorage.getItem('LAST_SEARCH_INPUT') || 'Agadir, Morocco';
    } catch {
      return 'Agadir, Morocco';
    }
  });
  const [keyword, setKeyword] = useState('');
  const [apiKey, setApiKey] = useState('');

  // Tactical Polygon Scan & Timeline Filters
  const [polygonPoints, setPolygonPoints] = useState<[number, number][]>([]);
  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);
  const [timeline, setTimeline] = useState<TimelineFilter>({
    minYear: 2010,
    maxYear: 2026,
    enabled: false
  });

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');

  // Solar System Cosmic Exploration States
  const [sidebarMode, setSidebarMode] = useState<'recon' | 'solar'>('recon');
  const [focusedCelestialBodyId, setFocusedCelestialBodyId] = useState<string | null>(null);
  const [detailedModalBody, setDetailedModalBody] = useState<CelestialBodyData | null>(null);

  const handleTransitionTo3D = useCallback(() => {
    setViewMode('3d');
  }, []);

  const handleSelectCelestialBodyFor3D = useCallback((body: CelestialBodyData) => {
    setFocusedCelestialBodyId(body.id);
    setViewMode('3d');
  }, []);

  const handleOpenCelestialModal = useCallback((body: CelestialBodyData) => {
    setDetailedModalBody(body);
  }, []);

  const handleTransitionTo2D = useCallback((targetLat?: number, targetLng?: number) => {
    if (typeof targetLat === 'number' && typeof targetLng === 'number') {
      setLat(targetLat);
      setLng(targetLng);
    }
    setViewMode('2d');
  }, []);

  // Sync active target to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('LAST_TARGET_NAME', targetName);
      localStorage.setItem('LAST_LAT', lat.toString());
      localStorage.setItem('LAST_LNG', lng.toString());
      localStorage.setItem('LAST_SEARCH_INPUT', searchInput);
    } catch {
      // ignore
    }
  }, [targetName, lat, lng, searchInput]);

  // Execute Geospatial Video Search
  const executeSearch = useCallback(
    async (
      searchQuery = searchInput,
      targetLat = lat,
      targetLng = lng,
      rad = radiusKm,
      kw = keyword,
      key = apiKey,
      skipGeocoding = false,
      polyCoords = polygonPoints
    ) => {
      setIsLoading(true);
      try {
        let finalLat = targetLat;
        let finalLng = targetLng;
        let finalName = searchQuery;

        // If search input looks like a new city name and not already resolved, geocode it
        if (!skipGeocoding && searchQuery.trim() && (targetLat === lat && targetLng === lng)) {
          try {
            const geoRes = await fetch(`/geocode?q=${encodeURIComponent(searchQuery.trim())}`);
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              if (geoData.status === 'success' && geoData.data) {
                finalLat = geoData.data.lat;
                finalLng = geoData.data.lng;
                finalName = geoData.data.name || searchQuery;
                setLat(finalLat);
                setLng(finalLng);
                setTargetName(finalName);
              }
            }
          } catch (e) {
            console.warn('Geocoding query error:', e);
          }
        }

        // Search videos with coordinates, radius, timeline window, and optional custom polygon boundary
        const vidRes = await fetch('/search_videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat: finalLat,
            lng: finalLng,
            radius_km: rad,
            location_name: finalName,
            keyword: kw,
            api_key: key,
            polygon_coords: polyCoords && polyCoords.length >= 3 ? polyCoords : undefined,
            min_year: timeline.enabled ? timeline.minYear : 2010,
            max_year: timeline.enabled ? timeline.maxYear : 2026
          })
        });

        if (vidRes.ok) {
          const vidData = await vidRes.json();
          if (vidData.status === 'success') {
            const rawVideos: VideoItem[] = vidData.videos || [];
            const pinStore = getLocalLockedPins();
            let changed = false;

            const normalizedVideos = rawVideos.map(v => {
              if (pinStore[v.video_id]) {
                const stored = pinStore[v.video_id];
                // Rule 1: If already on land, keep 100% untouched
                if (!isCoordinateInWater(stored.lat, stored.lng)) {
                  return {
                    ...v,
                    lat: stored.lat,
                    lng: stored.lng,
                    bearing_deg: stored.bearing_deg !== undefined ? stored.bearing_deg : v.bearing_deg
                  };
                }

                // Rule 2 & 3: If in sea/water, re-parse metadata and move onto true inhabited land
                const landFix = resolveInhabitedLandCoordinate(
                  v.video_id,
                  v.title,
                  v.description_snippet || '',
                  v.author || '',
                  finalLat,
                  finalLng,
                  finalName
                );
                pinStore[v.video_id] = {
                  lat: landFix.lat,
                  lng: landFix.lng,
                  bearing_deg: landFix.bearing_deg !== undefined ? landFix.bearing_deg : stored.bearing_deg
                };
                changed = true;
                return {
                  ...v,
                  lat: landFix.lat,
                  lng: landFix.lng,
                  bearing_deg: landFix.bearing_deg !== undefined ? landFix.bearing_deg : v.bearing_deg,
                  geotag_source: landFix.geotag_source
                };
              } else {
                // First time: check if video coordinate is in water
                let pLat = v.lat;
                let pLng = v.lng;
                let pBearing = v.bearing_deg;
                let pSource = v.geotag_source;

                if (isCoordinateInWater(pLat, pLng)) {
                  const landFix = resolveInhabitedLandCoordinate(
                    v.video_id,
                    v.title,
                    v.description_snippet || '',
                    v.author || '',
                    finalLat,
                    finalLng,
                    finalName
                  );
                  pLat = landFix.lat;
                  pLng = landFix.lng;
                  pBearing = landFix.bearing_deg !== undefined ? landFix.bearing_deg : v.bearing_deg;
                  pSource = landFix.geotag_source;
                }

                pinStore[v.video_id] = {
                  lat: pLat,
                  lng: pLng,
                  bearing_deg: pBearing
                };
                changed = true;
                return {
                  ...v,
                  lat: pLat,
                  lng: pLng,
                  bearing_deg: pBearing,
                  geotag_source: pSource
                };
              }
            });

            if (changed) {
              saveLocalLockedPins(pinStore);
            }

            setVideos(normalizedVideos);
          }
        }
      } catch (err) {
        console.error('Search execution failed:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [searchInput, lat, lng, radiusKm, keyword, apiKey, polygonPoints, timeline]
  );

  // Initial Scan on Mount using persisted coordinates
  const initialMountRef = useRef(false);
  useEffect(() => {
    if (!initialMountRef.current) {
      initialMountRef.current = true;
      executeSearch(searchInput, lat, lng, radiusKm, keyword, apiKey, true);
    }
  }, []);

  // Direct click / roaming navigation handler
  const handleLocationChange = useCallback(
    (newLat: number, newLng: number, placeName?: string) => {
      const resolvedName = placeName || `Location (${newLat.toFixed(4)}, ${newLng.toFixed(4)})`;
      setLat(newLat);
      setLng(newLng);
      setTargetName(resolvedName);
      setSearchInput(resolvedName);
      executeSearch(resolvedName, newLat, newLng, radiusKm, keyword, apiKey, true, polygonPoints);
    },
    [radiusKm, keyword, apiKey, polygonPoints, executeSearch]
  );

  const handleSelectPreset = (preset: PresetLocation) => {
    const nameWithCountry = `${preset.name}, ${preset.country}`;
    setSearchInput(nameWithCountry);
    setTargetName(nameWithCountry);
    setLat(preset.lat);
    setLng(preset.lng);
    setPolygonPoints([]);
    setIsDrawingPolygon(false);
    if (viewMode === '3d') {
      setViewMode('2d');
    }
    executeSearch(nameWithCountry, preset.lat, preset.lng, radiusKm, keyword, apiKey, true, []);
  };

  const handleDirectLocationSelect = (directLat: number, directLng: number, placeName: string) => {
    setLat(directLat);
    setLng(directLng);
    setTargetName(placeName);
    if (viewMode === '3d') {
      setViewMode('2d');
    }
    executeSearch(placeName, directLat, directLng, radiusKm, keyword, apiKey, true, polygonPoints);
  };

  const handleToggleDrawPolygon = () => {
    setIsDrawingPolygon(!isDrawingPolygon);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#030712] text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Sentinel Command Navbar */}
      <Navbar
        targetName={targetName}
        lat={lat}
        lng={lng}
        radiusKm={radiusKm}
        videos={videos}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
        onOpenExport={() => setIsExportOpen(true)}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onOpenSolarSystem={() => {
          setSidebarMode('solar');
          setSidebarOpen(true);
          setViewMode('3d');
        }}
      />

      {/* Main Workspace Area: Sidebar + Active High-Res Map Viewport */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Left Targeting Sidebar */}
        <Sidebar
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          radiusKm={radiusKm}
          onRadiusChange={setRadiusKm}
          keyword={keyword}
          onKeywordChange={setKeyword}
          apiKey={apiKey}
          onApiKeyChange={setApiKey}
          videos={videos}
          selectedVideo={selectedVideo}
          isLoading={isLoading}
          onExecuteSearch={() => {
            if (viewMode === '3d') {
              setViewMode('2d');
            }
            executeSearch(searchInput, lat, lng, radiusKm, keyword, apiKey, false, polygonPoints);
          }}
          onSelectPreset={handleSelectPreset}
          onSelectVideo={video => setSelectedVideo(video)}
          onDirectLocationSelect={handleDirectLocationSelect}
          timeline={timeline}
          polygonPointsCount={polygonPoints.length}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          sidebarMode={sidebarMode}
          onSidebarModeChange={setSidebarMode}
          onSelectCelestialBody={handleSelectCelestialBodyFor3D}
          onOpenCelestialModal={handleOpenCelestialModal}
          activeCelestialBodyId={focusedCelestialBodyId}
        />

        {/* Primary High-Resolution Geospatial Map Viewport (2D Flat Tactical or 3D Spherical Globe) */}
        <main className="flex-1 relative h-full bg-[#010206] overflow-hidden">
          <div
            className={`absolute inset-0 w-full h-full transition-all duration-500 ease-out ${
              viewMode === '2d'
                ? 'opacity-100 scale-100 z-10 pointer-events-auto'
                : 'opacity-0 scale-95 z-0 pointer-events-none'
            }`}
          >
            <Map2D
              lat={lat}
              lng={lng}
              radiusKm={radiusKm}
              videos={videos}
              selectedVideo={selectedVideo}
              targetName={targetName}
              currentTheme={currentTheme}
              onThemeChange={handleThemeChange}
              timeline={timeline}
              onTimelineChange={setTimeline}
              polygonPoints={polygonPoints}
              onPolygonPointsChange={setPolygonPoints}
              isDrawingPolygon={isDrawingPolygon}
              onToggleDrawPolygon={handleToggleDrawPolygon}
              onSelectVideo={video => setSelectedVideo(video)}
              onLocationChange={handleLocationChange}
              onTransitionTo3D={handleTransitionTo3D}
            />
          </div>

          <div
            className={`absolute inset-0 w-full h-full transition-all duration-500 ease-out ${
              viewMode === '3d'
                ? 'opacity-100 scale-100 z-10 pointer-events-auto'
                : 'opacity-0 scale-105 z-0 pointer-events-none'
            }`}
          >
            <Globe3DView
              lat={lat}
              lng={lng}
              radiusKm={radiusKm}
              targetName={targetName}
              videos={videos}
              currentTheme={currentTheme}
              timeline={timeline}
              isActive={viewMode === '3d'}
              focusedCelestialBodyId={focusedCelestialBodyId}
              onSelectVideo={video => setSelectedVideo(video)}
              onLocationChange={handleLocationChange}
              onTransitionTo2D={handleTransitionTo2D}
              onFocusBodyChange={body => setFocusedCelestialBodyId(body ? body.id : null)}
            />
          </div>
        </main>
      </div>

      {/* Video Player Modal */}
      <VideoModal
        video={selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />

      {/* Solar System Comprehensive Astronomical Modal */}
      <SolarSystemModal
        body={detailedModalBody}
        isOpen={!!detailedModalBody}
        onClose={() => setDetailedModalBody(null)}
        onFlyToIn3D={body => {
          handleSelectCelestialBodyFor3D(body);
        }}
      />

      {/* Intelligence Export Modal (GeoJSON, KML 3D, Maltego CSV, JSON) */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        videos={videos}
        targetName={targetName}
      />
    </div>
  );
}


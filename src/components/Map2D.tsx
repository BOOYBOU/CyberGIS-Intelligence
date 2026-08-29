import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import { VideoItem, GlobalMapTheme, TimelineFilter } from '../types';
import { MAP_THEMES } from '../services/mapThemeService';
import { MapGlobalHUD } from './MapGlobalHUD';
import { Map, Plus, Minus, Search, Sparkles, X, Play, Globe as GlobeIcon } from 'lucide-react';

interface Map2DProps {
  lat: number;
  lng: number;
  radiusKm: number;
  videos: VideoItem[];
  selectedVideo: VideoItem | null;
  targetName: string;
  currentTheme: GlobalMapTheme;
  onThemeChange: (theme: GlobalMapTheme) => void;
  timeline: TimelineFilter;
  onTimelineChange: (t: TimelineFilter) => void;
  polygonPoints: [number, number][];
  onPolygonPointsChange: (pts: [number, number][]) => void;
  isDrawingPolygon: boolean;
  onToggleDrawPolygon: () => void;
  onSelectVideo: (video: VideoItem) => void;
  onLocationChange: (newLat: number, newLng: number, placeName?: string) => void;
  onTransitionTo3D?: () => void;
}

const Map2DComponent: React.FC<Map2DProps> = ({
  lat,
  lng,
  radiusKm,
  videos,
  selectedVideo,
  targetName,
  currentTheme,
  onThemeChange,
  timeline,
  onTimelineChange,
  polygonPoints,
  onPolygonPointsChange,
  isDrawingPolygon,
  onToggleDrawPolygon,
  onSelectVideo,
  onLocationChange,
  onTransitionTo3D
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const centerMarkerRef = useRef<L.Marker | null>(null);

  const [hasMoved, setHasMoved] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [hoveredVideo, setHoveredVideo] = useState<VideoItem | null>(null);
  const [showPOVCones, setShowPOVCones] = useState(true);

  const [zoomLevel, setZoomLevel] = useState(14);

  // Filtered videos based on Timeline
  const visibleVideos = useMemo(() => {
    return videos.filter(v => {
      if (!timeline.enabled) return true;
      const yr = v.published_year || 2026;
      return yr >= timeline.minYear && yr <= timeline.maxYear;
    });
  }, [videos, timeline]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 14,
      maxZoom: 22,
      minZoom: 3,
      maxBounds: [[-85, -180], [85, 180]],
      maxBoundsViscosity: 1.0,
      zoomControl: false,
      attributionControl: false,
      wheelDebounceTime: 15,
      wheelPxPerZoomLevel: 120,
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true
    });

    mapRef.current = map;

    const themeConfig = MAP_THEMES[currentTheme];
    const tileLayer = L.tileLayer(themeConfig.leaflet.url, {
      maxZoom: 22,
      minZoom: 3,
      maxNativeZoom: themeConfig.leaflet.maxNativeZoom,
      subdomains: themeConfig.leaflet.subdomains.length > 0 ? themeConfig.leaflet.subdomains : ['a', 'b', 'c'],
      keepBuffer: 6,
      noWrap: true,
      bounds: [[-85, -180], [85, 180]],
      updateWhenIdle: false,
      updateWhenZooming: true,
      tileSize: 256,
      crossOrigin: true
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;

    // Automatic layout & dimension invalidation guarantees
    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    };

    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    const t1 = setTimeout(handleResize, 50);
    const t2 = setTimeout(handleResize, 200);
    const t3 = setTimeout(handleResize, 600);

    map.on('zoomend', () => {
      const currentZoom = map.getZoom();
      setZoomLevel(currentZoom);
    });

    // Boundary wheel listener: Only triggers 3D globe if user is already at the minimum 2D zoom (level <= 3) and continues scrolling down
    const handleWheelBoundary = (e: WheelEvent) => {
      if (e.deltaY > 0 && mapRef.current) {
        if (mapRef.current.getZoom() <= 3 && onTransitionTo3D) {
          onTransitionTo3D();
        }
      }
    };

    const containerEl = mapContainerRef.current;
    if (containerEl) {
      containerEl.addEventListener('wheel', handleWheelBoundary, { passive: true });
    }

    let moveRafId: number | null = null;
    map.on('moveend', () => {
      if (moveRafId) cancelAnimationFrame(moveRafId);
      moveRafId = requestAnimationFrame(() => {
        const center = map.getCenter();
        const dist = Math.sqrt(Math.pow(center.lat - lat, 2) + Math.pow(center.lng - lng, 2));
        if (dist > 0.015) {
          setHasMoved(true);
        }
      });
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      const clickLat = Number(e.latlng.lat.toFixed(6));
      const clickLng = Number(e.latlng.lng.toFixed(6));

      if (isDrawingPolygon) {
        onPolygonPointsChange([...polygonPoints, [clickLat, clickLng]]);
        return;
      }

      fetch(`/reverse_geocode?lat=${clickLat}&lng=${clickLng}`)
        .then(res => res.json())
        .then(data => {
          onLocationChange(clickLat, clickLng, data.data?.name || `Location (${clickLat}, ${clickLng})`);
        })
        .catch(() => {
          onLocationChange(clickLat, clickLng);
        });
    });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', handleResize);
      if (containerEl) {
        containerEl.removeEventListener('wheel', handleWheelBoundary);
      }
      resizeObserver.disconnect();
      if (moveRafId) cancelAnimationFrame(moveRafId);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Tile Layer on Global Theme Switch
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const themeConfig = MAP_THEMES[currentTheme];
    const newTileLayer = L.tileLayer(themeConfig.leaflet.url, {
      maxZoom: 22,
      minZoom: 3,
      maxNativeZoom: themeConfig.leaflet.maxNativeZoom,
      subdomains: themeConfig.leaflet.subdomains.length > 0 ? themeConfig.leaflet.subdomains : ['a', 'b', 'c'],
      keepBuffer: 6,
      noWrap: true,
      bounds: [[-85, -180], [85, 180]],
      updateWhenIdle: false,
      updateWhenZooming: true,
      tileSize: 256,
      crossOrigin: true
    }).addTo(map);

    tileLayerRef.current = newTileLayer;
    map.invalidateSize();
  }, [currentTheme]);

  // Update Epicenter, Circle Radius & Tactical Polygon Layer (In-Place Updates)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.flyTo([lat, lng], 14, { duration: 0.6, easeLinearity: 0.25 });
    setHasMoved(false);

    // 1. In-Place Update Center Marker
    const centerHtml = `
      <div class="relative flex flex-col items-center pointer-events-none transform -translate-x-1/2 -translate-y-1/2">
        <div class="relative w-7 h-7 flex items-center justify-center">
          <div class="absolute w-7 h-7 rounded-full bg-cyan-500/30 border border-cyan-400 animate-ping"></div>
          <div class="w-3.5 h-3.5 rounded-full bg-cyan-500 border-2 border-white shadow-[0_0_12px_rgba(6,182,212,0.8)]"></div>
        </div>
        <span class="mt-1 px-2 py-0.5 rounded-full bg-[#050a16]/90 border border-cyan-400/80 text-[10px] text-cyan-300 font-bold font-mono whitespace-nowrap shadow-xl">
          🎯 ${targetName.split(',')[0]}
        </span>
      </div>
    `;

    const centerIcon = L.divIcon({
      className: 'custom-center-marker',
      html: centerHtml,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    if (centerMarkerRef.current) {
      centerMarkerRef.current.setLatLng([lat, lng]);
      centerMarkerRef.current.setIcon(centerIcon);
    } else {
      centerMarkerRef.current = L.marker([lat, lng], { icon: centerIcon, interactive: false }).addTo(map);
    }

    // 2. In-Place Update Tactical Radar Radius Circle
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setLatLng([lat, lng]);
      radiusCircleRef.current.setRadius(radiusKm * 1000);
    } else {
      radiusCircleRef.current = L.circle([lat, lng], {
        radius: radiusKm * 1000,
        color: '#06b6d4',
        weight: 1.5,
        opacity: 0.8,
        fillColor: '#06b6d4',
        fillOpacity: 0.06,
        dashArray: '3, 2'
      }).addTo(map);
    }

    // 3. Custom Polygon Scan Layer
    if (polygonLayerRef.current) {
      map.removeLayer(polygonLayerRef.current);
      polygonLayerRef.current = null;
    }

    if (polygonPoints && polygonPoints.length >= 3) {
      polygonLayerRef.current = L.polygon(polygonPoints as any, {
        color: '#f59e0b',
        weight: 2,
        fillColor: '#f59e0b',
        fillOpacity: 0.16
      }).addTo(map);
    }
  }, [lat, lng, radiusKm, targetName, polygonPoints]);

  // Update Markers with Directional Bearing & POV Cones with Smooth RAF Batching
  useEffect(() => {
    const markersGroup = markersLayerRef.current;
    if (!markersGroup) return;

    let rafId = requestAnimationFrame(() => {
      markersGroup.clearLayers();

      visibleVideos.forEach(video => {
        const isSelected = selectedVideo?.video_id === video.video_id;
        const bearing = video.bearing_deg || 0;

        const fovConeHtml = showPOVCones
          ? `
          <div class="absolute -top-10 -left-6 w-16 h-16 pointer-events-none opacity-75 group-hover:opacity-100" style="transform: rotate(${bearing}deg);">
            <div class="w-full h-full" style="background: radial-gradient(circle at 50% 100%, rgba(6, 182, 212, 0.45) 0%, rgba(6, 182, 212, 0) 70%); clip-path: polygon(50% 100%, 0% 0%, 100% 0%);"></div>
          </div>
        `
          : '';

        const icon = L.divIcon({
          className: 'custom-video-pin group font-mono',
          html: `
            <div class="relative flex flex-col items-center cursor-pointer transform -translate-x-1/2 -translate-y-full hover:scale-125 transition-transform duration-100">
              ${fovConeHtml}
              <div class="w-7 h-7 rounded-full flex items-center justify-center shadow-xl border-2 transition-all ${
                isSelected
                  ? 'bg-amber-500 border-white ring-4 ring-amber-400/60 scale-110 shadow-[0_0_15px_rgba(245,158,11,0.8)]'
                  : 'bg-cyan-600 border-slate-900 group-hover:bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
              }">
                <span class="text-[10px] font-black text-slate-950 ml-0.5">▶</span>
              </div>
              <div class="w-1 h-2.5 bg-slate-900 rounded-b shadow"></div>
            </div>
          `,
          iconSize: [30, 38],
          iconAnchor: [15, 38]
        });

        const marker = L.marker([video.lat, video.lng], { icon, riseOnHover: true });

        marker.on('click', (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e as any);
          setHoveredVideo(video);
          onSelectVideo(video);
        });

        marker.on('mouseover', () => {
          setHoveredVideo(video);
        });

        markersGroup.addLayer(marker);
      });
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [visibleVideos, selectedVideo, showPOVCones, onSelectVideo]);

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const userLat = Number(pos.coords.latitude.toFixed(6));
        const userLng = Number(pos.coords.longitude.toFixed(6));
        setIsLocating(false);
        fetch(`/reverse_geocode?lat=${userLat}&lng=${userLng}`)
          .then(res => res.json())
          .then(data => {
            onLocationChange(userLat, userLng, data.data?.name || 'My Location');
          })
          .catch(() => {
            onLocationChange(userLat, userLng, 'My Location');
          });
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onLocationChange]);

  const handleSearchThisArea = () => {
    const map = mapRef.current;
    if (!map) return;
    const center = map.getCenter();
    const cLat = Number(center.lat.toFixed(6));
    const cLng = Number(center.lng.toFixed(6));

    fetch(`/reverse_geocode?lat=${cLat}&lng=${cLng}`)
      .then(res => res.json())
      .then(data => {
        onLocationChange(cLat, cLng, data.data?.name || `Location (${cLat}, ${cLng})`);
      })
      .catch(() => {
        onLocationChange(cLat, cLng);
      });
    setHasMoved(false);
  };

  return (
    <div className="relative w-full h-full bg-[#030712] overflow-hidden select-none">
      {/* Leaflet 2D Map Container */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full cursor-crosshair z-0" />

      {/* Floating Quick Intel Preview Card */}
      {hoveredVideo && (
        <div className="absolute top-14 left-4 z-30 max-w-sm w-80 sentinel-glass-cyan rounded-2xl p-3 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 font-mono">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center space-x-1.5 text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>2D Tactical Quick Intel</span>
            </div>
            <button
              onClick={() => setHoveredVideo(null)}
              className="text-slate-400 hover:text-white p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex space-x-2.5 mt-2">
            <div className="relative w-22 h-14 rounded-lg overflow-hidden shrink-0 border border-white/[0.1] bg-black">
              <img
                src={hoveredVideo.thumbnail}
                alt={hoveredVideo.title}
                className="w-full h-full object-cover"
                onError={(e: any) => {
                  e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80';
                }}
              />
              <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/85 text-[8px] text-white font-mono">
                {hoveredVideo.duration}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-[11px] font-bold text-white line-clamp-2 leading-tight">
                {hoveredVideo.title}
              </h4>
              <p className="text-[9px] text-slate-400 mt-1 truncate">{hoveredVideo.author}</p>
              <div className="flex items-center justify-between text-[9px] text-cyan-300 font-mono mt-0.5">
                <span>📍 {hoveredVideo.distance_km} km • POV: {hoveredVideo.bearing_deg || 0}°</span>
                <span className="px-1 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40 text-[8px] font-bold">
                  {hoveredVideo.published_year || 2026}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              onSelectVideo(hoveredVideo);
              setHoveredVideo(null);
            }}
            className="w-full mt-2.5 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold rounded-lg shadow-lg flex items-center justify-center space-x-1.5 transition"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Video Player & Intel</span>
          </button>
        </div>
      )}

      {/* "Search This Area" Floating Prompt */}
      {hasMoved && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 animate-in fade-in slide-in-from-top-4 duration-200">
          <button
            onClick={handleSearchThisArea}
            className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-full shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center space-x-2 border border-cyan-300 transition hover:scale-105 font-mono"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search & Scan This 2D Area</span>
          </button>
        </div>
      )}

      {/* Top Left Helper Mode Badge */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none font-mono">
        <div className="px-2.5 py-1 rounded-lg bg-[#050a16]/80 border border-white/[0.08] text-slate-300 text-[10px] backdrop-blur-xl shadow-xl flex items-center space-x-1.5">
          <Map className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>
            <strong className="text-white">{MAP_THEMES[currentTheme].name}</strong> (Click any point to roam)
          </span>
        </div>
      </div>

      {/* Global OSINT HUD Deck */}
      <MapGlobalHUD
        lat={lat}
        lng={lng}
        radiusKm={radiusKm}
        videoCount={visibleVideos.length}
        zoomLevel={zoomLevel}
        currentTheme={currentTheme}
        onThemeChange={onThemeChange}
        timeline={timeline}
        onTimelineChange={onTimelineChange}
        isDrawingPolygon={isDrawingPolygon}
        onToggleDrawPolygon={onToggleDrawPolygon}
        polygonPointsCount={polygonPoints.length}
        onClearPolygon={() => onPolygonPointsChange([])}
        showPOVCones={showPOVCones}
        onTogglePOVCones={() => setShowPOVCones(!showPOVCones)}
        onLocateMe={handleLocateMe}
        isLocating={isLocating}
        viewMode="2d"
        onToggleViewMode={onTransitionTo3D}
      />

      {/* 2D Zoom Controls & 3D Globe Macro Switcher (Right) */}
      <div className="absolute bottom-14 right-3 z-20 flex flex-col space-y-1 font-mono select-none">
        <button
          onClick={() => onTransitionTo3D?.()}
          className="px-2 py-1 rounded-lg bg-[#050a16]/95 hover:bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[9px] font-bold shadow-xl backdrop-blur-xl transition flex items-center justify-center space-x-1"
          title="Zoom out completely to 3D Spherical Globe View"
        >
          <GlobeIcon className="w-3 h-3 text-cyan-400" />
          <span>3D GLOBE</span>
        </button>

        <button
          onClick={() => mapRef.current?.setZoom(21)}
          className="px-2 py-1 rounded-lg bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-400/50 text-cyan-300 text-[9px] font-bold shadow-xl backdrop-blur-xl transition flex items-center justify-center space-x-1"
          title="Instant 4K Optical Macro Zoom (Level 21 - House/Street Precision)"
        >
          <span>4K MAX</span>
        </button>
        <button
          onClick={() => mapRef.current?.zoomIn()}
          className="p-2 rounded-lg bg-slate-950/80 hover:bg-slate-900 border border-white/[0.08] text-slate-300 hover:text-white shadow-xl backdrop-blur-xl transition flex items-center justify-center"
          title="Zoom In"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <div className="px-1 py-0.5 rounded bg-slate-900/90 border border-white/[0.08] text-[9px] font-bold text-center text-cyan-400">
          {zoomLevel}
        </div>
        <button
          onClick={() => {
            if (zoomLevel <= 3 && onTransitionTo3D) {
              onTransitionTo3D();
            } else {
              mapRef.current?.zoomOut();
            }
          }}
          className="p-2 rounded-lg bg-slate-950/80 hover:bg-slate-900 border border-white/[0.08] text-slate-300 hover:text-white shadow-xl backdrop-blur-xl transition flex items-center justify-center"
          title={zoomLevel <= 3 ? "Zoom Out to 3D Spherical Globe View" : "Zoom Out"}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export const Map2D = React.memo(Map2DComponent);


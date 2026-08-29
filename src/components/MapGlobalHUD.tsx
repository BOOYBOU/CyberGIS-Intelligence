import React, { useState } from 'react';
import {
  Layers,
  ChevronDown,
  Navigation,
  Map,
  Pentagon,
  Trash2,
  Compass,
  History,
  RotateCcw,
  Globe as GlobeIcon
} from 'lucide-react';
import { GlobalMapTheme, TimelineFilter } from '../types';
import { MAP_THEMES } from '../services/mapThemeService';

interface MapGlobalHUDProps {
  lat: number;
  lng: number;
  radiusKm: number;
  videoCount: number;
  zoomLevel?: number;
  currentTheme: GlobalMapTheme;
  onThemeChange: (theme: GlobalMapTheme) => void;
  timeline: TimelineFilter;
  onTimelineChange: (t: TimelineFilter) => void;
  isDrawingPolygon: boolean;
  onToggleDrawPolygon: () => void;
  polygonPointsCount: number;
  onClearPolygon: () => void;
  showPOVCones: boolean;
  onTogglePOVCones: () => void;
  onLocateMe: () => void;
  isLocating: boolean;
  viewMode?: '2d' | '3d';
  onToggleViewMode?: () => void;
}

export const MapGlobalHUD: React.FC<MapGlobalHUDProps> = ({
  lat,
  lng,
  radiusKm,
  videoCount,
  zoomLevel = 14,
  currentTheme,
  onThemeChange,
  timeline,
  onTimelineChange,
  isDrawingPolygon,
  onToggleDrawPolygon,
  polygonPointsCount,
  onClearPolygon,
  showPOVCones,
  onTogglePOVCones,
  onLocateMe,
  isLocating,
  viewMode = '2d',
  onToggleViewMode
}) => {
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showTimelineSlider, setShowTimelineSlider] = useState(false);

  return (
    <>
      {/* Top Right OSINT Tooling Deck */}
      <div className="absolute top-3 right-3 z-20 flex items-center space-x-2 font-mono select-none">
        {/* 2D Flat vs 3D Globe Mode Quick Switcher */}
        {onToggleViewMode && (
          <button
            onClick={onToggleViewMode}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center space-x-1.5 backdrop-blur-xl ${
              viewMode === '3d'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'bg-[#050a16]/80 text-slate-300 border-white/[0.1] hover:text-white'
            }`}
            title="Switch between 2D Flat Tactical View and 3D Spherical Globe"
          >
            {viewMode === '3d' ? (
              <>
                <GlobeIcon className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
                <span className="hidden sm:inline">3D GLOBE</span>
              </>
            ) : (
              <>
                <Map className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">2D FLAT</span>
              </>
            )}
          </button>
        )}

        {/* Draw Custom OSINT Polygon Button */}
        <button
          onClick={onToggleDrawPolygon}
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center space-x-1.5 backdrop-blur-xl ${
            isDrawingPolygon
              ? 'bg-amber-500/20 text-amber-300 border-amber-400 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.3)] ring-1 ring-amber-400'
              : polygonPointsCount > 0
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
              : 'bg-[#050a16]/80 text-slate-300 border-white/[0.1] hover:text-white hover:border-cyan-500/40'
          }`}
          title="Draw Custom Scan Polygon (Click map to drop perimeter pins)"
        >
          <Pentagon className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">
            {isDrawingPolygon
              ? `Drawing (${polygonPointsCount} pts)`
              : polygonPointsCount > 0
              ? `Polygon (${polygonPointsCount})`
              : 'Polygon'}
          </span>
        </button>

        {polygonPointsCount > 0 && (
          <button
            onClick={onClearPolygon}
            className="p-1.5 rounded-lg bg-red-950/80 border border-red-500/40 text-red-400 hover:bg-red-900/90 transition shadow-lg"
            title="Clear Custom Scan Polygon"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Camera POV & Bearing FOV Cones Toggle */}
        <button
          onClick={onTogglePOVCones}
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center space-x-1.5 backdrop-blur-xl ${
            showPOVCones
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
              : 'bg-[#050a16]/80 text-slate-400 border-white/[0.1] hover:text-slate-200'
          }`}
          title="Toggle Camera Bearing POV Cones"
        >
          <Compass className={`w-3.5 h-3.5 ${showPOVCones ? 'text-cyan-400' : 'text-slate-500'}`} />
          <span className="hidden md:inline">POV CONES</span>
        </button>

        {/* Chronological Timeline Filter Toggle (2010–2026 Archive) */}
        <button
          onClick={() => setShowTimelineSlider(!showTimelineSlider)}
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center space-x-1.5 backdrop-blur-xl ${
            timeline.enabled
              ? 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/50'
              : 'bg-[#050a16]/80 text-slate-300 border-white/[0.1] hover:text-white'
          }`}
          title="Filter Timeline Archive (2010 - 2026)"
        >
          <History className={`w-3.5 h-3.5 ${timeline.enabled ? 'text-amber-400 animate-spin-slow' : 'text-amber-400'}`} />
          <span className="hidden sm:inline">
            {timeline.enabled ? `${timeline.minYear}-${timeline.maxYear}` : '2010–2026'}
          </span>
        </button>

        {/* Global Map Theme Selector */}
        <div className="relative">
          <button
            onClick={() => setShowThemePicker(!showThemePicker)}
            className="px-2.5 py-1.5 rounded-lg bg-[#050a16]/80 hover:bg-slate-900 border border-white/[0.1] text-cyan-400 hover:text-cyan-300 text-xs font-bold flex items-center space-x-1.5 shadow-lg backdrop-blur-xl transition"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{MAP_THEMES[currentTheme].name.split(' ')[0]}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showThemePicker && (
            <div className="absolute right-0 mt-1.5 w-60 bg-[#060c1c]/95 border border-white/[0.1] rounded-xl p-1.5 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-100 space-y-1">
              <div className="text-[9px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider border-b border-white/[0.06]">
                Map Base Layer
              </div>
              {Object.values(MAP_THEMES).map(theme => (
                <button
                  key={theme.id}
                  onClick={() => {
                    onThemeChange(theme.id);
                    setShowThemePicker(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition ${
                    currentTheme === theme.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <span>{theme.name}</span>
                  {currentTheme === theme.id && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Expanded Timeline Slider Drawer (2010–2026) */}
      {showTimelineSlider && (
        <div className="absolute top-14 right-3 z-20 w-80 bg-[#060c1c]/95 border border-cyan-500/30 rounded-xl p-3.5 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-150 font-mono text-xs select-none">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 mb-2.5">
            <div className="flex items-center space-x-1.5 text-amber-400 font-bold text-[10px] uppercase">
              <History className="w-3.5 h-3.5" />
              <span>Archive Timeline Scrubber</span>
            </div>
            <button
              onClick={() => onTimelineChange({ ...timeline, enabled: !timeline.enabled })}
              className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition ${
                timeline.enabled
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {timeline.enabled ? 'ACTIVE FILTER' : 'ALL YEARS'}
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Historical Window:</span>
              <span className="text-cyan-400 font-extrabold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                {timeline.minYear} — {timeline.maxYear} ({timeline.maxYear - timeline.minYear + 1} yrs)
              </span>
            </div>

            {/* Dual Range Scrubber for 2010–2026 */}
            <div className="space-y-1.5 bg-[#030712] p-2.5 rounded-lg border border-white/[0.06]">
              <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                <span>Start: <strong className="text-amber-400">{timeline.minYear}</strong></span>
                <span>End: <strong className="text-cyan-400">{timeline.maxYear}</strong></span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[9px] text-slate-500 font-mono">2010</span>
                <input
                  type="range"
                  min="2010"
                  max="2026"
                  step="1"
                  value={timeline.minYear}
                  onChange={e => {
                    const val = parseInt(e.target.value, 10);
                    if (val <= timeline.maxYear) {
                      onTimelineChange({ ...timeline, minYear: val, enabled: true });
                    }
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  title={`Start Year: ${timeline.minYear}`}
                />
                <input
                  type="range"
                  min="2010"
                  max="2026"
                  step="1"
                  value={timeline.maxYear}
                  onChange={e => {
                    const val = parseInt(e.target.value, 10);
                    if (val >= timeline.minYear) {
                      onTimelineChange({ ...timeline, maxYear: val, enabled: true });
                    }
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  title={`End Year: ${timeline.maxYear}`}
                />
                <span className="text-[9px] text-slate-500 font-mono">2026</span>
              </div>
            </div>

            {/* Historical Epoch Quick Preset Chips */}
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <button
                onClick={() => onTimelineChange({ minYear: 2010, maxYear: 2017, enabled: true })}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[9px] text-slate-300 border border-white/[0.06] hover:border-amber-400/40 text-left transition"
              >
                📜 2010–2017 Archive
              </button>
              <button
                onClick={() => onTimelineChange({ minYear: 2018, maxYear: 2023, enabled: true })}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[9px] text-slate-300 border border-white/[0.06] hover:border-cyan-400/40 text-left transition"
              >
                🏛️ 2018–2023 Past
              </button>
              <button
                onClick={() => onTimelineChange({ minYear: 2024, maxYear: 2026, enabled: true })}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[9px] text-cyan-300 font-bold border border-cyan-500/30 text-left transition"
              >
                ⚡ 2024–2026 Recent
              </button>
              <button
                onClick={() => onTimelineChange({ minYear: 2010, maxYear: 2026, enabled: false })}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[9px] text-slate-400 hover:text-white border border-white/[0.06] flex items-center justify-between transition"
              >
                <span>Reset 2010–2026</span>
                <RotateCcw className="w-2.5 h-2.5 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Centralized Bottom Sentinel Telemetry Ribbon */}
      <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-none flex items-center justify-between font-mono text-[10px] select-none">
        <div className="px-3 py-1.5 rounded-lg bg-[#050a16]/85 border border-white/[0.08] text-slate-400 backdrop-blur-2xl flex items-center space-x-3.5 pointer-events-auto shadow-2xl">
          <div className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-slate-500">ORIGIN:</span>
            <span className="text-cyan-400 font-bold">
              {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
            </span>
          </div>

          <div className="hidden sm:block text-slate-700">|</div>

          <div className="hidden sm:block">
            <span className="text-slate-500">RADAR:</span>
            <span className="text-cyan-400 font-bold"> {radiusKm} KM</span>
          </div>

          <div className="text-slate-700">|</div>

          <div className="flex items-center space-x-1">
            <span className="text-slate-500">ZOOM:</span>
            <span className={`font-bold ${zoomLevel >= 18 ? 'text-emerald-400 animate-pulse' : 'text-cyan-300'}`}>
              L{zoomLevel} {zoomLevel >= 19 ? '(ULTRA 4K)' : zoomLevel >= 17 ? '(STREET)' : ''}
            </span>
          </div>

          <div className="hidden md:block text-slate-700">|</div>

          <div className="hidden md:block">
            <span className="text-slate-500">FOUND:</span>
            <span className="text-amber-400 font-bold"> {videoCount} INTEL</span>
          </div>

          {polygonPointsCount > 0 && (
            <>
              <div className="text-slate-700">|</div>
              <div className="text-amber-300 font-bold">
                🎯 SCAN POLYGON: {polygonPointsCount} PTS
              </div>
            </>
          )}

          {timeline.enabled ? (
            <>
              <div className="text-slate-700">|</div>
              <div className="text-amber-300 font-bold flex items-center space-x-1">
                <History className="w-3 h-3 text-amber-400" />
                <span>{timeline.minYear}–{timeline.maxYear}</span>
              </div>
            </>
          ) : (
            <>
              <div className="hidden lg:block text-slate-700">|</div>
              <div className="hidden lg:block text-slate-500">
                SPAN: <span className="text-slate-300">2010–2026</span>
              </div>
            </>
          )}
        </div>

        {/* Global GPS Quick-Locate */}
        <div className="pointer-events-auto flex items-center space-x-2">
          <button
            onClick={onLocateMe}
            disabled={isLocating}
            className={`px-3 py-1.5 rounded-lg bg-[#050a16]/85 hover:bg-slate-900 border border-white/[0.1] text-cyan-400 hover:text-cyan-300 shadow-2xl backdrop-blur-2xl transition flex items-center space-x-1.5 ${
              isLocating ? 'animate-pulse' : ''
            }`}
            title="Recenter Map to My GPS Location"
          >
            <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isLocating ? 'Locating...' : 'GPS Recenter'}</span>
          </button>
        </div>
      </div>
    </>
  );
};

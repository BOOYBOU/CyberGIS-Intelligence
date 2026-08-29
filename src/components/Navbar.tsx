import React from 'react';
import {
  Crosshair,
  Map,
  Download,
  Radio,
  Layers,
  Globe,
  Orbit
} from 'lucide-react';
import { VideoItem, GlobalMapTheme } from '../types';
import { MAP_THEMES } from '../services/mapThemeService';

interface NavbarProps {
  targetName: string;
  lat: number;
  lng: number;
  radiusKm: number;
  videos: VideoItem[];
  currentTheme: GlobalMapTheme;
  onThemeChange: (theme: GlobalMapTheme) => void;
  onOpenExport: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenSolarSystem?: () => void;
}

const NavbarComponent: React.FC<NavbarProps> = ({
  targetName,
  lat,
  lng,
  radiusKm,
  videos,
  currentTheme,
  onThemeChange,
  onOpenExport,
  sidebarOpen,
  onToggleSidebar,
  onOpenSolarSystem
}) => {
  return (
    <header className="h-13 bg-[#030712]/90 border-b border-white/[0.08] px-4 flex items-center justify-between select-none z-40 backdrop-blur-2xl relative">
      {/* Brand & Project Identity */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className={`p-1.5 rounded-lg border transition-all flex items-center justify-center ${
            sidebarOpen
              ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
          }`}
          title="Toggle Command Drawer (Search & Recon Feed)"
        >
          <Radio className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <span className="font-extrabold text-sm tracking-tight text-white font-mono">
              GEO<span className="text-cyan-400 font-black">//SENTINEL</span>
            </span>
          </div>
          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
            OSINT RECON
          </span>
        </div>
      </div>

      {/* Center Target Status HUD Pill */}
      <div className="hidden md:flex items-center space-x-2.5 px-3 py-1 rounded-full bg-slate-900/70 border border-white/[0.08] text-xs font-mono backdrop-blur-xl">
        <div className="flex items-center space-x-1.5 text-cyan-400">
          <Crosshair className="w-3.5 h-3.5" />
          <span className="font-bold text-slate-200 truncate max-w-[180px]">
            {targetName.split(',')[0]}
          </span>
        </div>
        <span className="text-slate-700 font-light">|</span>
        <div className="text-slate-400 text-[11px]">
          {lat.toFixed(3)}°, {lng.toFixed(3)}°
        </div>
        <span className="text-slate-700 font-light">|</span>
        <div className="text-cyan-400 font-bold text-[11px]">
          {radiusKm}km
        </div>
        <span className="text-slate-700 font-light">|</span>
        <div className="text-amber-400 font-bold text-[11px] flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span>{videos.length} INTEL</span>
        </div>
      </div>

      {/* Active Base Map Switcher & Export */}
      <div className="flex items-center space-x-2.5">
        {/* Quick Map Base Layer Toggle: Esri 4K vs Google Sat vs Google Streets */}
        <div className="flex bg-slate-950/80 p-0.5 rounded-lg border border-white/[0.08] shadow-inner font-mono text-[11px]">
          <button
            onClick={() => onThemeChange('esri_sat')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md font-bold transition-all ${
              currentTheme === 'esri_sat'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Esri World Imagery 4K (Ultra High-Res Satellite - Zoom 22)"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>ESRI 4K</span>
          </button>

          <button
            onClick={() => onThemeChange('google_sat')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md font-bold transition-all ${
              currentTheme === 'google_sat'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Google Satellite Ultra-HD 4K (Zoom 22 Close-Up)"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>GOOGLE SAT 4K</span>
          </button>

          <button
            onClick={() => onThemeChange('google_streets')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md font-bold transition-all ${
              currentTheme === 'google_streets'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Google Streets Tactical (Zoom 22)"
          >
            <Map className="w-3.5 h-3.5" />
            <span>STREETS</span>
          </button>
        </div>

        {/* Solar System Exploration Launcher */}
        {onOpenSolarSystem && (
          <button
            onClick={onOpenSolarSystem}
            className="flex items-center space-x-1.5 px-3 py-1 bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-blue-500/20 hover:from-amber-500/30 hover:to-cyan-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/40 hover:border-amber-400/70 rounded-lg text-xs font-mono font-bold transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            title="فتح استكشاف المجموعة الشمسية والفضاء 3D"
          >
            <Orbit className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '20s' }} />
            <span className="hidden md:inline">SOLAR SYSTEM</span>
            <span className="md:hidden">الفضاء</span>
          </button>
        )}

        {/* Export Intelligence Button */}
        <button
          onClick={onOpenExport}
          className="flex items-center space-x-1.5 px-3 py-1 bg-slate-900 hover:bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/60 rounded-lg text-xs font-mono font-bold transition-all shadow-[0_0_12px_rgba(6,182,212,0.15)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          title="Export GeoJSON, KML 3D, Maltego CSV, JSON"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">EXPORT</span>
        </button>
      </div>
    </header>
  );
};

export const Navbar = React.memo(NavbarComponent);



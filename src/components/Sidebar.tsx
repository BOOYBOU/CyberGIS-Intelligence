import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  MapPin,
  Radar,
  Sparkles,
  Key,
  ChevronDown,
  ChevronUp,
  Compass,
  Play,
  Filter,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Radio,
  Calendar,
  X,
  SlidersHorizontal,
  Layers,
  ArrowUpRight,
  Orbit
} from 'lucide-react';
import { VideoItem, PresetLocation, TimelineFilter } from '../types';
import { SolarSystemSection } from './SolarSystemSection';
import { CelestialBodyData } from '../services/solarSystemService';

interface SidebarProps {
  searchInput: string;
  onSearchInputChange: (val: string) => void;
  radiusKm: number;
  onRadiusChange: (val: number) => void;
  keyword: string;
  onKeywordChange: (val: string) => void;
  apiKey: string;
  onApiKeyChange: (val: string) => void;
  videos: VideoItem[];
  selectedVideo: VideoItem | null;
  isLoading: boolean;
  onExecuteSearch: () => void;
  onSelectPreset: (preset: PresetLocation) => void;
  onSelectVideo: (video: VideoItem) => void;
  onDirectLocationSelect?: (lat: number, lng: number, name: string) => void;
  timeline: TimelineFilter;
  polygonPointsCount: number;
  isOpen: boolean;
  onClose: () => void;
  sidebarMode?: 'recon' | 'solar';
  onSidebarModeChange?: (mode: 'recon' | 'solar') => void;
  onSelectCelestialBody?: (body: CelestialBodyData) => void;
  onOpenCelestialModal?: (body: CelestialBodyData) => void;
  activeCelestialBodyId?: string | null;
}

interface SuggestionItem {
  name: string;
  display_name: string;
  lat: number;
  lng: number;
  type?: string;
}

const MOROCCO_PRESETS: PresetLocation[] = [
  { name: 'Agadir', country: 'Morocco', lat: 30.4278, lng: -9.5981, description: 'Taghazout, Souss-Massa' },
  { name: 'Casablanca', country: 'Morocco', lat: 33.5731, lng: -7.5898, description: 'Hassan II Mosque' },
  { name: 'Marrakech', country: 'Morocco', lat: 31.6295, lng: -7.9811, description: 'Medina & Atlas' },
  { name: 'Tangier', country: 'Morocco', lat: 35.7595, lng: -5.8340, description: 'Strait of Gibraltar' },
  { name: 'Rabat', country: 'Morocco', lat: 34.0209, lng: -6.8416, description: 'Hassan Tower' },
  { name: 'Fes', country: 'Morocco', lat: 34.0181, lng: -5.0078, description: 'Old Medina' },
  { name: 'Dakhla', country: 'Morocco', lat: 23.7145, lng: -15.9328, description: 'Saharan Atlantic Coast' },
  { name: 'Ouarzazate', country: 'Morocco', lat: 30.9335, lng: -6.9370, description: 'Atlas Studios' },
  { name: 'Essaouira', country: 'Morocco', lat: 31.5085, lng: -9.7595, description: 'Mogador Ramparts' }
];

const GLOBAL_PRESETS: PresetLocation[] = [
  { name: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708, description: 'Burj Khalifa' },
  { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, description: 'Eiffel Tower' },
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, description: 'Shibuya' },
  { name: 'New York', country: 'USA', lat: 40.7128, lng: -74.0060, description: 'Manhattan' },
  { name: 'London', country: 'UK', lat: 51.5074, lng: -0.1278, description: 'Westminster' },
  { name: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357, description: 'Giza Pyramids' },
  { name: 'Istanbul', country: 'Turkey', lat: 41.0082, lng: 28.9784, description: 'Bosphorus' }
];

const RADAR_PRESETS = [10, 25, 50, 100, 200];

const TOPIC_CHIPS = [
  '2026 latest',
  'drone 4k',
  'walking tour',
  'drive 4k',
  '2010 archive',
  '2015 footage',
  '2020 era',
  'city center',
  'night tour'
];

const SidebarComponent: React.FC<SidebarProps> = ({
  searchInput,
  onSearchInputChange,
  radiusKm,
  onRadiusChange,
  keyword,
  onKeywordChange,
  apiKey,
  onApiKeyChange,
  videos,
  selectedVideo,
  isLoading,
  onExecuteSearch,
  onSelectPreset,
  onSelectVideo,
  onDirectLocationSelect,
  timeline,
  polygonPointsCount,
  isOpen,
  onClose,
  sidebarMode = 'recon',
  onSidebarModeChange,
  onSelectCelestialBody,
  onOpenCelestialModal,
  activeCelestialBodyId
}) => {
  const [internalMode, setInternalMode] = useState<'recon' | 'solar'>(sidebarMode);
  const currentMode = onSidebarModeChange ? sidebarMode : internalMode;
  const setMode = onSidebarModeChange || setInternalMode;

  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'morocco' | 'global'>('morocco');
  const [sortBy, setSortBy] = useState<'distance' | 'recent'>('distance');
  
  // Autocomplete Suggestions State
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounced live suggestions with AbortController cancellation
  useEffect(() => {
    if (!searchInput || searchInput.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestionsDropdown(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearchingSuggestions(true);
      try {
        const res = await fetch(`/suggest?q=${encodeURIComponent(searchInput.trim())}`, {
          signal: controller.signal
        });
        if (res.ok) {
          const data = await res.json();
          if (data.suggestions && data.suggestions.length > 0) {
            setSuggestions(data.suggestions);
            setShowSuggestionsDropdown(true);
          } else {
            setSuggestions([]);
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Suggestions error:', err);
        }
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 140);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [searchInput]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestionsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = (sug: SuggestionItem) => {
    onSearchInputChange(sug.display_name);
    setShowSuggestionsDropdown(false);
    if (onDirectLocationSelect) {
      onDirectLocationSelect(sug.lat, sug.lng, sug.name || sug.display_name);
    } else {
      onExecuteSearch();
    }
  };

  // Filter with Timeline and sort videos
  const processedVideos = useMemo(() => {
    const filtered = videos.filter(v => {
      if (!timeline.enabled) return true;
      const yr = v.published_year || 2026;
      return yr >= timeline.minYear && yr <= timeline.maxYear;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'distance') return a.distance_km - b.distance_km;
      return (b.published_time || '').localeCompare(a.published_time || '');
    });
  }, [videos, timeline, sortBy]);

  return (
    <aside
      className={`fixed lg:relative inset-y-0 left-0 z-30 w-84 sm:w-92 bg-[#050a16]/90 border-r border-white/[0.08] backdrop-blur-2xl flex flex-col transition-all duration-300 ease-in-out font-mono transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Top Primary Scope Switcher: Geospatial Recon vs Solar System */}
      <div className="p-2.5 border-b border-white/[0.08] bg-[#030712]/80 shrink-0">
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-white/[0.08] text-xs">
          <button
            onClick={() => setMode('recon')}
            className={`py-1.5 px-2 rounded-lg font-bold transition-all flex items-center justify-center space-x-1.5 ${
              currentMode === 'recon'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>استطلاع أرضي</span>
          </button>
          <button
            onClick={() => setMode('solar')}
            className={`py-1.5 px-2 rounded-lg font-bold transition-all flex items-center justify-center space-x-1.5 ${
              currentMode === 'solar'
                ? 'bg-gradient-to-r from-amber-500 to-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'text-amber-300/90 hover:text-amber-300 hover:bg-amber-500/10'
            }`}
          >
            <Orbit className="w-3.5 h-3.5" />
            <span>المجموعة الشمسية</span>
          </button>
        </div>
      </div>

      {currentMode === 'solar' ? (
        <div className="p-3 flex-1 overflow-hidden">
          <SolarSystemSection
            onSelectBodyFor3D={body => {
              if (onSelectCelestialBody) onSelectCelestialBody(body);
            }}
            onOpenDetailedModal={body => {
              if (onOpenCelestialModal) onOpenCelestialModal(body);
            }}
            activeBodyId={activeCelestialBodyId}
          />
        </div>
      ) : (
        <>
          {/* Top OSINT Search & Targeting Box */}
          <div className="p-3.5 border-b border-white/[0.08] bg-[#070e20]/60 space-y-3 shrink-0">
            {/* Drawer Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-[11px] font-bold tracking-wider text-slate-200 uppercase">
                  TARGETING // RECON
                </span>
              </div>

              <button
                onClick={onClose}
                className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

        {/* Location Search Bar with Suggestions */}
        <div className="space-y-1 relative" ref={searchContainerRef}>
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchInput}
              onChange={e => {
                onSearchInputChange(e.target.value);
                setShowSuggestionsDropdown(true);
              }}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestionsDropdown(true);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  setShowSuggestionsDropdown(false);
                  onExecuteSearch();
                }
              }}
              placeholder="Search city, district, coords..."
              className="w-full bg-[#030712] border border-white/[0.1] focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 text-xs text-white rounded-lg px-3 py-2 pl-8 pr-7 outline-none transition placeholder-slate-500 shadow-inner"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5" />
            {isSearchingSuggestions ? (
              <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin absolute right-2.5" />
            ) : searchInput ? (
              <button
                onClick={() => onSearchInputChange('')}
                className="absolute right-2 text-slate-500 hover:text-slate-300 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            ) : null}
          </div>

          {/* Autocomplete Dropdown */}
          {showSuggestionsDropdown && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#060c1c] border border-cyan-500/30 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-white/[0.06] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
              {suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSuggestion(sug)}
                  className="w-full text-left px-3 py-2 hover:bg-cyan-950/40 transition flex items-start space-x-2 text-xs"
                >
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <div className="overflow-hidden">
                    <div className="font-semibold text-slate-200 truncate">{sug.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{sug.display_name}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Radius Slider & Range Chips */}
        <div className="bg-[#030712] p-2.5 rounded-lg border border-white/[0.06] space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center space-x-1 uppercase font-bold text-slate-300">
              <Radar className="w-3 h-3 text-cyan-400" />
              <span>Scanning Radius</span>
            </span>
            <span className="font-extrabold text-cyan-400 text-xs">{radiusKm} KM</span>
          </div>

          <input
            type="range"
            min="5"
            max="250"
            step="5"
            value={radiusKm}
            onChange={e => onRadiusChange(Number(e.target.value))}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
          />

          {/* Quick Radius Chips */}
          <div className="flex items-center justify-between pt-1">
            {RADAR_PRESETS.map(r => (
              <button
                key={r}
                onClick={() => onRadiusChange(r)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition ${
                  radiusKm === r
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                }`}
              >
                {r}km
              </button>
            ))}
          </div>
        </div>

        {/* Keyword Filter & Topic Chips */}
        <div className="space-y-1.5">
          <div className="relative">
            <input
              type="text"
              value={keyword}
              onChange={e => onKeywordChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onExecuteSearch()}
              placeholder="Filter keywords (e.g. 4k, drone)..."
              className="w-full bg-[#030712] border border-white/[0.08] focus:border-cyan-400 text-xs text-white rounded-lg px-2.5 py-1.5 pl-7 pr-6 outline-none transition placeholder-slate-600"
            />
            <Filter className="w-3 h-3 text-slate-500 absolute left-2.5 top-2.5" />
            {keyword && (
              <button
                onClick={() => onKeywordChange('')}
                className="absolute right-2 top-2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick Topic Chips */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-0.5 scrollbar-none text-[9px]">
            {TOPIC_CHIPS.map(chip => (
              <button
                key={chip}
                onClick={() => onKeywordChange(keyword === chip ? '' : chip)}
                className={`px-2 py-0.5 rounded-full whitespace-nowrap transition border ${
                  keyword === chip
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                    : 'bg-slate-900/60 text-slate-400 border-white/[0.06] hover:text-slate-200'
                }`}
              >
                #{chip}
              </button>
            ))}
          </div>
        </div>

        {/* Execute Scan Button */}
        <button
          onClick={onExecuteSearch}
          disabled={isLoading}
          className={`w-full py-2 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition shadow-lg ${
            isLoading
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Scanning Geospatial Vectors...</span>
            </>
          ) : (
            <>
              <Radar className="w-3.5 h-3.5" />
              <span>
                {polygonPointsCount > 0
                  ? `Scan Custom Polygon (${polygonPointsCount} pts)`
                  : 'Scan & Discover Videos'}
              </span>
            </>
          )}
        </button>

        {/* YouTube API Config Accordion */}
        <div className="border-t border-white/[0.06] pt-1.5">
          <button
            onClick={() => setIsApiKeyOpen(!isApiKeyOpen)}
            className="w-full flex items-center justify-between text-[10px] text-slate-400 hover:text-slate-200 transition"
          >
            <div className="flex items-center space-x-1.5">
              <Key className="w-3 h-3 text-amber-400" />
              <span>YouTube API Key</span>
              {apiKey ? (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              ) : (
                <span className="text-[9px] text-slate-500">(Autonomous Mode)</span>
              )}
            </div>
            {isApiKeyOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {isApiKeyOpen && (
            <div className="mt-1.5 p-2 bg-[#030712] rounded-lg border border-white/[0.06] space-y-1 animate-in fade-in duration-100">
              <input
                type="password"
                value={apiKey}
                onChange={e => onApiKeyChange(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-[#070e20] border border-slate-800 text-[11px] text-slate-200 rounded px-2 py-1 outline-none focus:border-cyan-400"
              />
              <p className="text-[9px] text-slate-500 leading-tight">
                Autonomous scraping runs automatically if no key is supplied.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Target Presets Ribbon */}
      <div className="px-3.5 py-2 border-b border-white/[0.06] bg-[#050a16] shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
            <Compass className="w-3 h-3 text-cyan-400" />
            <span>Target Presets</span>
          </div>

          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('morocco')}
              className={`px-1.5 py-0.2 rounded text-[9px] font-bold transition ${
                activeTab === 'morocco'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🇲🇦 Morocco
            </button>
            <button
              onClick={() => setActiveTab('global')}
              className={`px-1.5 py-0.2 rounded text-[9px] font-bold transition ${
                activeTab === 'global'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🌍 Global
            </button>
          </div>
        </div>

        <div className="flex space-x-1 overflow-x-auto pb-0.5 scrollbar-none">
          {(activeTab === 'morocco' ? MOROCCO_PRESETS : GLOBAL_PRESETS).map(preset => (
            <button
              key={preset.name}
              onClick={() => onSelectPreset(preset)}
              className="px-2 py-0.5 bg-slate-900/80 hover:bg-cyan-950/40 border border-white/[0.06] hover:border-cyan-500/40 rounded text-slate-300 hover:text-cyan-300 text-[10px] whitespace-nowrap transition"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Recon Feed Header */}
      <div className="px-3.5 py-1.5 bg-[#070e20] border-b border-white/[0.06] flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center space-x-1.5">
          <span className="font-bold text-slate-200 text-[11px]">DISCOVERED INTEL</span>
          <span className="px-1.5 py-0.2 text-[9px] rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-bold">
            {processedVideos.length}
          </span>
          {timeline.enabled && (
            <span className="text-[9px] text-amber-400 font-bold">
              ({timeline.minYear}-{timeline.maxYear})
            </span>
          )}
        </div>

        <button
          onClick={() => setSortBy(sortBy === 'distance' ? 'recent' : 'distance')}
          className="text-[9px] text-slate-400 hover:text-slate-200 flex items-center space-x-1 bg-slate-900/80 px-1.5 py-0.5 rounded border border-white/[0.08]"
        >
          <span>{sortBy === 'distance' ? 'Nearest' : 'Recent'}</span>
        </button>
      </div>

      {/* Intel Video Feed List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {processedVideos.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-slate-500">
            <AlertCircle className="w-6 h-6 text-slate-600 mb-1.5" />
            <p className="text-xs font-semibold text-slate-400">No Target Videos Discovered</p>
            <p className="text-[10px] text-slate-500 mt-1 max-w-[200px]">
              Widen the radar radius, disable timeline filter, or search another location.
            </p>
          </div>
        ) : (
          processedVideos.map(video => {
            const isSelected = selectedVideo?.video_id === video.video_id;
            return (
              <div
                key={video.video_id}
                onClick={() => onSelectVideo(video)}
                className={`p-2 rounded-xl cursor-pointer transition-all flex space-x-2.5 group ${
                  isSelected
                    ? 'bg-cyan-950/40 border border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    : 'bg-[#070e20]/60 hover:bg-[#0c1630] border border-white/[0.06] hover:border-cyan-500/30'
                }`}
              >
                {/* Thumbnail Preview */}
                <div className="relative w-22 h-14 rounded-lg overflow-hidden bg-black shrink-0 border border-white/[0.08]">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={e => {
                      (e.target as HTMLElement).setAttribute(
                        'src',
                        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&q=80'
                      );
                    }}
                  />
                  {video.duration && (
                    <span className="absolute bottom-0.5 right-0.5 bg-black/85 text-white text-[8px] font-bold px-1 rounded">
                      {video.duration}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100">
                    <Play className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                  </div>
                </div>

                {/* Video Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <h4
                      className={`text-[11px] font-bold leading-tight line-clamp-2 transition-colors ${
                        isSelected ? 'text-cyan-300' : 'text-slate-200 group-hover:text-cyan-400'
                      }`}
                    >
                      {video.title}
                    </h4>
                    <p className="text-[9px] text-slate-400 truncate mt-0.5">{video.author}</p>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1 border-t border-white/[0.04] pt-1">
                    <span className="text-cyan-400 font-semibold flex items-center space-x-0.5">
                      <MapPin className="w-2.5 h-2.5" />
                      <span>{video.distance_km} km</span>
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded border font-mono font-bold text-[8px] ${
                        (video.published_year || 2026) <= 2014
                          ? 'bg-amber-950/90 text-amber-300 border-amber-500/50'
                          : (video.published_year || 2026) <= 2019
                          ? 'bg-indigo-950/90 text-indigo-300 border-indigo-500/50'
                          : (video.published_year || 2026) <= 2023
                          ? 'bg-teal-950/90 text-teal-300 border-teal-500/50'
                          : 'bg-cyan-950/90 text-cyan-300 border-cyan-500/50'
                      }`}
                    >
                      {video.published_year ? `${video.published_year}` : 'Recent'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
        </>
      )}
    </aside>
  );
};

export const Sidebar = React.memo(SidebarComponent);


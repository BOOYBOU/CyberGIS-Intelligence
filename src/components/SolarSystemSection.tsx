import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Compass,
  Rocket,
  Info,
  Scale,
  Orbit,
  Thermometer,
  Layers,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Globe2,
  Atom,
  Clock
} from 'lucide-react';
import { SOLAR_SYSTEM_DATA, CelestialBodyData, calculateWeightOnBody } from '../services/solarSystemService';

interface SolarSystemSectionProps {
  onSelectBodyFor3D: (body: CelestialBodyData) => void;
  onOpenDetailedModal: (body: CelestialBodyData) => void;
  activeBodyId?: string | null;
}

export const SolarSystemSection: React.FC<SolarSystemSectionProps> = ({
  onSelectBodyFor3D,
  onOpenDetailedModal,
  activeBodyId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [userWeightKg, setUserWeightKg] = useState<number>(70);
  const [showWeightCalc, setShowWeightCalc] = useState<boolean>(false);
  const [comparisonMode, setComparisonMode] = useState<boolean>(false);

  const filteredBodies = useMemo(() => {
    return SOLAR_SYSTEM_DATA.filter(body => {
      const matchesCat =
        selectedCategory === 'all' ||
        (selectedCategory === 'terrestrial' && (body.category === 'terrestrial' || body.category === 'satellite')) ||
        (selectedCategory === 'giants' && (body.category === 'gas_giant' || body.category === 'ice_giant')) ||
        (selectedCategory === 'others' && (body.category === 'dwarf' || body.category === 'belt' || body.category === 'star'));

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        body.name.toLowerCase().includes(q) ||
        body.arabicName.includes(q) ||
        body.subtitle.toLowerCase().includes(q) ||
        body.arabicSubtitle.includes(q);

      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="flex flex-col h-full space-y-3.5 select-none font-sans" dir="rtl">
      {/* Header Banner */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-cyan-500/10 to-blue-600/10 border border-cyan-500/30 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-28 h-28 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5 space-x-reverse">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Orbit className="w-5 h-5 animate-spin" style={{ animationDuration: '24s' }} />
            </div>
            <div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="font-extrabold text-sm text-white font-mono tracking-tight">
                  المجموعة الشمسية
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  SOLAR SYSTEM
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans mt-0.5">
                استكشاف سينمائي ثلاثي الأبعاد لأجرام وكواكب النظام الشمسي
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Filter Categories */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/80 rounded-lg border border-white/[0.08] text-[11px] font-mono">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`py-1.5 rounded-md font-bold transition-all text-center ${
            selectedCategory === 'all'
              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          الكل ({SOLAR_SYSTEM_DATA.length})
        </button>
        <button
          onClick={() => setSelectedCategory('terrestrial')}
          className={`py-1.5 rounded-md font-bold transition-all text-center ${
            selectedCategory === 'terrestrial'
              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          صخرية
        </button>
        <button
          onClick={() => setSelectedCategory('giants')}
          className={`py-1.5 rounded-md font-bold transition-all text-center ${
            selectedCategory === 'giants'
              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          عمالقة
        </button>
        <button
          onClick={() => setSelectedCategory('others')}
          className={`py-1.5 rounded-md font-bold transition-all text-center ${
            selectedCategory === 'others'
              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          الشمس/أقزام
        </button>
      </div>

      {/* Search and Tool Toggles */}
      <div className="flex items-center space-x-2 space-x-reverse">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ابحث عن كوكب، قمر، أو نجم..."
            className="w-full bg-slate-900/90 border border-white/[0.1] rounded-lg py-1.5 pr-8 pl-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition-all font-sans"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Gravity Calculator Toggle */}
        <button
          onClick={() => setShowWeightCalc(!showWeightCalc)}
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center space-x-1.5 space-x-reverse transition-all ${
            showWeightCalc
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
              : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
          title="حاسبة وزنك على كل كوكب"
        >
          <Scale className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">الوزن</span>
        </button>
      </div>

      {/* Cosmic Weight Simulator Panel (Optional Expansion) */}
      {showWeightCalc && (
        <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-2.5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-300 flex items-center space-x-1.5 space-x-reverse font-mono">
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              <span>حاسبة الجاذبية الكونية:</span>
            </span>
            <div className="flex items-center space-x-1.5 space-x-reverse font-mono text-slate-300">
              <span>وزنك على الأرض:</span>
              <input
                type="number"
                min="10"
                max="300"
                value={userWeightKg}
                onChange={e => setUserWeightKg(Number(e.target.value) || 0)}
                className="w-14 bg-slate-900 border border-amber-500/40 rounded px-1.5 py-0.5 text-center text-amber-300 font-bold focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">كغ</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
            {['sun', 'moon', 'mars', 'jupiter', 'saturn', 'pluto'].map(pid => {
              const body = SOLAR_SYSTEM_DATA.find(b => b.id === pid);
              if (!body) return null;
              const w = calculateWeightOnBody(userWeightKg, pid);
              return (
                <div key={pid} className="p-1.5 rounded-lg bg-slate-900/90 border border-white/[0.06] flex flex-col items-center text-center">
                  <span className="text-slate-400 text-[10px] truncate">{body.arabicName}</span>
                  <span className="font-bold text-amber-400 text-xs mt-0.5">{w} كغ</span>
                  <span className="text-[9px] text-slate-500 font-sans">({body.gravityFactor}g)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Celestial Bodies Feed List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 pl-0.5 custom-scrollbar">
        {filteredBodies.map(body => {
          const isCurrentActive = activeBodyId === body.id;
          return (
            <div
              key={body.id}
              className={`p-3 rounded-xl border transition-all relative overflow-hidden group ${
                isCurrentActive
                  ? 'bg-cyan-950/40 border-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                  : 'bg-slate-900/70 border-white/[0.08] hover:border-cyan-500/40 hover:bg-slate-900/90'
              }`}
            >
              {/* Background Ambient Glow */}
              <div
                className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20 pointer-events-none transition-opacity group-hover:opacity-40"
                style={{ backgroundColor: body.color }}
              />

              {/* Body Header Row */}
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center space-x-2.5 space-x-reverse">
                  {/* Planet Sphere Icon / Orb Badge */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center border shadow-md relative overflow-hidden shrink-0"
                    style={{
                      backgroundColor: `${body.color}22`,
                      borderColor: body.color,
                      boxShadow: `0 0 10px ${body.color}44`
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{
                        backgroundColor: body.color,
                        boxShadow: `0 0 8px ${body.glowColor}`
                      }}
                    />
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <h4 className="font-extrabold text-sm text-white font-sans">
                        {body.arabicName}
                      </h4>
                      <span className="text-slate-400 font-mono text-xs">
                        ({body.name})
                      </span>
                    </div>
                    <span className="text-[10px] text-cyan-300 font-sans block mt-0.5">
                      {body.arabicSubtitle}
                    </span>
                  </div>
                </div>

                {/* Category Badge */}
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-slate-800/80 border border-white/[0.1] text-slate-300 shrink-0">
                  {body.categoryLabelAr}
                </span>
              </div>

              {/* Key Astronomical Stats Matrix */}
              <div className="grid grid-cols-3 gap-1.5 mt-2.5 pt-2 border-t border-white/[0.06] text-[10px] font-mono">
                <div className="bg-slate-950/60 p-1.5 rounded border border-white/[0.04]">
                  <span className="text-slate-500 block text-[9px]">البعد عن الشمس</span>
                  <span className="text-slate-200 font-bold truncate block">{body.distanceAU} AU</span>
                </div>
                <div className="bg-slate-950/60 p-1.5 rounded border border-white/[0.04]">
                  <span className="text-slate-500 block text-[9px]">القطر الكوكبي</span>
                  <span className="text-cyan-300 font-bold truncate block">{body.diameter.split(' ')[0]} كم</span>
                </div>
                <div className="bg-slate-950/60 p-1.5 rounded border border-white/[0.04]">
                  <span className="text-slate-500 block text-[9px]">الجاذبية / الأقمار</span>
                  <span className="text-amber-400 font-bold truncate block">
                    {body.gravityFactor}g • {body.moonsCount} 🌙
                  </span>
                </div>
              </div>

              {/* Brief Description Snippet */}
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed mt-2 line-clamp-2">
                {body.arabicDescription}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 space-x-reverse mt-3 pt-2 border-t border-white/[0.06]">
                <button
                  onClick={() => onSelectBodyFor3D(body)}
                  className="flex-1 py-1.5 px-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 space-x-reverse shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all active:scale-95"
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span>تحليق ثلاثي الأبعاد 3D</span>
                </button>

                <button
                  onClick={() => onOpenDetailedModal(body)}
                  className="py-1.5 px-2.5 bg-slate-800/80 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/60 font-mono text-xs rounded-lg flex items-center justify-center transition-all"
                  title="عرض الموسوعة العلمية والمهمات الفضائية"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredBodies.length === 0 && (
          <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800">
            <Orbit className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-sans">
              لم يتم العثور على أجرام سماوية تطابق بحثك "{searchQuery}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

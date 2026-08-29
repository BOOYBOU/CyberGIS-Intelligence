import React, { useState } from 'react';
import {
  X,
  Rocket,
  Orbit,
  Thermometer,
  Compass,
  Atom,
  Clock,
  Radio,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  Globe2
} from 'lucide-react';
import { CelestialBodyData, calculateWeightOnBody } from '../services/solarSystemService';

interface SolarSystemModalProps {
  body: CelestialBodyData | null;
  isOpen: boolean;
  onClose: () => void;
  onFlyToIn3D: (body: CelestialBodyData) => void;
}

export const SolarSystemModal: React.FC<SolarSystemModalProps> = ({
  body,
  isOpen,
  onClose,
  onFlyToIn3D
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'atmosphere' | 'missions' | 'facts'>('overview');
  const [testWeight, setTestWeight] = useState<number>(70);

  if (!isOpen || !body) return null;

  const weightOnPlanet = calculateWeightOnBody(testWeight, body.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      dir="rtl"
    >
      <div
        className="w-full max-w-3xl bg-[#030712]/95 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col max-h-[90vh] text-slate-100 font-sans"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] relative overflow-hidden bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-blue-950/40 flex items-center justify-between">
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: body.color }}
          />

          <div className="flex items-center space-x-3.5 space-x-reverse relative z-10">
            {/* 3D Orb Avatar */}
            <div
              className="w-12 h-12 rounded-full border-2 flex items-center justify-center relative shadow-lg overflow-hidden shrink-0"
              style={{
                borderColor: body.color,
                backgroundColor: `${body.color}22`,
                boxShadow: `0 0 20px ${body.color}66`
              }}
            >
              <div
                className="w-7 h-7 rounded-full"
                style={{
                  backgroundColor: body.color,
                  boxShadow: `0 0 14px ${body.glowColor}`
                }}
              />
            </div>

            <div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <h3 className="text-xl font-black text-white tracking-tight font-sans">
                  {body.arabicName}
                </h3>
                <span className="text-slate-400 font-mono text-sm">
                  ({body.name})
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                  {body.categoryLabelAr}
                </span>
              </div>
              <p className="text-xs text-cyan-300/90 font-sans mt-0.5">
                {body.arabicSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse relative z-10">
            <button
              onClick={() => {
                onFlyToIn3D(body);
                onClose();
              }}
              className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono font-bold text-xs rounded-xl flex items-center space-x-1.5 space-x-reverse shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all active:scale-95"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>تحليق فوري 3D</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900/80 border border-white/[0.1] text-slate-400 hover:text-white hover:border-slate-700 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 border-b border-white/[0.08] bg-slate-950/60 text-xs font-mono">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2.5 px-3 font-bold transition-all text-center border-b-2 flex items-center justify-center space-x-1.5 space-x-reverse ${
              activeTab === 'overview'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30 shadow-[inset_0_-2px_8px_rgba(6,182,212,0.3)]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>نظرة عامة وفيزياء</span>
          </button>
          <button
            onClick={() => setActiveTab('atmosphere')}
            className={`py-2.5 px-3 font-bold transition-all text-center border-b-2 flex items-center justify-center space-x-1.5 space-x-reverse ${
              activeTab === 'atmosphere'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30 shadow-[inset_0_-2px_8px_rgba(6,182,212,0.3)]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>الغلاف والغازات</span>
          </button>
          <button
            onClick={() => setActiveTab('missions')}
            className={`py-2.5 px-3 font-bold transition-all text-center border-b-2 flex items-center justify-center space-x-1.5 space-x-reverse ${
              activeTab === 'missions'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30 shadow-[inset_0_-2px_8px_rgba(6,182,212,0.3)]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>الأقمار والمهمات</span>
          </button>
          <button
            onClick={() => setActiveTab('facts')}
            className={`py-2.5 px-3 font-bold transition-all text-center border-b-2 flex items-center justify-center space-x-1.5 space-x-reverse ${
              activeTab === 'facts'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30 shadow-[inset_0_-2px_8px_rgba(6,182,212,0.3)]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>حقائق وظواهر</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar text-sm">
          {/* Tab 1: Overview & Physics */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.08] leading-relaxed text-slate-200">
                <p className="font-sans">{body.arabicDescription}</p>
                <p className="font-sans text-xs text-slate-400 mt-2 italic">{body.description}</p>
              </div>

              {/* High-Tech Telemetry Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-white/[0.08]">
                  <span className="text-slate-400 text-[11px] block">القطر الكوكبي</span>
                  <span className="text-white font-extrabold text-sm block mt-1">{body.diameter}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-white/[0.08]">
                  <span className="text-slate-400 text-[11px] block">المسافة من الشمس</span>
                  <span className="text-cyan-300 font-extrabold text-sm block mt-1">{body.distanceAU} AU</span>
                  <span className="text-[10px] text-slate-500 block truncate">{body.distanceFromSun.split('(')[0]}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-white/[0.08]">
                  <span className="text-slate-400 text-[11px] block">السنة المدارية</span>
                  <span className="text-amber-300 font-extrabold text-sm block mt-1">{body.orbitalPeriod.split('(')[0]}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-white/[0.08]">
                  <span className="text-slate-400 text-[11px] block">طول اليوم (الدوران)</span>
                  <span className="text-emerald-300 font-extrabold text-sm block mt-1">{body.dayLength.split('(')[0]}</span>
                </div>
              </div>

              {/* Gravity & Velocity Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-white/[0.08]">
                  <span className="text-slate-400 text-[11px] block">السرعة المدارية</span>
                  <span className="text-cyan-300 font-bold text-sm mt-1 block">{body.orbitalVelocityKmS}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-white/[0.08]">
                  <span className="text-slate-400 text-[11px] block">درجة الحرارة</span>
                  <span className="text-rose-400 font-bold text-xs mt-1 block">{body.temperature}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-white/[0.08]">
                  <span className="text-slate-400 text-[11px] block">الجاذبية السطحية</span>
                  <span className="text-amber-400 font-bold text-sm mt-1 block">{body.gravity}</span>
                </div>
              </div>

              {/* Interactive Gravity Calculation Bar */}
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between font-mono text-xs">
                <div className="flex items-center space-x-2 space-x-reverse text-amber-300">
                  <Atom className="w-4 h-4 text-amber-400" />
                  <span>وزنك على سطحه:</span>
                  <input
                    type="number"
                    value={testWeight}
                    onChange={e => setTestWeight(Number(e.target.value) || 0)}
                    className="w-16 bg-slate-900 border border-amber-500/50 rounded px-2 py-0.5 text-amber-300 font-bold text-center focus:outline-none"
                  />
                  <span className="text-slate-400">كغ على الأرض</span>
                </div>
                <div className="text-base font-extrabold text-amber-400">
                  = {weightOnPlanet} كغ ({body.gravityFactor}g)
                </div>
              </div>

              {/* Surface Features Chips */}
              {body.surfaceFeatures && body.surfaceFeatures.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-mono font-bold text-slate-400">أبرز المعالم والتضاريس السطحية:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {body.surfaceFeatures.map((feat, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-slate-800/70 border border-white/[0.08] text-xs font-mono text-slate-300"
                      >
                        🌋 {feat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Atmosphere & Chemical Breakdown */}
          {activeTab === 'atmosphere' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.08] font-mono text-xs text-slate-300">
                <span className="text-cyan-300 font-bold block mb-1">وصف الغلاف الجوي:</span>
                <p className="font-sans text-sm">{body.atmosphere}</p>
              </div>

              {/* Gas Breakdown Percentage Bars */}
              {body.atmosphericComposition && body.atmosphericComposition.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold text-slate-300">النسب المئوية للغازات والمركبات:</h4>
                  {body.atmosphericComposition.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-200">
                          {item.arabicGas} <span className="text-slate-500">({item.gas})</span>
                        </span>
                        <span className="font-bold text-cyan-300">{item.percentage}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-white/[0.06]">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(item.percentage, 100)}%`,
                            backgroundColor: item.color
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center bg-slate-900/40 rounded-xl border border-slate-800 text-slate-400 font-sans text-xs">
                  لا يمتلك هذا الجرم غلافاً جوياً كثيفاً ومستقراً (فراغ شبه كلي أو غلاف إكسوسفير رقيق).
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Moons & Notable Missions */}
          {activeTab === 'missions' && (
            <div className="space-y-4">
              {/* Notable Moons List */}
              {body.notableMoons && body.notableMoons.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-bold text-slate-300">
                    أشهر الأقمار الطبيعية التابعة ({body.moonsCount} قمر إجمالي):
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-sans text-xs">
                    {body.notableMoons.map((m, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-900/70 border border-white/[0.08] space-y-1">
                        <div className="flex items-center justify-between font-mono">
                          <span className="font-bold text-white">🌙 {m.arabicName} ({m.name})</span>
                          <span className="text-[11px] text-cyan-300">{m.diameterKm}</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">{m.keyFact}</p>
                        <span className="text-[10px] text-slate-500 font-mono block">اكتُشف عام: {m.discoveryYear}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Space Missions History */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold text-slate-300">
                  أبرز رحلات ومهمات الاستكشاف الفضائية:
                </h4>
                <div className="space-y-2 font-mono text-xs">
                  {body.spaceMissions.map((mis, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-white/[0.08] flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <span className="font-bold text-cyan-300">🛰️ {mis.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                            {mis.agency}
                          </span>
                          <span className="text-slate-500 text-[11px]">{mis.year}</span>
                        </div>
                        <p className="text-slate-300 font-sans text-xs mt-1">{mis.result}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Facts & Scientific Discoveries */}
          {activeTab === 'facts' && (
            <div className="space-y-3 font-sans text-xs">
              <h4 className="font-mono font-bold text-slate-300">حقائق علمية وظواهر مذهلة:</h4>
              <div className="space-y-2">
                {body.arabicFacts.map((fact, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-900/70 border border-white/[0.08] flex items-start space-x-2.5 space-x-reverse text-slate-200"
                  >
                    <span className="text-cyan-400 font-mono font-bold shrink-0 mt-0.5">#{idx + 1}</span>
                    <p className="leading-relaxed">{fact}</p>
                  </div>
                ))}
              </div>

              {body.facts && (
                <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-1.5">
                  <span className="text-[11px] font-mono text-slate-400 block">International Astronomical Records:</span>
                  {body.facts.map((f, i) => (
                    <p key={i} className="text-slate-400 text-xs italic font-sans">• {f}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-white/[0.08] bg-slate-950/90 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-2 space-x-reverse text-slate-400">
            <Orbit className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '18s' }} />
            <span>NASA Planetary Factsheet & ESA Astronomical Database</span>
          </div>

          <button
            onClick={() => {
              onFlyToIn3D(body);
              onClose();
            }}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl flex items-center space-x-2 space-x-reverse shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all active:scale-95"
          >
            <Rocket className="w-4 h-4" />
            <span>تحليق فوري نحو الكوكب في الفضاء 3D</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { VideoItem, GlobalMapTheme, TimelineFilter } from '../types';
import {
  RotateCw,
  Play,
  Sparkles,
  Layers,
  Globe as GlobeIcon,
  Crosshair,
  Satellite as SatelliteIcon,
  Orbit,
  Radio,
  Eye,
  EyeOff,
  Sun as SunIcon,
  Flame,
  Compass,
  Info,
  X,
  ChevronRight,
  ChevronLeft,
  Navigation,
  Telescope,
  Maximize2,
  Plus,
  Minus,
  Search,
  Rocket,
  Zap,
  Loader2
} from 'lucide-react';
import { CelestialBodyData, SOLAR_SYSTEM_DATA as SOLAR_SYSTEM_BODIES } from '../services/solarSystemService';

export type { CelestialBodyData };
export { SOLAR_SYSTEM_BODIES };

export interface OrbitalPresetTarget {
  name: string;
  arabic: string;
  country: string;
  lat: number;
  lng: number;
  flag: string;
}

export const ORBITAL_QUICK_TARGETS: OrbitalPresetTarget[] = [
  { name: 'Agadir', arabic: 'أكادير', country: 'Morocco', lat: 30.4278, lng: -9.5981, flag: '🇲🇦' },
  { name: 'Casablanca', arabic: 'الدار البيضاء', country: 'Morocco', lat: 33.5731, lng: -7.5898, flag: '🇲🇦' },
  { name: 'Marrakech', arabic: 'مراكش', country: 'Morocco', lat: 31.6295, lng: -7.9811, flag: '🇲🇦' },
  { name: 'Tangier', arabic: 'طنجة', country: 'Morocco', lat: 35.7595, lng: -5.8340, flag: '🇲🇦' },
  { name: 'Rabat', arabic: 'الرباط', country: 'Morocco', lat: 34.0209, lng: -6.8416, flag: '🇲🇦' },
  { name: 'Fes', arabic: 'فاس', country: 'Morocco', lat: 34.0181, lng: -5.0078, flag: '🇲🇦' },
  { name: 'Dubai', arabic: 'دبي', country: 'UAE', lat: 25.2048, lng: 55.2708, flag: '🇦🇪' },
  { name: 'Mecca', arabic: 'مكة المكرمة', country: 'Saudi Arabia', lat: 21.4225, lng: 39.8262, flag: '🇸🇦' },
  { name: 'Cairo', arabic: 'القاهرة', country: 'Egypt', lat: 30.0444, lng: 31.2357, flag: '🇪🇬' },
  { name: 'Paris', arabic: 'باريس', country: 'France', lat: 48.8566, lng: 2.3522, flag: '🇫🇷' },
  { name: 'Tokyo', arabic: 'طوكيو', country: 'Japan', lat: 35.6762, lng: 139.6503, flag: '🇯🇵' },
  { name: 'New York', arabic: 'نيويورك', country: 'USA', lat: 40.7128, lng: -74.0060, flag: '🇺🇸' },
  { name: 'Istanbul', arabic: 'إسطنبول', country: 'Turkey', lat: 41.0082, lng: 28.9784, flag: '🇹🇷' }
];

interface Globe3DViewProps {
  lat: number;
  lng: number;
  radiusKm: number;
  targetName: string;
  videos: VideoItem[];
  currentTheme: GlobalMapTheme;
  timeline: TimelineFilter;
  isActive?: boolean;
  focusedCelestialBodyId?: string | null;
  onSelectVideo: (video: VideoItem) => void;
  onLocationChange: (lat: number, lng: number, name?: string) => void;
  onTransitionTo2D: (targetLat?: number, targetLng?: number, targetZoom?: number) => void;
  onFocusBodyChange?: (body: CelestialBodyData | null) => void;
}

// Convert Geo coordinates (lat, lng) to 3D Cartesian coordinates on sphere of radius R
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Convert 3D Point on Sphere back to Geo coordinates (lat, lng)
function vector3ToLatLng(vector: THREE.Vector3, radius: number): { lat: number; lng: number } {
  const norm = vector.clone().normalize();
  const lat = 90 - (Math.acos(norm.y) * 180) / Math.PI;
  let lng = ((Math.atan2(norm.z, -norm.x) * 180) / Math.PI) - 180;
  lng = (((lng + 180) % 360 + 360) % 360) - 180;
  return {
    lat: Number(lat.toFixed(4)),
    lng: Number(lng.toFixed(4))
  };
}

// ---------------------------------------------------------------------------
// 1. PROCEDURAL HIGH-RESOLUTION TEXTURE GENERATORS (NASA BLUE MARBLE PALETTES)
// ---------------------------------------------------------------------------

function createPhotorealisticEarthCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 4096;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // 1. Deep Ocean Bathymetric Gradient (NASA Blue Marble Ocean Radiance)
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  oceanGrad.addColorStop(0, '#020813'); // Arctic Abyss
  oceanGrad.addColorStop(0.2, '#06162a'); // North Atlantic
  oceanGrad.addColorStop(0.5, '#041324'); // Equatorial Trench
  oceanGrad.addColorStop(0.8, '#051528'); // Southern Ocean
  oceanGrad.addColorStop(1, '#020710'); // Antarctic Deep
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Continental Shelf / Shallow Turquoise Coral Waters
  const drawShelf = (coords: [number, number][], fill: string) => {
    ctx.beginPath();
    coords.forEach(([lng, lat], i) => {
      const x = ((lng + 180) / 360) * canvas.width;
      const y = ((90 - lat) / 180) * canvas.height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.filter = 'blur(12px)';
    ctx.fill();
    ctx.filter = 'none';
  };

  drawShelf([[-90, 30], [-75, 30], [-60, 15], [-80, 8], [-95, 18]], '#0e4e6c'); // Caribbean & Gulf of Mexico
  drawShelf([[100, 15], [125, 20], [125, -10], [98, -10]], '#0c445e'); // Sunda Shelf & Indonesia
  drawShelf([[140, -10], [155, -18], [152, -28], [138, -20]], '#0d5070'); // Great Barrier Reef
  drawShelf([[-10, 62], [10, 60], [10, 50], [-8, 48]], '#0e415c'); // North Sea & Baltic
  drawShelf([[-72, -35], [-55, -40], [-60, -56], [-72, -52]], '#093148'); // Patagonian Shelf

  // 3. Accurate Landmass Geometry with NASA Biome Colors
  const drawLandmass = (coords: [number, number][], fill: string, stroke?: string) => {
    ctx.beginPath();
    coords.forEach(([lng, lat], i) => {
      const x = ((lng + 180) / 360) * canvas.width;
      const y = ((90 - lat) / 180) * canvas.height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  };

  // Africa (Sahara golden sand, Sahel semi-arid, Congo dense rainforest, Kalahari)
  drawLandmass([
    [-17, 33], [-10, 36], [-5, 36], [10, 37], [25, 32], [32, 31], [35, 28], [35, 20],
    [45, 12], [51, 12], [42, 0], [40, -5], [35, -20], [28, -34], [18, -34], [12, -15],
    [9, 4], [0, 6], [-15, 12], [-17, 21], [-17, 33]
  ], '#7d6840', 'rgba(165, 145, 95, 0.4)');

  // Congo & Central African Rainforest
  drawLandmass([
    [9, 4], [28, 4], [31, 0], [30, -11], [18, -12], [10, -5], [9, 4]
  ], '#1f3e17');

  // Europe (Temperate forests, Mediterranean coast, Scandinavia)
  drawLandmass([
    [-9, 36], [-9, 43], [-1, 44], [-5, 48], [2, 51], [8, 55], [18, 55], [28, 60],
    [32, 70], [24, 71], [15, 68], [8, 58], [4, 52], [0, 49], [-4, 44], [-9, 36]
  ], '#2e4922', 'rgba(110, 150, 80, 0.35)');

  // Arabian Peninsula (Rub' al Khali golden dunes)
  drawLandmass([
    [35, 30], [55, 28], [60, 22], [55, 15], [45, 12], [35, 20], [35, 30]
  ], '#987e49');

  // Eurasia (Siberian Taiga, Steppes, Tibetan Plateau, East Asian Vegetation)
  drawLandmass([
    [35, 32], [50, 42], [65, 45], [80, 50], [100, 55], [125, 60], [140, 70], [175, 65],
    [160, 55], [140, 45], [130, 30], [120, 22], [105, 10], [98, 18], [80, 10],
    [70, 22], [55, 25], [35, 32]
  ], '#364c28', 'rgba(120, 160, 85, 0.35)');

  // Gobi & Taklamakan Deserts
  drawLandmass([
    [80, 44], [108, 43], [104, 37], [78, 38]
  ], '#8a7548');

  // Himalayan Range Glaciers & Snow Caps
  ctx.strokeStyle = 'rgba(248, 252, 255, 0.95)';
  ctx.lineWidth = 6.0;
  ctx.beginPath();
  const himStart = [((74 + 180) / 360) * canvas.width, ((90 - 32) / 180) * canvas.height];
  const himEnd = [((96 + 180) / 360) * canvas.width, ((90 - 27) / 180) * canvas.height];
  ctx.moveTo(himStart[0], himStart[1]);
  ctx.lineTo(himEnd[0], himEnd[1]);
  ctx.stroke();

  // North America (Boreal forests, Great Plains, Mexican Deserts)
  drawLandmass([
    [-165, 65], [-140, 70], [-100, 70], [-60, 60], [-65, 45], [-75, 35], [-80, 25],
    [-90, 30], [-97, 20], [-105, 18], [-115, 32], [-124, 48], [-140, 60], [-165, 65]
  ], '#314724', 'rgba(115, 148, 78, 0.4)');

  // American Southwest Desert
  drawLandmass([
    [-118, 36], [-105, 35], [-102, 26], [-114, 28]
  ], '#876e42');

  // Greenland Ice Sheet
  drawLandmass([
    [-55, 60], [-35, 65], [-20, 75], [-40, 83], [-55, 78], [-55, 60]
  ], '#eff5fb');

  // South America (Amazon Basin, Andes Mountains, Pampas)
  drawLandmass([
    [-77, 8], [-60, 10], [-45, -2], [-35, -5], [-40, -22], [-50, -35], [-65, -55],
    [-75, -50], [-72, -35], [-80, -10], [-80, 2], [-77, 8]
  ], '#1d3916', 'rgba(90, 145, 70, 0.4)');

  // Andes Mountain Snowline
  ctx.strokeStyle = 'rgba(238, 246, 255, 0.85)';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  const andesStart = [((-77 + 180) / 360) * canvas.width, ((90 - 5) / 180) * canvas.height];
  const andesEnd = [((-68 + 180) / 360) * canvas.width, ((90 - (-50)) / 180) * canvas.height];
  ctx.moveTo(andesStart[0], andesStart[1]);
  ctx.lineTo(andesEnd[0], andesEnd[1]);
  ctx.stroke();

  // Australia (Outback Red Sandstone & Coastal Greenery)
  drawLandmass([
    [115, -22], [130, -12], [142, -10], [150, -22], [152, -33], [140, -38], [115, -34], [113, -25]
  ], '#8a4b22', 'rgba(165, 105, 55, 0.4)');

  // Antarctica Continental Glacier
  drawLandmass([
    [-180, -65], [180, -65], [180, -90], [-180, -90]
  ], '#e8f2f9');

  return canvas;
}

// Procedural City Night Lights Texture for Night-side Terminator
function createEarthNightLightsCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const drawCityGlow = (lng: number, lat: number, intensity: number, spread: number) => {
    const x = ((lng + 180) / 360) * canvas.width;
    const y = ((90 - lat) / 180) * canvas.height;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, spread);
    grad.addColorStop(0, `rgba(255, 235, 175, ${intensity})`);
    grad.addColorStop(0.35, `rgba(255, 195, 95, ${intensity * 0.7})`);
    grad.addColorStop(0.7, `rgba(240, 135, 35, ${intensity * 0.25})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, spread, 0, Math.PI * 2);
    ctx.fill();
  };

  // Megalopolises & Dense Urban Belts
  const megalopolises: [number, number, number, number][] = [
    [-74, 40.7, 1.0, 18], // New York / BosWash
    [-87.6, 41.8, 0.9, 14], // Chicago
    [-118.2, 34, 0.95, 16], // Los Angeles
    [-0.1, 51.5, 1.0, 18], // London
    [2.3, 48.8, 0.95, 16], // Paris
    [13.4, 52.5, 0.9, 12], // Berlin
    [139.7, 35.6, 1.0, 22], // Greater Tokyo
    [121.5, 31.2, 1.0, 20], // Shanghai
    [116.4, 39.9, 1.0, 20], // Beijing
    [126.9, 37.5, 0.95, 16], // Seoul
    [114.1, 22.3, 1.0, 18], // Hong Kong / Pearl River Delta
    [103.8, 1.3, 0.9, 12], // Singapore
    [72.8, 19.0, 0.95, 18], // Mumbai
    [77.2, 28.6, 0.95, 18], // Delhi
    [55.2, 25.2, 0.95, 14], // Dubai
    [-46.6, -23.5, 0.9, 16], // Sao Paulo
    [-58.4, -34.6, 0.85, 14], // Buenos Aires
    [151.2, -33.8, 0.85, 12], // Sydney
    [31.2, 30.0, 0.9, 14], // Cairo
    [28.0, -26.2, 0.85, 12] // Johannesburg
  ];

  megalopolises.forEach(([lng, lat, intensity, spread]) => {
    drawCityGlow(lng, lat, intensity, spread);
  });

  for (let i = 0; i < 600; i++) {
    const lat = 10 + Math.random() * 55;
    const lng = Math.random() * 360 - 180;
    drawCityGlow(lng, lat, 0.4 + Math.random() * 0.5, 3 + Math.random() * 7);
  }

  return canvas;
}

// Procedural Atmospheric Clouds Texture
function createAtmosphericCloudsCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const drawCloudSwirl = (cx: number, cy: number, radius: number, density: number) => {
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, `rgba(255, 255, 255, ${density})`);
    grad.addColorStop(0.4, `rgba(250, 252, 255, ${density * 0.7})`);
    grad.addColorStop(0.8, `rgba(240, 245, 255, ${density * 0.25})`);
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  };

  // Intertropical Convergence Zone (ITCZ)
  for (let x = 0; x < canvas.width; x += 30) {
    const y = canvas.height * 0.48 + Math.sin(x * 0.02) * 25 + (Math.random() * 20 - 10);
    drawCloudSwirl(x, y, 45 + Math.random() * 35, 0.75);
  }

  // Cyclones & Storm Fronts
  const stormCenters = [
    [canvas.width * 0.18, canvas.height * 0.28, 140],
    [canvas.width * 0.42, canvas.height * 0.24, 160],
    [canvas.width * 0.75, canvas.height * 0.26, 130],
    [canvas.width * 0.28, canvas.height * 0.72, 150],
    [canvas.width * 0.62, canvas.height * 0.75, 170],
    [canvas.width * 0.88, canvas.height * 0.70, 160]
  ];

  stormCenters.forEach(([cx, cy, r]) => {
    drawCloudSwirl(cx, cy, r, 0.85);
    for (let a = 0; a < 6; a++) {
      const angle = (a / 6) * Math.PI * 2;
      const armX = cx + Math.cos(angle) * (r * 0.8);
      const armY = cy + Math.sin(angle) * (r * 0.5);
      drawCloudSwirl(armX, armY, r * 0.5, 0.6);
    }
  });

  for (let i = 0; i < 400; i++) {
    const px = Math.random() * canvas.width;
    const py = (0.06 + Math.random() * 0.88) * canvas.height;
    drawCloudSwirl(px, py, 18 + Math.random() * 40, 0.45);
  }

  return canvas;
}

// Procedural Specular Mask (1.0 for Water, 0.0 for Land)
function createSpecularMaskCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Oceans are 100% white (high specularity)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Landmasses are pure black (matte / no specularity)
  ctx.fillStyle = '#000000';
  const drawLand = (coords: [number, number][]) => {
    ctx.beginPath();
    coords.forEach(([lng, lat], i) => {
      const x = ((lng + 180) / 360) * canvas.width;
      const y = ((90 - lat) / 180) * canvas.height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
  };

  // Africa
  drawLand([[-17, 33], [35, 30], [51, 12], [35, -20], [18, -34], [-17, 21]]);
  // Eurasia
  drawLand([[35, 32], [140, 70], [175, 65], [120, 22], [80, 10], [35, 32]]);
  // Americas
  drawLand([[-165, 65], [-60, 60], [-80, 25], [-124, 48]]);
  drawLand([[-77, 8], [-35, -5], [-65, -55], [-80, 2]]);
  // Australia
  drawLand([[115, -22], [150, -22], [140, -38], [115, -34]]);
  // Antarctica
  drawLand([[-180, -65], [180, -65], [180, -90], [-180, -90]]);

  return canvas;
}

// ---------------------------------------------------------------------------
// 2. PRISTINE DEEP SPACE SKYSPHERE & NEBULAE GENERATOR (NO GLITCHES / NO NOISE)
// ---------------------------------------------------------------------------

function createPristineDeepSpacePanorama(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 4096;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Pure pristine cosmic blackness
  ctx.fillStyle = '#000002';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 1. Faint, organic Milky Way Galactic Core (Soft cosmic glow, no harsh rectangular bands)
  ctx.save();
  ctx.translate(canvas.width * 0.5, canvas.height * 0.5);
  ctx.rotate(-0.25);

  // Galactic Bulge (Sagittarius A* Core)
  const coreGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 550);
  coreGrad.addColorStop(0, 'rgba(255, 240, 215, 0.18)');
  coreGrad.addColorStop(0.35, 'rgba(180, 195, 230, 0.08)');
  coreGrad.addColorStop(0.7, 'rgba(70, 90, 150, 0.03)');
  coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, 800, 220, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // 2. Distant Deep Space Nebulae & Galaxies (Orion, Carina, Andromeda M31)
  const drawNebula = (cx: number, cy: number, radius: number, r: number, g: number, b: number, maxAlpha: number) => {
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${maxAlpha})`);
    grad.addColorStop(0.4, `rgba(${Math.round(r * 0.7)}, ${Math.round(g * 0.6)}, ${Math.round(b * 0.9)}, ${maxAlpha * 0.4})`);
    grad.addColorStop(0.8, `rgba(${Math.round(r * 0.3)}, ${Math.round(g * 0.2)}, ${Math.round(b * 0.6)}, ${maxAlpha * 0.1})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  };

  // Subtle Distant Nebulae
  drawNebula(canvas.width * 0.72, canvas.height * 0.65, 260, 210, 80, 130, 0.08);
  drawNebula(canvas.width * 0.28, canvas.height * 0.38, 220, 70, 140, 200, 0.07);

  // Andromeda Galaxy (M31 - Spiral Disk with Glowing Nucleus)
  ctx.save();
  ctx.translate(canvas.width * 0.82, canvas.height * 0.28);
  ctx.rotate(0.65);
  const m31Core = ctx.createRadialGradient(0, 0, 2, 0, 0, 90);
  m31Core.addColorStop(0, 'rgba(255, 248, 230, 0.40)');
  m31Core.addColorStop(0.35, 'rgba(210, 225, 255, 0.16)');
  m31Core.addColorStop(0.75, 'rgba(120, 150, 220, 0.04)');
  m31Core.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = m31Core;
  ctx.beginPath();
  ctx.ellipse(0, 0, 140, 40, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  return canvas;
}

// ---------------------------------------------------------------------------
// 3. PLANETARY TEXTURE GENERATORS (FULL SOLAR SYSTEM)
// ---------------------------------------------------------------------------

// Procedural Mercury Texture (Rocky Basaltic Crust, Caloris Basin, Impact Craters)
function createMercuryTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Muted brownish-gray silicate surface
  ctx.fillStyle = '#6e6962';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Volcanic Plains & Mare-like Basins (Caloris Basin)
  const drawBasin = (cx: number, cy: number, rx: number, ry: number) => {
    const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, rx);
    grad.addColorStop(0, '#4a4640');
    grad.addColorStop(0.7, '#5c5750');
    grad.addColorStop(1, '#6e6962');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0.2, 0, Math.PI * 2);
    ctx.fill();
  };

  drawBasin(380, 240, 130, 90); // Caloris Basin
  drawBasin(720, 200, 95, 65);  // Rembrandt Basin
  drawBasin(200, 340, 80, 55);

  // Heavy Impact Crater Bombardment & Bright Ejecta Rays
  for (let c = 0; c < 120; c++) {
    const cx = Math.random() * canvas.width;
    const cy = Math.random() * canvas.height;
    const cr = 2 + Math.random() * 14;

    ctx.fillStyle = '#3a3732';
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fill();

    // Crater Rim
    ctx.strokeStyle = 'rgba(215, 210, 200, 0.7)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(cx, cy, cr * 1.12, 0, Math.PI * 2);
    ctx.stroke();

    // Bright Ray Systems on major craters
    if (cr > 8) {
      ctx.strokeStyle = 'rgba(235, 230, 220, 0.25)';
      ctx.lineWidth = 0.8;
      for (let r = 0; r < 8; r++) {
        const angle = (r / 8) * Math.PI * 2;
        const len = cr * 4 + Math.random() * 25;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
        ctx.stroke();
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

// Procedural Venus Texture (Dense Golden Sulfuric Acid Atmosphere & Swirling Clouds)
function createVenusTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Golden-amber base sulfuric cloud deck
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#c79d5e');
  grad.addColorStop(0.25, '#dfb97a');
  grad.addColorStop(0.5, '#eecf92');
  grad.addColorStop(0.75, '#deb775');
  grad.addColorStop(1, '#b58b4c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Planetary Y-shaped and V-shaped Atmospheric Waves
  ctx.fillStyle = 'rgba(255, 245, 215, 0.28)';
  for (let i = 0; i < 18; i++) {
    const y = 80 + i * 20;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(
      canvas.width * 0.25, y - 25,
      canvas.width * 0.75, y + 25,
      canvas.width, y
    );
    ctx.lineTo(canvas.width, y + 12);
    ctx.bezierCurveTo(
      canvas.width * 0.75, y + 37,
      canvas.width * 0.25, y - 13,
      0, y + 12
    );
    ctx.closePath();
    ctx.fill();
  }

  // Polar Atmospheric Vortices (Double-eyed storm structure)
  const drawVortex = (cx: number, cy: number, r: number) => {
    const vGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
    vGrad.addColorStop(0, '#8e6331');
    vGrad.addColorStop(0.6, '#b7894d');
    vGrad.addColorStop(1, 'rgba(223, 185, 122, 0)');
    ctx.fillStyle = vGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  };

  drawVortex(canvas.width * 0.5, 40, 38);
  drawVortex(canvas.width * 0.5, canvas.height - 40, 38);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

// Procedural Mars Texture (Red Planet / Iron Oxide Crust / Polar Caps)
function createMarsTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Reddish-orange base terrain
  ctx.fillStyle = '#b65128';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Darker Volcanic Basaltic Plateaus (Syrtis Major, Acidalia Planitia, Sinus Sabaeus)
  const drawDarkRegion = (cx: number, cy: number, rx: number, ry: number) => {
    const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, rx);
    grad.addColorStop(0, '#5f2312');
    grad.addColorStop(0.7, '#82371c');
    grad.addColorStop(1, '#b65128');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, Math.random() * 0.2, 0, Math.PI * 2);
    ctx.fill();
  };

  drawDarkRegion(450, 250, 120, 80); // Syrtis Major
  drawDarkRegion(280, 180, 140, 70); // Acidalia Planitia
  drawDarkRegion(750, 310, 160, 85); // Southern Highlands
  drawDarkRegion(150, 330, 90, 60);

  // Valles Marineris Great Canyon System
  ctx.strokeStyle = '#43170a';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(310, 290);
  ctx.bezierCurveTo(420, 315, 540, 280, 620, 305);
  ctx.stroke();

  // Olympus Mons Shield Volcano
  const omGrad = ctx.createRadialGradient(220, 240, 2, 220, 240, 32);
  omGrad.addColorStop(0, '#e89064');
  omGrad.addColorStop(0.6, '#933d1e');
  omGrad.addColorStop(1, '#b65128');
  ctx.fillStyle = omGrad;
  ctx.beginPath();
  ctx.arc(220, 240, 32, 0, Math.PI * 2);
  ctx.fill();

  // North & South Polar Ice Caps (CO2 & Water Ice)
  ctx.fillStyle = '#f5fbff';
  ctx.beginPath();
  ctx.arc(canvas.width * 0.5, 0, 70, 0, Math.PI);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(canvas.width * 0.5, canvas.height, 50, Math.PI, 0);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

// Procedural Jupiter Texture (Atmospheric Cloud Belts & Great Red Spot)
function createJupiterTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Jovian Cloud Banding
  const bands = [
    { y1: 0, y2: 0.12, color: '#886b51' }, // Polar
    { y1: 0.12, y2: 0.22, color: '#cbb69d' }, // N. Temperate Zone
    { y1: 0.22, y2: 0.35, color: '#975e3c' }, // N. Equatorial Belt
    { y1: 0.35, y2: 0.48, color: '#e5d7c3' }, // Equatorial Zone
    { y1: 0.48, y2: 0.62, color: '#904e2e' }, // S. Equatorial Belt
    { y1: 0.62, y2: 0.75, color: '#c4ab8e' }, // S. Temperate Zone
    { y1: 0.75, y2: 0.88, color: '#7a523a' }, // S. Temperate Belt
    { y1: 0.88, y2: 1.0, color: '#684d3b' }  // S. Polar
  ];

  bands.forEach(b => {
    ctx.fillStyle = b.color;
    ctx.fillRect(0, b.y1 * canvas.height, canvas.width, (b.y2 - b.y1) * canvas.height);
  });

  // Atmospheric Turbulent Waves
  for (let x = 0; x < canvas.width; x += 10) {
    const y = canvas.height * 0.52 + Math.sin(x * 0.05) * 8;
    ctx.fillStyle = 'rgba(235, 215, 185, 0.4)';
    ctx.fillRect(x, y, 10, 6);
  }

  // The Great Red Spot (Anticyclonic Storm)
  const grsX = canvas.width * 0.68;
  const grsY = canvas.height * 0.56;
  const grsGrad = ctx.createRadialGradient(grsX, grsY, 2, grsX, grsY, 38);
  grsGrad.addColorStop(0, '#c3411e');
  grsGrad.addColorStop(0.6, '#b03314');
  grsGrad.addColorStop(0.9, '#822710');
  grsGrad.addColorStop(1, 'rgba(144, 78, 46, 0)');
  ctx.fillStyle = grsGrad;
  ctx.beginPath();
  ctx.ellipse(grsX, grsY, 44, 26, 0.1, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

// Procedural Saturn Texture (Golden Cream Atmospheric Bands)
function createSaturnTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#7d745e');
  grad.addColorStop(0.2, '#c4b693');
  grad.addColorStop(0.4, '#e1d2ac');
  grad.addColorStop(0.5, '#e8dbc0');
  grad.addColorStop(0.6, '#d8c69d');
  grad.addColorStop(0.8, '#a69674');
  grad.addColorStop(1, '#665d49');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

// Procedural Saturn Concentric Rings Texture (Cassini Division, Ring A, Ring B, Ring C)
function createSaturnRingsTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  grad.addColorStop(0, 'rgba(0,0,0,0)'); // Inner transparent
  grad.addColorStop(0.12, 'rgba(145, 130, 100, 0.35)'); // Ring C (Crepe)
  grad.addColorStop(0.28, 'rgba(215, 195, 155, 0.85)'); // Ring B (Bright dense)
  grad.addColorStop(0.58, 'rgba(240, 220, 175, 0.95)');
  grad.addColorStop(0.62, 'rgba(10, 10, 15, 0.05)'); // Cassini Division Gap
  grad.addColorStop(0.68, 'rgba(180, 160, 125, 0.75)'); // Ring A
  grad.addColorStop(0.88, 'rgba(160, 145, 115, 0.65)');
  grad.addColorStop(0.92, 'rgba(20, 20, 20, 0.05)'); // Encke Gap
  grad.addColorStop(0.96, 'rgba(120, 105, 85, 0.35)');
  grad.addColorStop(1, 'rgba(0,0,0,0)'); // Outer boundary

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  return new THREE.CanvasTexture(canvas);
}

// Procedural Uranus Texture (Pale Aquamarine / Cyan Ice Giant Atmosphere)
function createUranusTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Soft aquamarine cyan gradient
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#75c8d2');
  grad.addColorStop(0.2, '#9fe1eb');
  grad.addColorStop(0.5, '#b5ecf5');
  grad.addColorStop(0.8, '#9fe1eb');
  grad.addColorStop(1, '#6cbac4');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Faint high-altitude white methane cloud streaks
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  for (let y = 140; y < 380; y += 35) {
    ctx.fillRect(0, y, canvas.width, 10);
  }

  // Polar Bright Collar
  const polarGrad = ctx.createRadialGradient(canvas.width * 0.5, 0, 5, canvas.width * 0.5, 0, 120);
  polarGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
  polarGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = polarGrad;
  ctx.beginPath();
  ctx.arc(canvas.width * 0.5, 0, 120, 0, Math.PI);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

// Procedural Uranus Ring System Texture
function createUranusRingsTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.4, 'rgba(180, 220, 235, 0.15)');
  grad.addColorStop(0.7, 'rgba(210, 240, 250, 0.75)'); // Epsilon Ring
  grad.addColorStop(0.85, 'rgba(170, 210, 225, 0.30)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  return new THREE.CanvasTexture(canvas);
}

// Procedural Neptune Texture (Deep Azure Ice Giant & Great Dark Spot)
function createNeptuneTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Intense vivid azure blue
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#1c3d82');
  grad.addColorStop(0.3, '#2b57b8');
  grad.addColorStop(0.5, '#3b6ee0');
  grad.addColorStop(0.7, '#2752b3');
  grad.addColorStop(1, '#15316e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Great Dark Spot (Anticyclonic Storm)
  const gdsX = canvas.width * 0.42;
  const gdsY = canvas.height * 0.46;
  const gdsGrad = ctx.createRadialGradient(gdsX, gdsY, 2, gdsX, gdsY, 40);
  gdsGrad.addColorStop(0, '#0c1a40');
  gdsGrad.addColorStop(0.7, '#152b66');
  gdsGrad.addColorStop(1, 'rgba(59, 110, 224, 0)');
  ctx.fillStyle = gdsGrad;
  ctx.beginPath();
  ctx.ellipse(gdsX, gdsY, 48, 26, -0.15, 0, Math.PI * 2);
  ctx.fill();

  // "Scooter" and Companion White Methane Cirrus Clouds
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  for (let i = 0; i < 12; i++) {
    const cx = (gdsX + 30 + i * 28) % canvas.width;
    const cy = gdsY + 18 + Math.sin(i) * 6;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 14 + Math.random() * 10, 3, 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Southern Polar Cloud Ring
  ctx.fillStyle = 'rgba(220, 240, 255, 0.45)';
  ctx.fillRect(0, canvas.height * 0.82, canvas.width, 8);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

// Procedural Pluto Texture (Heart-shaped Tombaugh Regio Nitrogen Glacier)
function createPlutoTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Muted reddish-tan and charcoal icy crust
  ctx.fillStyle = '#9e8067';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Dark equatorial tholin band (Cthulhu Macula)
  const cthulhuGrad = ctx.createRadialGradient(280, 280, 5, 280, 280, 160);
  cthulhuGrad.addColorStop(0, '#362319');
  cthulhuGrad.addColorStop(0.7, '#5e3e2b');
  cthulhuGrad.addColorStop(1, '#9e8067');
  ctx.fillStyle = cthulhuGrad;
  ctx.beginPath();
  ctx.ellipse(280, 280, 200, 70, 0.05, 0, Math.PI * 2);
  ctx.fill();

  // Iconic Tombaugh Regio Heart (Bright Nitrogen & Carbon Monoxide Ice)
  const hX = canvas.width * 0.62;
  const hY = canvas.height * 0.45;
  const heartGrad = ctx.createRadialGradient(hX, hY, 5, hX, hY, 85);
  heartGrad.addColorStop(0, '#fbf2e6');
  heartGrad.addColorStop(0.7, '#e4d2bf');
  heartGrad.addColorStop(1, 'rgba(158, 128, 103, 0)');
  ctx.fillStyle = heartGrad;
  
  // Left Lobe (Sputnik Planitia)
  ctx.beginPath();
  ctx.ellipse(hX - 25, hY, 55, 45, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // Right Lobe
  ctx.beginPath();
  ctx.ellipse(hX + 25, hY + 8, 48, 40, 0.3, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

// Procedural Sun Surface Texture (Solar Convective Granules & Sunspots)
function createSunSurfaceTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Intense incandescent white-yellow plasma
  ctx.fillStyle = '#ffeed0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Convective Granulation Cells
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = 4 + Math.random() * 16;
    const gGrad = ctx.createRadialGradient(x, y, 1, x, y, r);
    gGrad.addColorStop(0, '#ffffff');
    gGrad.addColorStop(0.6, '#ffd573');
    gGrad.addColorStop(1, '#ff9922');
    ctx.fillStyle = gGrad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Active Sunspot Regions (Umbra & Penumbra)
  const drawSunspot = (sx: number, sy: number, sr: number) => {
    const sGrad = ctx.createRadialGradient(sx, sy, 1, sx, sy, sr);
    sGrad.addColorStop(0, '#4a1500'); // Umbra
    sGrad.addColorStop(0.5, '#a83c00'); // Penumbra
    sGrad.addColorStop(1, 'rgba(255, 153, 34, 0)');
    ctx.fillStyle = sGrad;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  };

  drawSunspot(340, 210, 16);
  drawSunspot(365, 222, 10);
  drawSunspot(720, 280, 20);
  drawSunspot(745, 290, 12);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

// Procedural Moon Texture with True Lunar Maria
function createMoonCanvasTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = '#9aa0a6';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Lunar Maria (Sea of Tranquility, Ocean of Storms, Sea of Serenity)
  const maria: [number, number, number, number][] = [
    [330, 180, 85, 60],
    [470, 160, 75, 50],
    [620, 200, 60, 45],
    [710, 220, 55, 40],
    [770, 270, 45, 35]
  ];

  maria.forEach(([x, y, rx, ry]) => {
    const mGrad = ctx.createRadialGradient(x, y, 5, x, y, rx);
    mGrad.addColorStop(0, '#595d66');
    mGrad.addColorStop(0.7, '#6f737d');
    mGrad.addColorStop(1, '#9aa0a6');
    ctx.fillStyle = mGrad;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, Math.random() * 0.3, 0, Math.PI * 2);
    ctx.fill();
  });

  // Impact Craters with Ejecta Rays (Tycho & Copernicus)
  for (let c = 0; c < 80; c++) {
    const cx = Math.random() * canvas.width;
    const cy = Math.random() * canvas.height;
    const cr = 3 + Math.random() * 12;

    ctx.fillStyle = '#444850';
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(235, 240, 250, 0.65)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, cr * 1.15, 0, Math.PI * 2);
    ctx.stroke();
  }

  return new THREE.CanvasTexture(canvas);
}

// ---------------------------------------------------------------------------
// 4. ADVANCED GLSL SHADERS (DYNAMIC CLOUD SHADOWS & RAYLEIGH SCATTERING)
// ---------------------------------------------------------------------------

// Earth PBR Shader: Day/Night Terminator + Dynamic Cloud Shadows Cast on Terrain + Ocean Specular Glint
const EarthShader = {
  uniforms: {
    dayTexture: { value: null as THREE.Texture | null },
    nightTexture: { value: null as THREE.Texture | null },
    specularMap: { value: null as THREE.Texture | null },
    cloudsTexture: { value: null as THREE.Texture | null },
    sunDirection: { value: new THREE.Vector3(1, 0.4, 0.8).normalize() }
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform sampler2D dayTexture;
    uniform sampler2D nightTexture;
    uniform sampler2D specularMap;
    uniform sampler2D cloudsTexture;
    uniform vec3 sunDirection;

    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);

      // Transform sun direction for accurate light calculations
      vec3 sunDir = normalize(sunDirection);
      float NdotL = dot(normal, sunDir);

      // 1. Day / Night Blending across Twilight Terminator
      float dayFactor = smoothstep(-0.12, 0.22, NdotL);
      float nightFactor = smoothstep(0.18, -0.12, NdotL);

      vec4 dayColor = texture2D(dayTexture, vUv);
      vec4 nightColor = texture2D(nightTexture, vUv);
      vec4 specMask = texture2D(specularMap, vUv);

      // 2. Dynamic Cloud Cover & Realistic Cloud Cast Shadows on Surface
      // Project cloud offset according to sun direction to cast ground shadow
      vec2 shadowOffset = vec2(sunDir.x, -sunDir.y) * 0.005;
      vec4 cloudShadowSample = texture2D(cloudsTexture, vUv - shadowOffset);
      float cloudShadow = 1.0 - (cloudShadowSample.r * 0.55 * dayFactor);

      // Surface Day color with shadow projection
      vec3 surfaceDay = dayColor.rgb * cloudShadow;

      // 3. Golden Twilight Sunset Rim
      float twilight = smoothstep(-0.16, 0.04, NdotL) * smoothstep(0.18, -0.02, NdotL);
      vec3 twilightColor = vec3(1.0, 0.48, 0.16) * twilight * 0.50;

      // 4. Ocean Specular Sun Glint (Subtle, realistic sheen on water, strictly no whiteout)
      vec3 halfVector = normalize(sunDir + viewDir);
      float specStrength = pow(max(0.0, dot(normal, halfVector)), 64.0);
      float isWater = specMask.r > 0.4 ? 1.0 : 0.0;
      vec3 sunGlint = vec3(0.35, 0.60, 0.85) * specStrength * isWater * max(0.0, NdotL) * 0.15;

      // 5. Rayleigh Blue Atmospheric Limb Fresnel on Day Side (Subtle and Photorealistic)
      float fresnel = pow(1.0 - max(0.0, dot(viewDir, normal)), 3.5);
      vec3 limbAtmosphere = vec3(0.15, 0.45, 0.80) * fresnel * max(0.0, NdotL + 0.05) * 0.20;

      // 6. City Night Lights (Only on Dark Hemisphere)
      vec3 cityLights = nightColor.rgb * nightFactor * 1.5;

      // Final Composite with strict clamping
      vec3 finalColor = (surfaceDay * max(0.05, NdotL) * dayFactor)
                      + cityLights
                      + twilightColor
                      + sunGlint
                      + limbAtmosphere;

      gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
    }
  `
};

// Atmospheric Rayleigh Scattering Outer Halo Shader (Gentle, Natural Atmospheric Rim with Proximity Fade)
const AtmosphereGlowShader = {
  uniforms: {
    sunDirection: { value: new THREE.Vector3(1, 0.4, 0.8).normalize() },
    atmosphereColor: { value: new THREE.Color(0x38bdf8) },
    cameraDistance: { value: 280.0 }
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 sunDirection;
    uniform vec3 atmosphereColor;
    uniform float cameraDistance;

    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);

      float NdotV = dot(normal, viewDir);
      float fresnel = pow(1.0 - max(0.0, NdotV), 4.5);

      vec3 sunDir = normalize(sunDirection);
      float NdotL = dot(normal, sunDir);
      float sunIllum = smoothstep(-0.25, 0.55, NdotL);

      // Color shift towards warm sunset on terminator
      vec3 glowColor = mix(vec3(0.95, 0.45, 0.18), atmosphereColor, smoothstep(-0.20, 0.30, NdotL));

      // Dynamic fade when camera zooms into close Earth orbit to prevent white screen / camera clipping
      float proximityFade = clamp((cameraDistance - 106.0) / 35.0, 0.0, 1.0);
      float alpha = fresnel * (0.05 + 0.35 * sunIllum) * 0.30 * proximityFade;
      gl_FragColor = vec4(glowColor, clamp(alpha, 0.0, 0.4));
    }
  `
};

// ---------------------------------------------------------------------------
// 5. 3D SATELLITE & ISS MODEL BUILDERS
// ---------------------------------------------------------------------------

function createISSModel(): THREE.Group {
  const iss = new THREE.Group();

  // Central Pressurized Truss & Module
  const bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, 3.2, 16);
  bodyGeo.rotateZ(Math.PI / 2);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.85,
    roughness: 0.25
  });
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  iss.add(bodyMesh);

  // Solar Array Truss
  const trussGeo = new THREE.BoxGeometry(7.5, 0.15, 0.15);
  const trussMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9 });
  const trussMesh = new THREE.Mesh(trussGeo, trussMat);
  iss.add(trussMesh);

  // Solar Photovoltaic Panels (Blue/Gold Silicon Solar Wings)
  const panelGeo = new THREE.PlaneGeometry(2.4, 1.2);
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    emissive: 0x0369a1,
    emissiveIntensity: 0.3,
    metalness: 0.95,
    roughness: 0.1,
    side: THREE.DoubleSide
  });

  const p1 = new THREE.Mesh(panelGeo, panelMat);
  p1.position.set(-2.8, 0, 0);
  p1.rotateX(Math.PI / 4);
  iss.add(p1);

  const p2 = new THREE.Mesh(panelGeo, panelMat);
  p2.position.set(2.8, 0, 0);
  p2.rotateX(Math.PI / 4);
  iss.add(p2);

  return iss;
}

export const Globe3DView: React.FC<Globe3DViewProps> = ({
  lat,
  lng,
  radiusKm,
  targetName,
  videos,
  currentTheme,
  timeline,
  isActive = true,
  focusedCelestialBodyId,
  onSelectVideo,
  onLocationChange,
  onTransitionTo2D,
  onFocusBodyChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredVideo, setHoveredVideo] = useState<VideoItem | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [showSatellites, setShowSatellites] = useState(true);
  const [showDebris, setShowDebris] = useState(true);
  const [showOrbits, setShowOrbits] = useState(false);
  const [showPlanetOrbits, setShowPlanetOrbits] = useState(true);
  const [showPlanetLabels, setShowPlanetLabels] = useState(true);
  const [focusedBody, setFocusedBody] = useState<CelestialBodyData | null>(null);
  const [hoveredBody, setHoveredBody] = useState<CelestialBodyData | null>(null);
  const [showSolarSystemBar, setShowSolarSystemBar] = useState(true);
  const [activeTabTelemetry, setActiveTabTelemetry] = useState<'overview' | 'atmosphere' | 'orbit'>('overview');
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const visibleVideos = useMemo(() => {
    return videos.filter(v => {
      if (!timeline.enabled) return true;
      const yr = v.published_year || 2026;
      return yr >= timeline.minYear && yr <= timeline.maxYear;
    });
  }, [videos, timeline]);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const earthMeshRef = useRef<THREE.Mesh | null>(null);
  const cloudsMeshRef = useRef<THREE.Mesh | null>(null);
  const moonGroupRef = useRef<THREE.Group | null>(null);
  const markersGroupRef = useRef<THREE.Group | null>(null);
  const targetRingRef = useRef<THREE.Mesh | null>(null);

  // Orbital Elements Refs
  const satellitesGroupRef = useRef<THREE.Group | null>(null);
  const satMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const debrisMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const orbitLinesGroupRef = useRef<THREE.Group | null>(null);
  const issRef = useRef<THREE.Group | null>(null);
  const hubbleRef = useRef<THREE.Group | null>(null);

  // Full Solar System Celestial Bodies Refs
  const sunGroupRef = useRef<THREE.Group | null>(null);
  const mercuryMeshRef = useRef<THREE.Mesh | null>(null);
  const venusGroupRef = useRef<THREE.Group | null>(null);
  const marsGroupRef = useRef<THREE.Group | null>(null);
  const asteroidBeltRef = useRef<THREE.InstancedMesh | null>(null);
  const jupiterGroupRef = useRef<THREE.Group | null>(null);
  const saturnGroupRef = useRef<THREE.Group | null>(null);
  const uranusGroupRef = useRef<THREE.Group | null>(null);
  const neptuneGroupRef = useRef<THREE.Group | null>(null);
  const plutoGroupRef = useRef<THREE.Group | null>(null);
  const planetOrbitsGroupRef = useRef<THREE.Group | null>(null);
  const meteorsGroupRef = useRef<THREE.Group | null>(null);

  // Camera Target & Cinematic Gliding Refs
  const currentCameraLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const targetCameraLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const cameraOffsetDirRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.15, 1).normalize());

  const animFrameIdRef = useRef<number | null>(null);
  const earthShaderMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const atmosShaderMatRef = useRef<THREE.ShaderMaterial | null>(null);

  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const mouseDownPosRef = useRef({ x: 0, y: 0 });
  const cameraDistanceRef = useRef(280);
  const targetCameraDistanceRef = useRef(280);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cinematic Descent & Atmospheric Entry State
  const [descentProgress, setDescentProgress] = useState<number | null>(null);
  const isDescendingRef = useRef(false);
  const descentTargetRef = useRef<{ lat: number; lng: number; name: string } | null>(null);
  const descentStartTimeRef = useRef<number>(0);
  const descentDurationRef = useRef<number>(1500); // 1.5s snappy hypersonic atmospheric descent
  const descentStartDistanceRef = useRef<number>(280);
  const initialRotRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetRotRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Floating Orbital Space Search Omnibar State
  const [spaceSearchQuery, setSpaceSearchQuery] = useState('');
  const [spaceSuggestions, setSpaceSuggestions] = useState<Array<{ name: string; display_name: string; lat: number; lng: number }>>([]);
  const [isSearchingSpaceSuggestions, setIsSearchingSpaceSuggestions] = useState(false);
  const [showSpaceSuggestions, setShowSpaceSuggestions] = useState(false);
  const [isSpaceDiving, setIsSpaceDiving] = useState(false);

  const GLOBE_RADIUS = 100;

  // Initialize Three.js Space Scene Once
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000003);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.5, 35000);
    camera.position.set(0, 0, cameraDistanceRef.current);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
      logarithmicDepthBuffer: true,
      preserveDrawingBuffer: false
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 1. Primary Directional Sun Light (5800K Solar Illuminance)
    const sunDirVector = new THREE.Vector3(550, 260, 420).normalize();

    const sunLight = new THREE.DirectionalLight(0xffffff, 3.4);
    sunLight.position.set(550, 260, 420);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x060c18, 0.22);
    scene.add(ambientLight);

    // 2. Pristine Deep Space Cosmic Skysphere
    const cosmicDomeGeo = new THREE.SphereGeometry(4500, 32, 32);
    const cosmicCanvas = createPristineDeepSpacePanorama();
    const cosmicTexture = new THREE.CanvasTexture(cosmicCanvas);
    const cosmicDomeMat = new THREE.MeshBasicMaterial({
      map: cosmicTexture,
      side: THREE.BackSide,
      depthWrite: false
    });
    const cosmicDome = new THREE.Mesh(cosmicDomeGeo, cosmicDomeMat);
    scene.add(cosmicDome);

    // 3. Multi-Spectral Astronomical Starfield (10,000+ Pinpoint Stars)
    const starCount = 9500;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    const spectralColors = [
      new THREE.Color(0xffffff), // Class A (Sirius/Vega)
      new THREE.Color(0xa5c9ff), // Class B (Rigel)
      new THREE.Color(0xcfe0ff), // Class O
      new THREE.Color(0xfff1dc), // Class F (Procyon)
      new THREE.Color(0xffdfa8), // Class G (Sun/Capella)
      new THREE.Color(0xffc288), // Class K (Arcturus)
      new THREE.Color(0xff9e66)  // Class M (Betelgeuse)
    ];

    for (let i = 0; i < starCount; i++) {
      const r = 1600 + Math.random() * 2200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);

      const color = spectralColors[Math.floor(Math.random() * spectralColors.length)];
      starColors[i * 3] = color.r;
      starColors[i * 3 + 1] = color.g;
      starColors[i * 3 + 2] = color.b;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 1.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // 4. Radiant Sun System (Photosphere + Corona + Solar Flare Halo)
    const sunGroup = new THREE.Group();
    sunGroup.position.set(1800, 700, 1400);
    scene.add(sunGroup);
    sunGroupRef.current = sunGroup;

    // Sun Photosphere Mesh
    const sunGeo = new THREE.SphereGeometry(140, 48, 48);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xfff7d6
    });
    const sunGlobe = new THREE.Mesh(sunGeo, sunMat);
    sunGroup.add(sunGlobe);

    // Sun Corona Glare Sprite
    const sunCanvas = document.createElement('canvas');
    sunCanvas.width = 512;
    sunCanvas.height = 512;
    const sCtx = sunCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(256, 256, 40, 256, 256, 256);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.15, 'rgba(255, 245, 190, 0.95)');
      grad.addColorStop(0.35, 'rgba(251, 191, 36, 0.45)');
      grad.addColorStop(0.65, 'rgba(249, 115, 22, 0.12)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 512, 512);
    }
    const sunSpriteMat = new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(sunCanvas),
      blending: THREE.AdditiveBlending,
      color: 0xffffff
    });
    const sunSprite = new THREE.Sprite(sunSpriteMat);
    sunSprite.scale.set(780, 780, 1);
    sunGroup.add(sunSprite);

    // 5. Realistic Moon with Lunar Texture and Proper Phase Lighting
    const moonGroup = new THREE.Group();
    scene.add(moonGroup);
    moonGroupRef.current = moonGroup;

    const moonGeo = new THREE.SphereGeometry(18, 32, 32);
    const moonMat = new THREE.MeshStandardMaterial({
      map: createMoonCanvasTexture(),
      roughness: 0.92,
      metalness: 0.02
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.position.set(520, 140, -360);
    moonGroup.add(moonMesh);

    // -------------------------------------------------------------------------
    // 6. COMPLETE REALISTIC SOLAR SYSTEM PLANETS & CELESTIAL BODIES
    // -------------------------------------------------------------------------

    // A. MERCURY (Rocky cratered innermost planet)
    const mercuryGeo = new THREE.SphereGeometry(8.5, 32, 32);
    const mercuryMat = new THREE.MeshStandardMaterial({
      map: createMercuryTexture(),
      roughness: 0.92,
      metalness: 0.08
    });
    const mercuryMesh = new THREE.Mesh(mercuryGeo, mercuryMat);
    mercuryMesh.position.set(1150, 420, 850);
    scene.add(mercuryMesh);
    mercuryMeshRef.current = mercuryMesh;

    // B. VENUS (Dense golden sulfuric atmosphere)
    const venusGroup = new THREE.Group();
    venusGroup.position.set(750, 290, 520);
    scene.add(venusGroup);
    venusGroupRef.current = venusGroup;

    const venusGeo = new THREE.SphereGeometry(16, 36, 36);
    const venusMat = new THREE.MeshStandardMaterial({
      map: createVenusTexture(),
      roughness: 0.75,
      metalness: 0.05
    });
    const venusMesh = new THREE.Mesh(venusGeo, venusMat);
    venusGroup.add(venusMesh);

    // Venus atmospheric haze outer shell
    const venusHazeGeo = new THREE.SphereGeometry(16.5, 32, 32);
    const venusHazeMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending
    });
    venusGroup.add(new THREE.Mesh(venusHazeGeo, venusHazeMat));

    // C. MARS (Red Planet & Moons Phobos + Deimos)
    const marsGroup = new THREE.Group();
    marsGroup.position.set(-850, 320, -750);
    scene.add(marsGroup);
    marsGroupRef.current = marsGroup;

    const marsGeo = new THREE.SphereGeometry(14, 32, 32);
    const marsMat = new THREE.MeshStandardMaterial({
      map: createMarsTexture(),
      roughness: 0.85,
      metalness: 0.1
    });
    const marsMesh = new THREE.Mesh(marsGeo, marsMat);
    marsGroup.add(marsMesh);

    // Mars Moons: Phobos and Deimos
    const phobosGeo = new THREE.DodecahedronGeometry(1.2, 0);
    const phobosMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.9 });
    const phobos = new THREE.Mesh(phobosGeo, phobosMat);
    phobos.position.set(22, 4, 10);
    marsGroup.add(phobos);

    const deimosGeo = new THREE.DodecahedronGeometry(0.8, 0);
    const deimosMat = new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.95 });
    const deimos = new THREE.Mesh(deimosGeo, deimosMat);
    deimos.position.set(-34, -3, -15);
    marsGroup.add(deimos);

    // D. ASTEROID BELT (300+ Realistic Instanced Cosmic Boulders)
    const asteroidCount = 280;
    const asteroidGeo = new THREE.DodecahedronGeometry(2.2, 0);
    const asteroidMat = new THREE.MeshStandardMaterial({
      color: 0x78716c,
      roughness: 0.95,
      metalness: 0.15
    });
    const asteroidInstMesh = new THREE.InstancedMesh(asteroidGeo, asteroidMat, asteroidCount);
    const aDummy = new THREE.Object3D();

    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2 + (Math.random() * 0.05);
      const rad = 950 + Math.random() * 320;
      const yOffset = (Math.random() - 0.5) * 80;
      const scale = 0.5 + Math.random() * 1.8;

      aDummy.position.set(
        Math.cos(angle) * rad,
        yOffset,
        Math.sin(angle) * rad
      );
      aDummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      aDummy.scale.set(scale, scale * (0.8 + Math.random() * 0.4), scale);
      aDummy.updateMatrix();
      asteroidInstMesh.setMatrixAt(i, aDummy.matrix);
    }
    asteroidInstMesh.instanceMatrix.needsUpdate = true;
    scene.add(asteroidInstMesh);
    asteroidBeltRef.current = asteroidInstMesh;

    // E. JUPITER (Gas Giant & 4 Galilean Moons)
    const jupiterGroup = new THREE.Group();
    jupiterGroup.position.set(1450, -380, -1450);
    scene.add(jupiterGroup);
    jupiterGroupRef.current = jupiterGroup;

    const jupiterGeo = new THREE.SphereGeometry(44, 48, 48);
    const jupiterMat = new THREE.MeshStandardMaterial({
      map: createJupiterTexture(),
      roughness: 0.9,
      metalness: 0.05
    });
    const jupiterMesh = new THREE.Mesh(jupiterGeo, jupiterMat);
    jupiterGroup.add(jupiterMesh);

    // Galilean Moons (Io, Europa, Ganymede, Callisto)
    const moonColors = [0xeab308, 0x93c5fd, 0xd1d5db, 0x6b7280];
    const moonDistances = [65, 84, 108, 140];
    moonDistances.forEach((d, idx) => {
      const mGeo = new THREE.SphereGeometry(2.0, 16, 16);
      const mMat = new THREE.MeshStandardMaterial({ color: moonColors[idx], roughness: 0.8 });
      const gMoon = new THREE.Mesh(mGeo, mMat);
      gMoon.position.set(d * Math.cos(idx * 1.5), (idx - 1.5) * 4, d * Math.sin(idx * 1.5));
      jupiterGroup.add(gMoon);
    });

    // F. SATURN (Ringed Golden Planet & Titan)
    const saturnGroup = new THREE.Group();
    saturnGroup.position.set(-1650, -480, -1350);
    saturnGroup.rotation.z = 0.45; // 26.7° axial tilt
    scene.add(saturnGroup);
    saturnGroupRef.current = saturnGroup;

    const saturnGeo = new THREE.SphereGeometry(36, 48, 48);
    const saturnMat = new THREE.MeshStandardMaterial({
      map: createSaturnTexture(),
      roughness: 0.88,
      metalness: 0.08
    });
    const saturnMesh = new THREE.Mesh(saturnGeo, saturnMat);
    saturnGroup.add(saturnMesh);

    // Saturn Ring Geometry
    const ringGeo = new THREE.RingGeometry(48, 96, 64);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshStandardMaterial({
      map: createSaturnRingsTexture(),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
      roughness: 0.8
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    saturnGroup.add(ringMesh);

    // Moon Titan
    const titanGeo = new THREE.SphereGeometry(2.5, 16, 16);
    const titanMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.7 });
    const titanMesh = new THREE.Mesh(titanGeo, titanMat);
    titanMesh.position.set(125, 8, 45);
    saturnGroup.add(titanMesh);

    // G. URANUS (Aquamarine Ice Giant & Vertical Rings)
    const uranusGroup = new THREE.Group();
    uranusGroup.position.set(2100, 520, -1800);
    uranusGroup.rotation.x = 1.7; // 97.8° axial tilt (rolls on side)
    scene.add(uranusGroup);
    uranusGroupRef.current = uranusGroup;

    const uranusGeo = new THREE.SphereGeometry(24, 40, 40);
    const uranusMat = new THREE.MeshStandardMaterial({
      map: createUranusTexture(),
      roughness: 0.85,
      metalness: 0.05
    });
    const uranusMesh = new THREE.Mesh(uranusGeo, uranusMat);
    uranusGroup.add(uranusMesh);

    // Uranus Vertical Rings
    const uRingGeo = new THREE.RingGeometry(32, 54, 48);
    uRingGeo.rotateX(Math.PI / 2);
    const uRingMat = new THREE.MeshStandardMaterial({
      map: createUranusRingsTexture(),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
      roughness: 0.85
    });
    uranusGroup.add(new THREE.Mesh(uRingGeo, uRingMat));

    // H. NEPTUNE (Deep Azure Cobalt Giant & Triton)
    const neptuneGroup = new THREE.Group();
    neptuneGroup.position.set(-2400, 310, -2100);
    neptuneGroup.rotation.z = 0.5; // 28.3° axial tilt
    scene.add(neptuneGroup);
    neptuneGroupRef.current = neptuneGroup;

    const neptuneGeo = new THREE.SphereGeometry(23, 40, 40);
    const neptuneMat = new THREE.MeshStandardMaterial({
      map: createNeptuneTexture(),
      roughness: 0.82,
      metalness: 0.08
    });
    const neptuneMesh = new THREE.Mesh(neptuneGeo, neptuneMat);
    neptuneGroup.add(neptuneMesh);

    // Retrograde Moon Triton
    const tritonGeo = new THREE.SphereGeometry(2.0, 16, 16);
    const tritonMat = new THREE.MeshStandardMaterial({ color: 0xbfdbfe, roughness: 0.9 });
    const tritonMesh = new THREE.Mesh(tritonGeo, tritonMat);
    tritonMesh.position.set(55, -6, 20);
    neptuneGroup.add(tritonMesh);

    // I. PLUTO (Dwarf Planet & Charon)
    const plutoGroup = new THREE.Group();
    plutoGroup.position.set(2800, -650, -2500);
    scene.add(plutoGroup);
    plutoGroupRef.current = plutoGroup;

    const plutoGeo = new THREE.SphereGeometry(7.0, 24, 24);
    const plutoMat = new THREE.MeshStandardMaterial({
      map: createPlutoTexture(),
      roughness: 0.95,
      metalness: 0.02
    });
    const plutoMesh = new THREE.Mesh(plutoGeo, plutoMat);
    plutoGroup.add(plutoMesh);

    // Moon Charon
    const charonGeo = new THREE.SphereGeometry(3.5, 16, 16);
    const charonMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.95 });
    const charonMesh = new THREE.Mesh(charonGeo, charonMat);
    charonMesh.position.set(18, 5, 8);
    plutoGroup.add(charonMesh);

    // J. (PLANETARY ORBIT TRACKS REMOVED FOR CLEAN VISUALS)
    const planetOrbitsGroup = new THREE.Group();
    planetOrbitsGroup.visible = false;
    scene.add(planetOrbitsGroup);
    planetOrbitsGroupRef.current = planetOrbitsGroup;

    // K. (DYNAMIC METEORS / SHOOTING STARS REMOVED FOR CLEAN VISUALS)
    const meteorsGroup = new THREE.Group();
    meteorsGroup.visible = false;
    scene.add(meteorsGroup);
    meteorsGroupRef.current = meteorsGroup;

    // -------------------------------------------------------------------------
    // 7. EARTH GROUP & PHOTOREALISTIC BLUE MARBLE PBR SHADER
    // -------------------------------------------------------------------------
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    const earthDayTexture = new THREE.CanvasTexture(createPhotorealisticEarthCanvas());
    earthDayTexture.wrapS = THREE.RepeatWrapping;

    const earthNightTexture = new THREE.CanvasTexture(createEarthNightLightsCanvas());
    earthNightTexture.wrapS = THREE.RepeatWrapping;

    const earthSpecTexture = new THREE.CanvasTexture(createSpecularMaskCanvas());
    earthSpecTexture.wrapS = THREE.RepeatWrapping;

    const cloudsTexture = new THREE.CanvasTexture(createAtmosphericCloudsCanvas());
    cloudsTexture.wrapS = THREE.RepeatWrapping;

    const earthShaderMat = new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: earthDayTexture },
        nightTexture: { value: earthNightTexture },
        specularMap: { value: earthSpecTexture },
        cloudsTexture: { value: cloudsTexture },
        sunDirection: { value: sunDirVector }
      },
      vertexShader: EarthShader.vertexShader,
      fragmentShader: EarthShader.fragmentShader
    });
    earthShaderMatRef.current = earthShaderMat;

    const earthGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 96, 96);
    const earthMesh = new THREE.Mesh(earthGeo, earthShaderMat);
    globeGroup.add(earthMesh);
    earthMeshRef.current = earthMesh;

    // Asynchronously Upgrade with NASA Satellite Imagery from High-Speed CDNs
    const textureLoader = new THREE.TextureLoader();

    const loadTextureWithFallback = (urls: string[], onSuccess: (tex: THREE.Texture) => void, idx = 0) => {
      if (idx >= urls.length) return;
      textureLoader.load(
        urls[idx],
        (tex) => {
          tex.wrapS = THREE.RepeatWrapping;
          onSuccess(tex);
        },
        undefined,
        () => {
          loadTextureWithFallback(urls, onSuccess, idx + 1);
        }
      );
    };

    // NASA Blue Marble High-Res Satellite Surface
    loadTextureWithFallback([
      'https://cdn.jsdelivr.net/gh/vasturiano/three-globe/example/img/earth-blue-marble.jpg',
      'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
      'https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg'
    ], (tex) => {
      if (earthShaderMatRef.current) {
        earthShaderMatRef.current.uniforms.dayTexture.value = tex;
        earthShaderMatRef.current.needsUpdate = true;
      }
    });

    // NASA Black Marble City Night Lights
    loadTextureWithFallback([
      'https://cdn.jsdelivr.net/gh/vasturiano/three-globe/example/img/earth-night.jpg',
      'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_lights_2048.png',
      'https://unpkg.com/three-globe@2.31.0/example/img/earth-night.jpg'
    ], (tex) => {
      if (earthShaderMatRef.current) {
        earthShaderMatRef.current.uniforms.nightTexture.value = tex;
        earthShaderMatRef.current.needsUpdate = true;
      }
    });

    // NASA Specular Ocean Mask
    loadTextureWithFallback([
      'https://cdn.jsdelivr.net/gh/vasturiano/three-globe/example/img/earth-water.png',
      'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg',
      'https://unpkg.com/three-globe@2.31.0/example/img/earth-water.png'
    ], (tex) => {
      if (earthShaderMatRef.current) {
        earthShaderMatRef.current.uniforms.specularMap.value = tex;
        earthShaderMatRef.current.needsUpdate = true;
      }
    });

    // 8. Dynamic Atmospheric Cloud Shell
    const cloudsGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.008, 64, 64);
    const cloudsMat = new THREE.MeshStandardMaterial({
      map: cloudsTexture,
      transparent: true,
      opacity: 0.75,
      blending: THREE.NormalBlending,
      roughness: 0.95,
      metalness: 0.0
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    globeGroup.add(cloudsMesh);
    cloudsMeshRef.current = cloudsMesh;

    loadTextureWithFallback([
      'https://cdn.jsdelivr.net/gh/vasturiano/three-globe/example/img/earth-clouds.png',
      'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png',
      'https://unpkg.com/three-globe@2.31.0/example/img/earth-clouds.png'
    ], (tex) => {
      cloudsMat.map = tex;
      cloudsMat.opacity = 0.78;
      cloudsMat.needsUpdate = true;
      if (earthShaderMatRef.current) {
        earthShaderMatRef.current.uniforms.cloudsTexture.value = tex;
        earthShaderMatRef.current.needsUpdate = true;
      }
    });

    // 9. Rayleigh Atmospheric Limb Glow Shell (Luminous Azure Halo with Proximity Dynamic Fade)
    const atmosGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.028, 64, 64);
    const atmosMat = new THREE.ShaderMaterial({
      uniforms: {
        sunDirection: { value: sunDirVector },
        atmosphereColor: { value: new THREE.Color(0x38bdf8) },
        cameraDistance: { value: 280.0 }
      },
      vertexShader: AtmosphereGlowShader.vertexShader,
      fragmentShader: AtmosphereGlowShader.fragmentShader,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });
    atmosShaderMatRef.current = atmosMat;

    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    globeGroup.add(atmosMesh);

    // -------------------------------------------------------------------------
    // 10. ORBITING ELEMENTS: SATELLITES, ISS, AND SPACE DEBRIS FIELD
    // -------------------------------------------------------------------------
    const satellitesGroup = new THREE.Group();
    globeGroup.add(satellitesGroup);
    satellitesGroupRef.current = satellitesGroup;

    // A. International Space Station (ISS in LEO ~108 units radius, 51.6° inclination)
    const issGroup = createISSModel();
    issGroup.scale.set(0.6, 0.6, 0.6);
    satellitesGroup.add(issGroup);
    issRef.current = issGroup;

    // B. Hubble Space Telescope (HST in LEO ~114 units radius, 28.5° inclination)
    const hubbleGroup = new THREE.Group();
    const hBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 1.8, 16),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 })
    );
    hBody.rotateZ(Math.PI / 2);
    hubbleGroup.add(hBody);
    satellitesGroup.add(hubbleGroup);
    hubbleRef.current = hubbleGroup;

    // D. Instanced Starlink & Operational Satellite Fleet (48 satellites)
    const satCount = 48;
    const satGeo = new THREE.BoxGeometry(0.6, 0.3, 0.15);
    const satMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      metalness: 0.8,
      roughness: 0.2
    });
    const satMesh = new THREE.InstancedMesh(satGeo, satMat, satCount);
    satellitesGroup.add(satMesh);
    satMeshRef.current = satMesh;

    // E. Realistic Instanced Space Debris Cloud (320 orbiting fragments)
    const debrisCount = 320;
    const debGeo = new THREE.DodecahedronGeometry(0.22, 0);
    const debMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.95,
      roughness: 0.3
    });
    const debrisMesh = new THREE.InstancedMesh(debGeo, debMat, debrisCount);
    globeGroup.add(debrisMesh);
    debrisMeshRef.current = debrisMesh;

    // Initialize Debris Orbital Elements
    const dummy = new THREE.Object3D();
    const debrisOrbits: { r: number; inc: number; speed: number; phase: number }[] = [];
    for (let i = 0; i < debrisCount; i++) {
      const r = 106 + Math.random() * 55;
      const inc = (Math.random() - 0.5) * Math.PI;
      const speed = 0.08 + Math.random() * 0.12;
      const phase = Math.random() * Math.PI * 2;
      debrisOrbits.push({ r, inc, speed, phase });
    }

    // Video Markers Sub-Group
    const markersGroup = new THREE.Group();
    globeGroup.add(markersGroup);
    markersGroupRef.current = markersGroup;

    // Orient globe immediately to center on active target coordinates
    const targetPhi = (90 - lat) * (Math.PI / 180);
    const targetTheta = (lng + 180) * (Math.PI / 180);
    globeGroup.rotation.y = -targetTheta + Math.PI / 2;
    globeGroup.rotation.x = targetPhi - Math.PI / 2;

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      if (w === 0 || h === 0) return;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      earthGeo.dispose();
      earthShaderMat.dispose();
      cloudsGeo.dispose();
      cloudsMat.dispose();
      atmosGeo.dispose();
      atmosMat.dispose();
      cosmicDomeGeo.dispose();
      cosmicDomeMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      moonGeo.dispose();
      moonMat.dispose();
      marsGeo.dispose();
      marsMat.dispose();
      jupiterGeo.dispose();
      jupiterMat.dispose();
      saturnGeo.dispose();
      saturnMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      satGeo.dispose();
      satMat.dispose();
      debGeo.dispose();
      debMat.dispose();
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, []);

  // Update Satellites, Debris & Orbit Tracks Visibility
  useEffect(() => {
    if (satellitesGroupRef.current) satellitesGroupRef.current.visible = showSatellites;
    if (debrisMeshRef.current) debrisMeshRef.current.visible = showDebris;
    if (orbitLinesGroupRef.current) orbitLinesGroupRef.current.visible = showOrbits;
    if (planetOrbitsGroupRef.current) planetOrbitsGroupRef.current.visible = showPlanetOrbits;
  }, [showSatellites, showDebris, showOrbits, showPlanetOrbits]);

  // Animation Loop with Continuous Photorealistic Celestial Simulation
  useEffect(() => {
    if (!isActive || !rendererRef.current || !sceneRef.current || !cameraRef.current) {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      return;
    }

    if (containerRef.current && rendererRef.current && cameraRef.current) {
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      if (w > 0 && h > 0) {
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
      }
    }

    const dummy = new THREE.Object3D();
    let lastTime = performance.now();
    let nextMeteorTime = performance.now() + 2000;

    const animate = (time: number) => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      // 1. Cinematic Hypersonic Descent Flight Path from Space / Orbit to Earth Surface
      if (isDescendingRef.current && descentStartTimeRef.current > 0) {
        const elapsed = performance.now() - descentStartTimeRef.current;
        const progress = Math.min(1.0, elapsed / descentDurationRef.current);
        setDescentProgress(progress);

        // Smooth cubic in-out easing for orientation, exponential rush for camera altitude
        const easeOrient = progress < 0.5 
          ? 4 * progress * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        if (globeGroupRef.current) {
          globeGroupRef.current.rotation.x = initialRotRef.current.x + (targetRotRef.current.x - initialRotRef.current.x) * easeOrient;
          globeGroupRef.current.rotation.y = initialRotRef.current.y + (targetRotRef.current.y - initialRotRef.current.y) * easeOrient;
        }

        // Camera smoothly plunges from initial space distance (could be outer space / planet / orbit) down to low troposphere (103.5)
        const startDist = Math.max(280, descentStartDistanceRef.current);
        const endDist = 103.5;
        const easeDive = Math.pow(progress, 2.0);
        cameraDistanceRef.current = startDist - (startDist - endDist) * easeDive;
        targetCameraDistanceRef.current = cameraDistanceRef.current;

        // Smoothly guide lookAt towards center of Earth (0,0,0)
        currentCameraLookAtRef.current.lerp(new THREE.Vector3(0, 0, 0), 0.15);

        if (cameraRef.current) {
          const look = currentCameraLookAtRef.current;
          cameraRef.current.position.set(look.x, look.y, cameraDistanceRef.current);
          cameraRef.current.lookAt(look.x, look.y, look.z);
        }

        // Completion of re-entry descent -> seamlessly switch to 2D tactical view with coordinates
        if (progress >= 1.0) {
          isDescendingRef.current = false;
          setIsSpaceDiving(false);
          setDescentProgress(null);
          if (descentTargetRef.current) {
            const { lat: tLat, lng: tLng, name: tName } = descentTargetRef.current;
            onLocationChange(tLat, tLng, tName);
            onTransitionTo2D(tLat, tLng, 14);
            descentTargetRef.current = null;
          }
          targetCameraDistanceRef.current = 280;
        }
      } else {
        // Smooth Camera Gliding & Focus LookAt Transition
        currentCameraLookAtRef.current.lerp(targetCameraLookAtRef.current, 0.08);
        cameraDistanceRef.current += (targetCameraDistanceRef.current - cameraDistanceRef.current) * 0.10;

        if (cameraRef.current) {
          const look = currentCameraLookAtRef.current;
          const dist = cameraDistanceRef.current;
          const offset = cameraOffsetDirRef.current;
          
          cameraRef.current.position.set(
            look.x + offset.x * dist,
            look.y + offset.y * dist,
            look.z + offset.z * dist
          );
          cameraRef.current.lookAt(look.x, look.y, look.z);
        }

        // Dynamically adjust atmosphere and cloud opacity to prevent white screen / occlusion when zooming in
        if (atmosShaderMatRef.current && atmosShaderMatRef.current.uniforms.cameraDistance) {
          atmosShaderMatRef.current.uniforms.cameraDistance.value = cameraDistanceRef.current;
        }
        if (cloudsMeshRef.current && cloudsMeshRef.current.material) {
          const cMat = cloudsMeshRef.current.material as THREE.MeshStandardMaterial;
          const fade = Math.min(1.0, Math.max(0.12, (cameraDistanceRef.current - 110.0) / 40.0));
          cMat.opacity = 0.65 * fade;
        }
      }

      // 2. Earth Planetary Rotation (Gentle, realistic planetary spin)
      if (autoRotate && !isDraggingRef.current && !isDescendingRef.current && globeGroupRef.current) {
        globeGroupRef.current.rotation.y += delta * 0.012;
      }

      // 3. Dynamic Cloud Circulation (Independent Wind Drift)
      if (cloudsMeshRef.current) {
        cloudsMeshRef.current.rotation.y += delta * 0.006;
      }

      // 4. Lunar Orbital Motion
      if (moonGroupRef.current) {
        moonGroupRef.current.rotation.y += delta * 0.008;
      }

      // 5. Full Solar System Rotations & Orbit Dynamics
      if (sunGroupRef.current) {
        sunGroupRef.current.rotation.y += delta * 0.004;
      }
      if (mercuryMeshRef.current) {
        mercuryMeshRef.current.rotation.y += delta * 0.008;
      }
      if (venusGroupRef.current) {
        venusGroupRef.current.rotation.y -= delta * 0.005; // Retrograde spin
      }
      if (marsGroupRef.current) {
        marsGroupRef.current.rotation.y += delta * 0.015;
      }
      if (asteroidBeltRef.current) {
        asteroidBeltRef.current.rotation.y += delta * 0.003;
      }
      if (jupiterGroupRef.current) {
        jupiterGroupRef.current.rotation.y += delta * 0.025;
      }
      if (saturnGroupRef.current) {
        saturnGroupRef.current.rotation.y += delta * 0.022;
      }
      if (uranusGroupRef.current) {
        uranusGroupRef.current.rotation.z += delta * 0.018;
      }
      if (neptuneGroupRef.current) {
        neptuneGroupRef.current.rotation.y += delta * 0.019;
      }
      if (plutoGroupRef.current) {
        plutoGroupRef.current.rotation.y += delta * 0.007;
      }

      // 6. Dynamic Meteors / Shooting Star Streaks
      if (meteorsGroupRef.current && time > nextMeteorTime) {
        nextMeteorTime = time + 2500 + Math.random() * 4000;
        const meteors = meteorsGroupRef.current.children as THREE.Line[];
        if (meteors.length > 0) {
          const m = meteors[Math.floor(Math.random() * meteors.length)];
          m.position.set(
            (Math.random() - 0.5) * 2200,
            350 + Math.random() * 800,
            (Math.random() - 0.5) * 2200
          );
          m.visible = true;
          setTimeout(() => {
            if (m) m.visible = false;
          }, 350);
        }
      }

      // 7. Realistic Orbital Satellite Mechanics (ISS & Hubble Trajectories)
      const t = time * 0.001;

      if (issRef.current) {
        const issR = 110;
        const issAngle = t * 0.025;
        const issInc = 0.9;
        const x = issR * Math.cos(issAngle);
        const z = issR * Math.sin(issAngle) * Math.cos(issInc);
        const y = issR * Math.sin(issAngle) * Math.sin(issInc);
        issRef.current.position.set(x, y, z);
        issRef.current.lookAt(x + Math.sin(issAngle), y, z - Math.cos(issAngle));
      }

      if (hubbleRef.current) {
        const hR = 115;
        const hAngle = t * 0.020 + 2.0;
        const hInc = 0.5;
        const x = hR * Math.cos(hAngle);
        const z = hR * Math.sin(hAngle) * Math.cos(hInc);
        const y = hR * Math.sin(hAngle) * Math.sin(hInc);
        hubbleRef.current.position.set(x, y, z);
      }

      // 8. Satellite Fleet Instanced Motion
      if (satMeshRef.current && satMeshRef.current.visible) {
        const count = satMeshRef.current.count;
        for (let i = 0; i < count; i++) {
          const r = 108 + (i % 24) * 1.5;
          const inc = ((i % 8) / 8) * Math.PI - Math.PI / 4;
          const speed = 0.014 + (i % 6) * 0.002;
          const angle = t * speed + (i * 0.45);

          const x = r * Math.cos(angle);
          const z = r * Math.sin(angle) * Math.cos(inc);
          const y = r * Math.sin(angle) * Math.sin(inc);

          dummy.position.set(x, y, z);
          dummy.rotation.set(0, angle, inc);
          dummy.updateMatrix();
          satMeshRef.current.setMatrixAt(i, dummy.matrix);
        }
        satMeshRef.current.instanceMatrix.needsUpdate = true;
      }

      // 9. Space Debris Cloud Instanced Motion
      if (debrisMeshRef.current && debrisMeshRef.current.visible) {
        const count = debrisMeshRef.current.count;
        for (let i = 0; i < count; i++) {
          const r = 107 + (i % 50);
          const inc = ((i % 12) / 12) * Math.PI - Math.PI / 2;
          const speed = 0.012 + (i % 7) * 0.002;
          const angle = t * speed + (i * 1.37);

          const x = r * Math.cos(angle);
          const z = r * Math.sin(angle) * Math.cos(inc);
          const y = r * Math.sin(angle) * Math.sin(inc);

          dummy.position.set(x, y, z);
          dummy.rotation.set(t * 0.04 + i, t * 0.02 + i, 0);
          dummy.updateMatrix();
          debrisMeshRef.current.setMatrixAt(i, dummy.matrix);
        }
        debrisMeshRef.current.instanceMatrix.needsUpdate = true;
      }

      // 10. Target Beacon Pulse
      if (targetRingRef.current) {
        const s = 1 + Math.sin(time * 0.003) * 0.12;
        targetRingRef.current.scale.set(s, s, s);
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };
  }, [isActive, autoRotate]);

  // Geographic Target Alignment & Cinematic Re-entry Descent
  const lastTargetCoordsRef = useRef<{ lat: number; lng: number }>({ lat, lng });
  const isFirstMountTargetRef = useRef(true);

  useEffect(() => {
    if (!globeGroupRef.current) return;

    const targetPhi = (90 - lat) * (Math.PI / 180);
    const targetTheta = (lng + 180) * (Math.PI / 180);
    const destY = -targetTheta + Math.PI / 2;
    const destX = targetPhi - Math.PI / 2;

    lastTargetCoordsRef.current = { lat, lng };

    if (isFirstMountTargetRef.current) {
      isFirstMountTargetRef.current = false;
      globeGroupRef.current.rotation.y = destY;
      globeGroupRef.current.rotation.x = destX;
      return;
    }

    // Smooth direct alignment to target coordinates
    globeGroupRef.current.rotation.y = destY;
    globeGroupRef.current.rotation.x = destX;
  }, [lat, lng, targetName, isActive]);

  // Clean Globe: No cone pins or markers obscuring the photorealistic Earth
  useEffect(() => {
    if (!markersGroupRef.current) return;
    const group = markersGroupRef.current;

    while (group.children.length > 0) {
      const obj = group.children[0] as THREE.Mesh;
      group.remove(obj);
      obj.geometry?.dispose();
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose());
      } else {
        obj.material?.dispose();
      }
    }
  }, []);

  // Focus on a Celestial Body & Smooth Camera Flight
  const handleFocusBody = useCallback((body: CelestialBodyData | null) => {
    setFocusedBody(body);
    onFocusBodyChange?.(body);
    if (!body || body.id === 'earth') {
      targetCameraLookAtRef.current.set(0, 0, 0);
      targetCameraDistanceRef.current = 280;
    } else {
      targetCameraLookAtRef.current.set(body.position[0], body.position[1], body.position[2]);
      targetCameraDistanceRef.current = Math.max(body.radius * 3.4, 55);
    }
  }, [onFocusBodyChange]);

  // Synchronize external celestial body focus trigger
  useEffect(() => {
    if (focusedCelestialBodyId) {
      const found = SOLAR_SYSTEM_BODIES.find(b => b.id === focusedCelestialBodyId);
      if (found) {
        handleFocusBody(found);
      }
    }
  }, [focusedCelestialBodyId, handleFocusBody]);

  // Direct Raycast Geographic Coordinate & Planet Resolver
  const getRaycastGeoTarget = useCallback((clientX: number, clientY: number): { lat: number; lng: number; video?: VideoItem } | null => {
    if (!containerRef.current || !cameraRef.current || !globeGroupRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    // 1. Check Video Marker Hits First
    if (markersGroupRef.current) {
      const markerHits = raycaster.intersectObjects(markersGroupRef.current.children, true);
      if (markerHits.length > 0) {
        const v = (markerHits[0].object as THREE.Mesh).userData?.video;
        if (v) {
          return { lat: v.lat, lng: v.lng, video: v };
        }
      }
    }

    // 2. Check Earth Sphere Surface Hit
    const earthMesh = earthMeshRef.current;
    if (earthMesh) {
      const earthHits = raycaster.intersectObject(earthMesh, false);
      if (earthHits.length > 0) {
        const hitPoint = earthHits[0].point;
        const localPoint = globeGroupRef.current.worldToLocal(hitPoint.clone());
        const { lat: clickLat, lng: clickLng } = vector3ToLatLng(localPoint, GLOBE_RADIUS);
        return { lat: clickLat, lng: clickLng };
      }
    }

    return null;
  }, [GLOBE_RADIUS]);

  // Check Celestial Body Raycast Intersection
  const checkCelestialBodyIntersection = useCallback((clientX: number, clientY: number): CelestialBodyData | null => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    // Check hit against all celestial bodies by proximity to ray
    const ray = raycaster.ray;
    let closestBody: CelestialBodyData | null = null;
    let minDistance = Infinity;

    SOLAR_SYSTEM_BODIES.forEach(body => {
      const pos = new THREE.Vector3(...body.position);
      const hitRadius = Math.max(body.radius * 1.5, 25);
      const distToRay = ray.distanceToPoint(pos);
      if (distToRay < hitRadius) {
        const distToCam = ray.origin.distanceTo(pos);
        if (distToCam < minDistance) {
          minDistance = distToCam;
          closestBody = body;
        }
      }
    });

    return closestBody;
  }, []);

  // Cinematic Hypersonic Descent Trigger from Space / Orbit to Surface
  const startCinematicDescent = useCallback((targetLat: number, targetLng: number, placeName: string) => {
    // 1. Reset focus from other planets back to Earth
    if (focusedBody && focusedBody.id !== 'earth') {
      setFocusedBody(null);
      onFocusBodyChange?.(null);
    }

    targetCameraLookAtRef.current.set(0, 0, 0);

    // 2. Prepare rotational destination for Earth to face target coordinates
    const targetPhi = (90 - targetLat) * (Math.PI / 180);
    const targetTheta = (targetLng + 180) * (Math.PI / 180);
    const destY = -targetTheta + Math.PI / 2;
    const destX = targetPhi - Math.PI / 2;

    if (globeGroupRef.current) {
      initialRotRef.current = {
        x: globeGroupRef.current.rotation.x,
        y: globeGroupRef.current.rotation.y
      };
    } else {
      initialRotRef.current = { x: 0, y: 0 };
    }

    // Shortest angular path difference for Y rotation to prevent 360-degree spin loops
    let diffY = (destY - initialRotRef.current.y) % (Math.PI * 2);
    if (diffY > Math.PI) diffY -= Math.PI * 2;
    if (diffY < -Math.PI) diffY += Math.PI * 2;
    targetRotRef.current = {
      x: destX,
      y: initialRotRef.current.y + diffY
    };

    descentStartDistanceRef.current = Math.max(cameraDistanceRef.current, 280);
    descentTargetRef.current = { lat: targetLat, lng: targetLng, name: placeName };
    descentDurationRef.current = 1500; // 1.5s snappy hypersonic descent
    descentStartTimeRef.current = performance.now();
    isDescendingRef.current = true;
    setIsSpaceDiving(true);
    setDescentProgress(0.01);
  }, [focusedBody, onFocusBodyChange]);

  // Space Omnibar Submit Handler
  const handleSpaceSearchSubmit = useCallback(async (queryToSearch?: string) => {
    const q = (queryToSearch !== undefined ? queryToSearch : spaceSearchQuery).trim();
    if (!q) return;

    setShowSpaceSuggestions(false);

    // 1. Instant 0ms Match against Top Orbital Preset Targets
    const lower = q.toLowerCase();
    const preset = ORBITAL_QUICK_TARGETS.find(
      p =>
        p.name.toLowerCase() === lower ||
        p.arabic === q ||
        lower.includes(p.name.toLowerCase()) ||
        p.arabic.includes(q)
    );

    if (preset) {
      startCinematicDescent(preset.lat, preset.lng, `${preset.arabic} (${preset.name})`);
      return;
    }

    // 2. Geocode Live via OpenStreetMap Nominatim
    try {
      setIsSearchingSpaceSuggestions(true);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const targetLat = parseFloat(item.lat);
        const targetLng = parseFloat(item.lon);
        startCinematicDescent(targetLat, targetLng, item.display_name.split(',')[0]);
      }
    } catch (err) {
      console.warn('Orbital Geocoding Query Fallback:', err);
    } finally {
      setIsSearchingSpaceSuggestions(false);
    }
  }, [spaceSearchQuery, startCinematicDescent]);

  // Debounced Suggestions Fetcher for Space Omnibar
  useEffect(() => {
    if (!spaceSearchQuery.trim() || spaceSearchQuery.trim().length < 2) {
      setSpaceSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const q = spaceSearchQuery.trim().toLowerCase();
        // Check matching presets first
        const matchedPresets = ORBITAL_QUICK_TARGETS.filter(
          p => p.name.toLowerCase().includes(q) || p.arabic.includes(q)
        ).map(p => ({
          name: `${p.flag} ${p.arabic} (${p.name})`,
          display_name: `${p.arabic}, ${p.country}`,
          lat: p.lat,
          lng: p.lng
        }));

        if (matchedPresets.length > 0) {
          setSpaceSuggestions(matchedPresets);
          setShowSpaceSuggestions(true);
          return;
        }

        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(spaceSearchQuery)}&limit=5`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setSpaceSuggestions(
            data.map((item: any) => ({
              name: item.display_name.split(',')[0],
              display_name: item.display_name,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon)
            }))
          );
          setShowSpaceSuggestions(true);
        }
      } catch (err) {
        // Fallback silently on network limits
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [spaceSearchQuery]);

  // Robust Double-Click Handler: Guaranteed First-Try Hypersonic Dive
  const handleDoubleClickDirect = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }

    const hitBody = checkCelestialBodyIntersection(e.clientX, e.clientY);
    if (hitBody && hitBody.id !== 'earth') {
      handleFocusBody(hitBody);
      return;
    }

    const target = getRaycastGeoTarget(e.clientX, e.clientY);
    if (target) {
      if (target.video) {
        onSelectVideo(target.video);
      }
      startCinematicDescent(target.lat, target.lng, target.video?.title || targetName);
    } else {
      startCinematicDescent(lat, lng, targetName);
    }
  }, [getRaycastGeoTarget, checkCelestialBodyIntersection, handleFocusBody, onSelectVideo, startCinematicDescent, lat, lng, targetName]);

  // Mouse Interaction handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });

    if (isDraggingRef.current) {
      const deltaX = e.clientX - prevMousePosRef.current.x;
      const deltaY = e.clientY - prevMousePosRef.current.y;
      prevMousePosRef.current = { x: e.clientX, y: e.clientY };

      if (focusedBody && focusedBody.id !== 'earth') {
        // Orbit camera around focused celestial body in 360 degrees
        const theta = deltaX * 0.005;
        const phi = deltaY * 0.005;
        const spherical = new THREE.Spherical().setFromVector3(cameraOffsetDirRef.current);
        spherical.theta -= theta;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi - phi));
        cameraOffsetDirRef.current.setFromSpherical(spherical);
      } else if (globeGroupRef.current) {
        globeGroupRef.current.rotation.y += deltaX * 0.005;
        globeGroupRef.current.rotation.x += deltaY * 0.005;
        globeGroupRef.current.rotation.x = Math.max(
          -Math.PI / 2 + 0.05,
          Math.min(Math.PI / 2 - 0.05, globeGroupRef.current.rotation.x)
        );
      }
      return;
    }

    if (!containerRef.current || !cameraRef.current) return;

    // Check celestial body hover
    const hitBody = checkCelestialBodyIntersection(e.clientX, e.clientY);
    if (hitBody) {
      setHoveredBody(hitBody);
      containerRef.current.style.cursor = 'pointer';
      return;
    } else if (hoveredBody) {
      setHoveredBody(null);
    }

    if (!markersGroupRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);
    const intersects = raycaster.intersectObjects(markersGroupRef.current.children);

    if (intersects.length > 0) {
      const hit = intersects[0].object as THREE.Mesh;
      if (hit.userData?.video) {
        setHoveredVideo(hit.userData.video);
        containerRef.current.style.cursor = 'pointer';
        return;
      }
    }

    if (hoveredVideo) setHoveredVideo(null);
    containerRef.current.style.cursor = isDraggingRef.current ? 'grabbing' : 'grab';
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    isDraggingRef.current = false;
    if (containerRef.current) containerRef.current.style.cursor = 'grab';

    const distMoved = Math.sqrt(
      Math.pow(e.clientX - mouseDownPosRef.current.x, 2) +
      Math.pow(e.clientY - mouseDownPosRef.current.y, 2)
    );

    if (distMoved < 6) {
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
      clickTimerRef.current = setTimeout(() => {
        const hitBody = checkCelestialBodyIntersection(e.clientX, e.clientY);
        if (hitBody) {
          handleFocusBody(hitBody);
          return;
        }

        const target = getRaycastGeoTarget(e.clientX, e.clientY);
        if (target) {
          if (target.video) {
            onSelectVideo(target.video);
          } else {
            onLocationChange(target.lat, target.lng, `Target (${target.lat.toFixed(2)}°, ${target.lng.toFixed(2)}°)`);
          }
        }
      }, 220);
    }
  };

  // Continuous Smooth Space Zooming with Full Dynamic Range (Surface 114.0 to Deep Space 8000+)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    const currentDist = targetCameraDistanceRef.current;
    // Logarithmic-scaled adaptive zoom step for ultra smooth navigation
    const zoomFactor = Math.max(0.08, currentDist * 0.0016);
    targetCameraDistanceRef.current += e.deltaY * zoomFactor;

    if (!focusedBody || focusedBody.id === 'earth') {
      targetCameraDistanceRef.current = Math.max(114.0, Math.min(8000, targetCameraDistanceRef.current));
    } else {
      const minD = Math.max(focusedBody.radius * 1.15, 6);
      targetCameraDistanceRef.current = Math.max(minD, Math.min(8000, targetCameraDistanceRef.current));
    }
  };

  const handleZoomIn = () => {
    const current = targetCameraDistanceRef.current;
    const step = Math.max(12, current * 0.25);
    if (!focusedBody || focusedBody.id === 'earth') {
      targetCameraDistanceRef.current = Math.max(114.0, current - step);
    } else {
      const minD = Math.max(focusedBody.radius * 1.15, 6);
      targetCameraDistanceRef.current = Math.max(minD, current - step);
    }
  };

  const handleZoomOut = () => {
    const current = targetCameraDistanceRef.current;
    const step = Math.max(20, current * 0.30);
    targetCameraDistanceRef.current = Math.min(8000, current + step);
  };

  const handleZoomSurface = () => {
    targetCameraDistanceRef.current = 116.0;
  };

  const handleZoomCosmos = () => {
    targetCameraDistanceRef.current = 3500;
  };

  const handleResetOrbit = () => {
    targetCameraDistanceRef.current = 280;
  };

  return (
    <div
      className="relative w-full h-full bg-[#000003] overflow-hidden select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClickDirect}
    >
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Banner OSINT Global Sphere Mode */}
      <div className="absolute top-3 left-3 z-20 pointer-events-none font-mono hidden sm:block">
        <div className="px-3.5 py-1.5 rounded-xl bg-[#040814]/90 border border-cyan-500/30 text-slate-200 text-xs backdrop-blur-2xl shadow-[0_0_25px_rgba(6,182,212,0.25)] flex items-center space-x-2">
          <GlobeIcon className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-cyan-300">OSINT 3D EARTH GLOBE</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400 text-[11px]">
            Double-click Earth to dive • Drag to rotate
          </span>
        </div>
      </div>

      {/* Floating Orbital Space Search Omnibar (Search any location from outer space & dive into Earth) */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-2 sm:px-0">
        <div className="bg-[#04091a]/92 border border-cyan-500/40 rounded-2xl p-1.5 backdrop-blur-2xl shadow-[0_0_35px_rgba(6,182,212,0.3)] transition-all">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSpaceSearchSubmit();
            }}
            className="flex items-center space-x-1.5"
          >
            <div className="relative flex-1 flex items-center">
              <div className="absolute left-3 pointer-events-none text-cyan-400 flex items-center">
                {isSearchingSpaceSuggestions ? (
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                ) : (
                  <Search className="w-4 h-4 text-cyan-400" />
                )}
              </div>
              <input
                type="text"
                value={spaceSearchQuery}
                onChange={e => {
                  setSpaceSearchQuery(e.target.value);
                  setShowSpaceSuggestions(true);
                }}
                onFocus={() => {
                  if (spaceSuggestions.length > 0) setShowSpaceSuggestions(true);
                }}
                placeholder="ابحث عن أي موقع من الفضاء (أكادير، كازا، باريس...)"
                className="w-full bg-[#02050e]/90 text-xs sm:text-sm text-white placeholder-slate-400 pl-9 pr-8 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
              />
              {spaceSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSpaceSearchQuery('');
                    setSpaceSuggestions([]);
                    setShowSpaceSuggestions(false);
                  }}
                  className="absolute right-2.5 text-slate-400 hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={!spaceSearchQuery.trim() || isSpaceDiving}
              className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all shadow-lg select-none shrink-0 ${
                spaceSearchQuery.trim() && !isSpaceDiving
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)] cursor-pointer active:scale-95'
                  : 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-white/5'
              }`}
              title="انطلق واهبط مباشرة إلى الموقع على كوكب الأرض"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span className="font-extrabold tracking-tight">هبوط مداري</span>
            </button>
          </form>

          {/* Quick Preset Location Chips for Instant 0ms Warp Dive */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pt-1.5 px-1 mt-0.5 text-[11px] font-sans">
            <span className="text-[10px] text-cyan-400/80 font-bold shrink-0 flex items-center space-x-1">
              <Zap className="w-3 h-3 text-amber-400 inline" />
              <span>هبوط سريع:</span>
            </span>
            {ORBITAL_QUICK_TARGETS.slice(0, 7).map(preset => (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  setSpaceSearchQuery(`${preset.arabic} (${preset.name})`);
                  startCinematicDescent(preset.lat, preset.lng, `${preset.arabic} (${preset.name})`);
                }}
                className="shrink-0 px-2 py-0.5 rounded-lg bg-slate-900/90 hover:bg-cyan-950 border border-white/10 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-200 transition text-[10px] flex items-center space-x-1"
              >
                <span>{preset.flag}</span>
                <span className="font-semibold">{preset.arabic}</span>
              </button>
            ))}
          </div>

          {/* Auto Suggestions Dropdown List */}
          {showSpaceSuggestions && spaceSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#030712]/95 border border-cyan-500/40 rounded-2xl p-1.5 backdrop-blur-2xl shadow-2xl z-50 max-h-60 overflow-y-auto space-y-1">
              {spaceSuggestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSpaceSearchQuery(item.name);
                    setShowSpaceSuggestions(false);
                    startCinematicDescent(item.lat, item.lng, item.name);
                  }}
                  className="w-full text-left p-2 rounded-xl hover:bg-cyan-500/20 border border-transparent hover:border-cyan-500/30 transition flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <div className="p-1 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 group-hover:scale-110 transition">
                      <Rocket className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-white group-hover:text-cyan-200 truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {item.display_name}
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 shrink-0 ml-2">
                    DIVE 🚀
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Right Action Controls & Orbital Layers HUD */}
      <div className="absolute top-3 right-3 z-20 flex items-center space-x-2 font-mono">
        {/* Orbital Satellites Toggle */}
        <div className="hidden lg:flex items-center space-x-1.5 bg-[#050a16]/85 border border-white/[0.1] p-1 rounded-xl backdrop-blur-xl">
          <button
            onClick={() => setShowSatellites(!showSatellites)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition ${
              showSatellites
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Satellites (ISS, Hubble, Fleet)"
          >
            <SatelliteIcon className="w-3 h-3" />
            <span>SATS</span>
          </button>
        </div>

        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center space-x-1.5 backdrop-blur-xl shadow-xl ${
            autoRotate
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              : 'bg-[#050a16]/85 text-slate-400 border-white/[0.1] hover:text-white'
          }`}
          title="Toggle Planetary Spin"
        >
          <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">ROTATE</span>
        </button>

        {focusedBody && focusedBody.id !== 'earth' && (
          <button
            onClick={() => handleFocusBody(null)}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600/90 hover:bg-blue-500 text-white text-xs font-extrabold shadow-[0_0_20px_rgba(59,130,246,0.5)] flex items-center space-x-1.5 transition hover:scale-105 active:scale-95"
            title="Fly back to Earth"
          >
            <GlobeIcon className="w-3.5 h-3.5 text-cyan-200" />
            <span>RETURN TO EARTH</span>
          </button>
        )}

        <button
          onClick={() => onTransitionTo2D(lat, lng, 13)}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-extrabold shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center space-x-1.5 transition hover:scale-105 active:scale-95"
          title="Return to 2D High-Definition Tactical Map"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>DIVE TO 2D FLAT MAP</span>
        </button>
      </div>

      {/* Hover Planet Tooltip */}
      {hoveredBody && !focusedBody && (
        <div
          className="absolute z-30 pointer-events-none sentinel-glass-cyan rounded-xl px-3 py-2 shadow-2xl font-mono animate-in fade-in zoom-in-95 duration-100"
          style={{
            left: Math.min(window.innerWidth - 220, mousePos.x + 15),
            top: Math.min(window.innerHeight - 100, mousePos.y + 15)
          }}
        >
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: hoveredBody.color, color: hoveredBody.color }} />
            <span className="font-extrabold text-white text-xs">{hoveredBody.name} ({hoveredBody.arabicName})</span>
          </div>
          <p className="text-[10px] text-cyan-300 mt-0.5">{hoveredBody.subtitle}</p>
          <p className="text-[9px] text-slate-400">Dist. from Sun: {hoveredBody.distanceFromSun}</p>
        </div>
      )}

      {/* Hover Intel Tooltip */}
      {hoveredVideo && (
        <div
          className="absolute z-30 pointer-events-auto max-w-xs w-72 sentinel-glass-cyan rounded-xl p-2.5 shadow-2xl animate-in fade-in zoom-in-95 duration-100 font-mono"
          style={{
            left: Math.min(window.innerWidth - 300, mousePos.x + 15),
            top: Math.min(window.innerHeight - 150, mousePos.y + 15)
          }}
        >
          <div className="flex items-center space-x-1.5 text-[9px] text-cyan-400 font-bold uppercase">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Orbital Video Intel</span>
          </div>
          <h4 className="text-[11px] font-bold text-white line-clamp-1 mt-1">
            {hoveredVideo.title}
          </h4>
          <p className="text-[9px] text-slate-400 truncate">{hoveredVideo.author}</p>
          <div className="flex items-center justify-between text-[9px] text-cyan-300 mt-1">
            <span>📍 {hoveredVideo.lat.toFixed(2)}°, {hoveredVideo.lng.toFixed(2)}°</span>
            <span className="text-amber-400 font-bold">{hoveredVideo.published_year || 2026}</span>
          </div>
          <button
            onClick={() => onSelectVideo(hoveredVideo)}
            className="w-full mt-2 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[10px] rounded flex items-center justify-center space-x-1 transition"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Open Intel Briefing</span>
          </button>
        </div>
      )}

      {/* Focused Celestial Body Deep Space Telemetry Panel */}
      {focusedBody && (
        <div className="absolute top-16 left-3 z-30 w-80 sm:w-96 sentinel-glass-cyan rounded-2xl p-4 shadow-2xl font-mono text-slate-200 animate-in fade-in slide-in-from-left-4 duration-200 border border-cyan-500/40">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2.5">
              <span
                className="w-4 h-4 rounded-full shadow-[0_0_12px_currentColor]"
                style={{ backgroundColor: focusedBody.color, color: focusedBody.color }}
              />
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                  <span>{focusedBody.name}</span>
                  <span className="text-cyan-400 text-xs font-semibold">({focusedBody.arabicName})</span>
                </h3>
                <p className="text-[11px] text-cyan-300">{focusedBody.subtitle}</p>
              </div>
            </div>
            <button
              onClick={() => handleFocusBody(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              title="Close Celestial Telemetry"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Telemetry Tabs */}
          <div className="flex items-center space-x-1 mt-3 bg-black/40 p-1 rounded-xl border border-white/10 text-[10px] font-bold">
            <button
              onClick={() => setActiveTabTelemetry('overview')}
              className={`flex-1 py-1 rounded-lg text-center transition ${
                activeTabTelemetry === 'overview'
                  ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              OVERVIEW
            </button>
            <button
              onClick={() => setActiveTabTelemetry('atmosphere')}
              className={`flex-1 py-1 rounded-lg text-center transition ${
                activeTabTelemetry === 'atmosphere'
                  ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ATMOSPHERE
            </button>
            <button
              onClick={() => setActiveTabTelemetry('orbit')}
              className={`flex-1 py-1 rounded-lg text-center transition ${
                activeTabTelemetry === 'orbit'
                  ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ORBITAL STATS
            </button>
          </div>

          {/* Tab 1: Overview */}
          {activeTabTelemetry === 'overview' && (
            <div className="mt-3 space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-900/80 p-2 rounded-xl border border-white/5">
                  <span className="text-[9px] text-slate-400 block">DIAMETER</span>
                  <span className="font-extrabold text-white">{focusedBody.diameter}</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-xl border border-white/5">
                  <span className="text-[9px] text-slate-400 block">AVG TEMP</span>
                  <span className="font-extrabold text-amber-300">{focusedBody.temperature}</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-xl border border-white/5">
                  <span className="text-[9px] text-slate-400 block">GRAVITY</span>
                  <span className="font-extrabold text-emerald-300">{focusedBody.gravity}</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-xl border border-white/5">
                  <span className="text-[9px] text-slate-400 block">KNOWN MOONS</span>
                  <span className="font-extrabold text-purple-300">{focusedBody.moons}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-[11px] text-slate-300 leading-relaxed bg-black/30 p-2.5 rounded-xl border border-white/5">
                {focusedBody.description}
              </p>
            </div>
          )}

          {/* Tab 2: Atmosphere & Composition */}
          {activeTabTelemetry === 'atmosphere' && (
            <div className="mt-3 space-y-2 text-xs">
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] text-cyan-400 font-bold block">ATMOSPHERIC COMPOSITION</span>
                <p className="text-[11px] text-slate-300">{focusedBody.atmosphere}</p>
              </div>

              {focusedBody.facts && focusedBody.facts.length > 0 && (
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[10px] text-amber-400 font-bold block">SCIENTIFIC HIGHLIGHTS</span>
                  <ul className="space-y-1 text-[11px] text-slate-300 list-disc list-inside">
                    {focusedBody.facts.map((fact, idx) => (
                      <li key={idx}>{fact}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Orbital Mechanics */}
          {activeTabTelemetry === 'orbit' && (
            <div className="mt-3 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-900/80 p-2 rounded-xl border border-white/5">
                  <span className="text-[9px] text-slate-400 block">ORBITAL PERIOD</span>
                  <span className="font-extrabold text-cyan-300">{focusedBody.orbitalPeriod}</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-xl border border-white/5">
                  <span className="text-[9px] text-slate-400 block">DAY LENGTH</span>
                  <span className="font-extrabold text-blue-300">{focusedBody.dayLength}</span>
                </div>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-white/5">
                <span className="text-[9px] text-slate-400 block">DISTANCE FROM SUN</span>
                <span className="font-extrabold text-amber-300 text-xs">{focusedBody.distanceFromSun}</span>
              </div>
            </div>
          )}

          {/* Quick Actions Footer */}
          <div className="mt-3.5 pt-2.5 border-t border-white/10 flex items-center justify-between space-x-2">
            <button
              onClick={() => handleFocusBody(null)}
              className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold transition flex items-center justify-center space-x-1"
            >
              <GlobeIcon className="w-3 h-3 text-cyan-400" />
              <span>RETURN TO EARTH</span>
            </button>
            <button
              onClick={() => onTransitionTo2D(lat, lng, 13)}
              className="flex-1 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[10px] font-extrabold transition flex items-center justify-center space-x-1"
            >
              <Layers className="w-3 h-3" />
              <span>DIVE TO MAP</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Telemetry Ribbon */}
      <div className="absolute bottom-2 left-3 right-3 z-20 pointer-events-none flex items-center justify-between font-mono text-[10px]">
        <div className="px-3 py-1 rounded-lg bg-[#040814]/85 border border-white/[0.08] text-slate-400 backdrop-blur-2xl flex items-center space-x-3 pointer-events-auto shadow-2xl">
          <div className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-slate-500">TARGET:</span>
            <span className="text-cyan-400 font-bold">
              {targetName.split(',')[0]} ({lat.toFixed(2)}°, {lng.toFixed(2)}°)
            </span>
          </div>
          <div className="text-slate-700">|</div>
          <div>
            <span className="text-slate-500">NODES:</span>
            <span className="text-amber-400 font-bold"> {visibleVideos.length}</span>
          </div>
          <div className="hidden sm:block text-slate-700">|</div>
          <div className="hidden sm:block text-slate-400">
            RADAR: <span className="text-cyan-300">{radiusKm} KM</span>
          </div>
          <div className="hidden md:block text-slate-700">|</div>
          <div className="hidden md:block text-slate-400">
            3D ENGINE: <span className="text-emerald-400 font-semibold">ONLINE</span>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center space-x-1.5">
          <button
            onClick={() => onTransitionTo2D(lat, lng, 13)}
            className="px-2.5 py-1 rounded-lg bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-400/50 text-cyan-300 text-[10px] font-bold shadow-xl backdrop-blur-xl transition"
            title="Dive into 2D Tactical View"
          >
            + DIVE TO 2D FLAT VIEW
          </button>
        </div>
      </div>

      {/* 3D Space Dynamic Zoom Controls (Right HUD) */}
      <div className="absolute bottom-14 right-3 z-20 flex flex-col space-y-1 font-mono select-none pointer-events-auto">
        <button
          onClick={handleZoomSurface}
          className="px-2 py-1 rounded-lg bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-400/50 text-cyan-300 text-[9px] font-bold shadow-xl backdrop-blur-xl transition flex items-center justify-center space-x-1"
          title="Zoom into close orbital surface altitude without clipping"
        >
          <Crosshair className="w-3 h-3 text-cyan-400" />
          <span>SURFACE</span>
        </button>

        <button
          onClick={handleZoomIn}
          className="p-2 rounded-lg bg-slate-950/80 hover:bg-slate-900 border border-white/[0.08] text-slate-300 hover:text-white shadow-xl backdrop-blur-xl transition flex items-center justify-center"
          title="Zoom In Closer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleResetOrbit}
          className="px-1.5 py-0.5 rounded bg-slate-900/90 hover:bg-slate-800 border border-white/[0.08] text-[9px] font-bold text-center text-cyan-400 transition"
          title="Reset to default orbital altitude (280 units)"
        >
          RESET
        </button>

        <button
          onClick={handleZoomOut}
          className="p-2 rounded-lg bg-slate-950/80 hover:bg-slate-900 border border-white/[0.08] text-slate-300 hover:text-white shadow-xl backdrop-blur-xl transition flex items-center justify-center"
          title="Zoom Out to Outer Space"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Cinematic Hypersonic Re-entry Descent HUD Overlay */}
      {descentProgress !== null && (
        <div className="absolute inset-0 pointer-events-none z-50 flex flex-col items-center justify-between p-8 font-mono animate-in fade-in duration-200">
          {/* Top Flight Vector Header */}
          <div className="flex items-center space-x-4 bg-[#030712]/90 border border-cyan-400/50 px-5 py-2 rounded-2xl backdrop-blur-2xl shadow-[0_0_40px_rgba(6,182,212,0.4)]">
            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
            <div className="text-xs">
              <span className="text-cyan-400 font-black tracking-widest uppercase">
                HYPERSONIC ORBITAL DESCENT // RE-ENTRY IN PROGRESS
              </span>
              <span className="mx-2 text-slate-600">|</span>
              <span className="text-white font-bold">{targetName.split(',')[0]}</span>
            </div>
            <div className="text-cyan-300 font-extrabold text-xs">
              ALT: {Math.max(12, Math.round((1 - descentProgress) * 420))} KM
            </div>
          </div>

          {/* Center Precision Tactical Reticle */}
          <div className="relative flex items-center justify-center">
            {/* Outer Rotating Radar Ring */}
            <div className="w-52 h-52 rounded-full border border-cyan-400/30 border-dashed animate-spin flex items-center justify-center" />
            {/* Middle Reticle Ring */}
            <div className="absolute w-36 h-36 rounded-full border-2 border-cyan-400/70 animate-pulse flex items-center justify-center">
              {/* Corner crosshairs */}
              <div className="absolute top-0 w-3 h-0.5 bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
              <div className="absolute bottom-0 w-3 h-0.5 bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
              <div className="absolute left-0 h-3 w-0.5 bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
              <div className="absolute right-0 h-3 w-0.5 bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
            </div>
            {/* Center Lock Dot */}
            <div className="absolute w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_15px_#22d3ee]" />
            
            {/* Atmospheric Entry Heat / Velocity Flares */}
            <div 
              className="absolute inset-0 -m-16 rounded-full border border-amber-400/40 bg-radial from-transparent to-amber-500/10 transition-opacity duration-300"
              style={{ opacity: Math.sin(descentProgress * Math.PI) * 0.8 }}
            />
          </div>

          {/* Bottom Telemetry & Progress Indicator */}
          <div className="w-full max-w-md bg-[#030712]/90 border border-cyan-500/40 p-3.5 rounded-2xl backdrop-blur-2xl shadow-[0_0_30px_rgba(6,182,212,0.3)] space-y-2">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">VECTOR: <span className="text-cyan-300 font-bold">{lat.toFixed(4)}° N, {lng.toFixed(4)}° E</span></span>
              <span className="text-amber-400 font-bold">MACH {Math.max(1, 24 - descentProgress * 23).toFixed(1)}</span>
              <span className="text-cyan-400 font-black">{Math.round(descentProgress * 100)}%</span>
            </div>
            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/[0.1]">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-amber-400 transition-all duration-75"
                style={{ width: `${Math.round(descentProgress * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  X,
  Youtube,
  Copy,
  Check,
  ExternalLink,
  MapPin,
  Compass,
  Sparkles,
  Shield,
  Clock,
  Eye,
  Crosshair
} from 'lucide-react';
import { VideoItem } from '../types';

interface VideoModalProps {
  video: VideoItem | null;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({ video, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!video) return null;

  const handleCopyCoords = () => {
    const text = `${video.lat}, ${video.lng}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const osmUrl = `https://www.openstreetmap.org/?mlat=${video.lat}&mlon=${video.lng}#map=15/${video.lat}/${video.lng}`;
  const gmapsUrl = `https://www.google.com/maps?q=${video.lat},${video.lng}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 font-mono select-text">
      <div className="bg-[#050a16] border border-cyan-500/30 rounded-2xl max-w-3xl w-full overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_25px_rgba(6,182,212,0.15)] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-4 py-3 bg-[#070e20] border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0 pr-4">
            <div className="p-1.5 rounded-lg bg-red-950/80 border border-red-500/40 text-red-400">
              <Youtube className="w-4 h-4" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-lg">{video.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3.5">
          {/* YouTube Video Player Embed */}
          <div className="relative pb-[56.25%] h-0 bg-black rounded-xl overflow-hidden border border-white/[0.08] shadow-inner">
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${video.video_id}?autoplay=1&rel=0`}
              title={video.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          {/* OSINT Metadata Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-[#080f24]/70 p-2.5 rounded-xl border border-white/[0.06]">
              <span className="text-slate-500 text-[9px] block font-bold uppercase tracking-wider">
                AUTHOR // CHANNEL
              </span>
              <span className="text-cyan-400 font-bold truncate block mt-0.5">{video.author}</span>
            </div>

            <div className="bg-[#080f24]/70 p-2.5 rounded-xl border border-white/[0.06]">
              <span className="text-slate-500 text-[9px] block font-bold uppercase tracking-wider">
                COORDINATES & BEARING
              </span>
              <span className="text-slate-200 font-medium truncate block mt-0.5">
                {video.lat.toFixed(4)}, {video.lng.toFixed(4)} {video.bearing_deg !== undefined ? `• ${video.bearing_deg}°` : ''}
              </span>
            </div>

            <div className="bg-[#080f24]/70 p-2.5 rounded-xl border border-white/[0.06]">
              <span className="text-slate-500 text-[9px] block font-bold uppercase tracking-wider">
                RADAR & SOURCE
              </span>
              <span className="text-amber-400 font-bold block mt-0.5 truncate">
                {video.distance_km} km • {video.geotag_source.split(' ')[0]}
              </span>
            </div>

            <div className="bg-[#080f24]/70 p-2.5 rounded-xl border border-white/[0.06]">
              <span className="text-slate-500 text-[9px] block font-bold uppercase tracking-wider">
                DATE & EPOCH
              </span>
              <span className="text-slate-300 truncate block mt-0.5 text-[11px] font-bold">
                {video.published_year ? `Year ${video.published_year}` : video.published_time || '2026'} • {video.views}
              </span>
            </div>
          </div>

          {/* OSINT Actions Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.06] text-xs">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleCopyCoords}
                className="px-3 py-1.5 bg-[#080f24] hover:bg-slate-800 text-slate-200 border border-white/[0.1] rounded-lg flex items-center space-x-1.5 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                <span>{copied ? 'Copied Coordinates!' : 'Copy GPS'}</span>
              </button>

              <a
                href={osmUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-[#080f24] hover:bg-slate-800 text-cyan-300 border border-cyan-500/20 rounded-lg flex items-center space-x-1.5 transition"
              >
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>OpenStreetMap</span>
              </a>

              <a
                href={gmapsUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-[#080f24] hover:bg-slate-800 text-amber-300 border border-amber-500/20 rounded-lg flex items-center space-x-1.5 transition"
              >
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>Google Maps</span>
              </a>
            </div>

            <a
              href={video.url}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold flex items-center space-x-1.5 transition shadow-[0_0_15px_rgba(239,68,68,0.3)]"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Watch on YouTube</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

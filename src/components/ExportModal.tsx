import React, { useState } from 'react';
import {
  X,
  Download,
  FileJson,
  Layers,
  FileSpreadsheet,
  Globe,
  Database,
  CheckCircle2,
  Code,
  ShieldCheck
} from 'lucide-react';
import { VideoItem } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  videos: VideoItem[];
  targetName: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  videos,
  targetName
}) => {
  const [downloadedType, setDownloadedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const downloadFile = (content: string, filename: string, mimeType: string, typeKey: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadedType(typeKey);
    setTimeout(() => setDownloadedType(null), 2500);
  };

  // 1. Analyst-Grade GeoJSON with Rich Extended Feature Properties
  const handleExportGeoJSON = () => {
    const geojson = {
      type: 'FeatureCollection',
      name: `GeoSentinel_OSINT_${targetName.replace(/\W+/g, '_')}`,
      crs: {
        type: 'name',
        properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' }
      },
      metadata: {
        generated_at: new Date().toISOString(),
        total_features: videos.length,
        target_location: targetName,
        classification: 'UNCLASSIFIED // OSINT'
      },
      features: videos.map((v, idx) => ({
        type: 'Feature',
        id: v.video_id || `geo_${idx}`,
        geometry: {
          type: 'Point',
          coordinates: [v.lng, v.lat]
        },
        properties: {
          video_id: v.video_id,
          title: v.title,
          author: v.author,
          channel_id: v.channel_id,
          watch_url: v.url,
          embed_url: v.embed_url,
          distance_km: v.distance_km,
          distance_miles: v.distance_miles,
          published_time: v.published_time,
          published_year: v.published_year || 2026,
          epoch_label: v.epoch_label || (v.published_year && v.published_year <= 2014 ? '2010–2014 Legacy Archive' : 'Recent'),
          views: v.views,
          duration: v.duration,
          thumbnail: v.thumbnail,
          bearing_deg: v.bearing_deg || 0,
          fov_deg: v.fov_deg || 65,
          geotag_source: v.geotag_source
        }
      }))
    };

    downloadFile(
      JSON.stringify(geojson, null, 2),
      `geosentinel_${targetName.replace(/\W+/g, '_').toLowerCase()}_${Date.now()}.geojson`,
      'application/geo+json',
      'geojson'
    );
  };

  // 2. Google Earth Pro 3D KML with Placemark LookAt & POV Heading
  const handleExportKML = () => {
    const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2">
  <Document>
    <name>GeoSentinel 3D OSINT Telemetry - ${targetName}</name>
    <description><![CDATA[Tactical Geospatial Reconnaissance Package. Contains ${videos.length} geotagged intelligence items.]]></description>
    <Style id="osintPin">
      <IconStyle>
        <scale>1.2</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/paddle/red-circle.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>0.9</scale>
      </LabelStyle>
    </Style>
    ${videos
      .map(
        v => `
    <Placemark>
      <name><![CDATA[${v.title.replace(/[<>&]/g, '')}]]></name>
      <styleUrl>#osintPin</styleUrl>
      <description><![CDATA[
        <div style="font-family:sans-serif;font-size:13px;">
          <h3>${v.title}</h3>
          <p><b>Author / Channel:</b> ${v.author}</p>
          <p><b>Distance from Target:</b> ${v.distance_km} km (${v.distance_miles} mi)</p>
          <p><b>Estimated Camera Bearing:</b> ${v.bearing_deg || 0}° POV</p>
          <p><b>Published:</b> ${v.published_time} | <b>Views:</b> ${v.views}</p>
          <p><a href="${v.url}" target="_blank">Watch Video on YouTube</a></p>
        </div>
      ]]></description>
      <LookAt>
        <longitude>${v.lng}</longitude>
        <latitude>${v.lat}</latitude>
        <altitude>0</altitude>
        <heading>${v.bearing_deg || 0}</heading>
        <tilt>60</tilt>
        <range>450</range>
      </LookAt>
      <Point>
        <coordinates>${v.lng},${v.lat},0</coordinates>
      </Point>
    </Placemark>`
      )
      .join('')}
  </Document>
</kml>`;

    downloadFile(
      kml,
      `geosentinel_${targetName.replace(/\W+/g, '_').toLowerCase()}_${Date.now()}.kml`,
      'application/vnd.google-earth.kml+xml',
      'kml'
    );
  };

  // 3. Palantir & Maltego Compatible CSV
  const handleExportCSV = () => {
    const headers = [
      'Entity_ID',
      'Entity_Type',
      'Title',
      'Author_Channel',
      'Latitude',
      'Longitude',
      'Distance_KM',
      'Distance_Miles',
      'Camera_Bearing_Deg',
      'Published_Time',
      'Published_Year',
      'Epoch_Classification',
      'Geotag_Source',
      'Views',
      'Duration',
      'YouTube_URL',
      'Thumbnail_URL'
    ];

    const rows = videos.map(v => [
      `"${v.video_id}"`,
      `"OSINT.GeotaggedMedia"`,
      `"${(v.title || '').replace(/"/g, '""')}"`,
      `"${(v.author || '').replace(/"/g, '""')}"`,
      v.lat,
      v.lng,
      v.distance_km,
      v.distance_miles,
      v.bearing_deg || 0,
      `"${v.published_time}"`,
      v.published_year || 2026,
      `"${v.epoch_label || (v.published_year && v.published_year <= 2014 ? '2010–2014 Legacy Archive' : '2024–2026 Recent')}"`,
      `"${v.geotag_source || 'OSINT Scanner'}"`,
      `"${v.views}"`,
      `"${v.duration}"`,
      `"${v.url}"`,
      `"${v.thumbnail}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    downloadFile(
      csvContent,
      `geosentinel_intel_${targetName.replace(/\W+/g, '_').toLowerCase()}_${Date.now()}.csv`,
      'text/csv',
      'csv'
    );
  };

  // 4. Raw JSON Structured Pipeline Export
  const handleExportJSON = () => {
    const bundle = {
      export_timestamp: new Date().toISOString(),
      target_location: targetName,
      intel_count: videos.length,
      dataset: videos
    };

    downloadFile(
      JSON.stringify(bundle, null, 2),
      `geosentinel_dataset_${targetName.replace(/\W+/g, '_').toLowerCase()}_${Date.now()}.json`,
      'application/json',
      'json'
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 font-mono select-text">
      <div className="bg-[#050a16] border border-cyan-500/30 rounded-2xl max-w-lg w-full overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_25px_rgba(6,182,212,0.15)] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-[#070e20] border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                Geospatial Telemetry Export
              </h3>
              <p className="text-[10px] text-slate-400">{targetName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <p className="text-xs text-slate-300">
            Export <span className="text-cyan-400 font-bold">{videos.length} discovered items</span> into analyst-standard formats for GIS, Google Earth Pro, Maltego, or custom intelligence pipelines:
          </p>

          <div className="grid grid-cols-1 gap-2">
            {/* GeoJSON */}
            <button
              onClick={handleExportGeoJSON}
              disabled={videos.length === 0}
              className="w-full text-left p-3 rounded-xl bg-[#080f24]/70 hover:bg-cyan-950/40 border border-white/[0.06] hover:border-cyan-500/50 transition-all flex items-center justify-between group disabled:opacity-50"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-cyan-950/90 border border-cyan-500/40 text-cyan-400">
                  <FileJson className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-bold text-white group-hover:text-cyan-300">GeoJSON Standard</h4>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">GIS Ready</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Compatible with QGIS, ArcGIS Pro, Mapbox Studio & Kepler.gl</p>
                </div>
              </div>
              {downloadedType === 'geojson' ? (
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              ) : (
                <Download className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
              )}
            </button>

            {/* Google Earth Pro 3D KML */}
            <button
              onClick={handleExportKML}
              disabled={videos.length === 0}
              className="w-full text-left p-3 rounded-xl bg-[#080f24]/70 hover:bg-blue-950/40 border border-white/[0.06] hover:border-blue-500/50 transition-all flex items-center justify-between group disabled:opacity-50"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-950/90 border border-blue-500/40 text-blue-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-bold text-white group-hover:text-blue-300">Google Earth Pro (3D KML)</h4>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-400 border border-blue-500/30">3D Tilt & FOV</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Includes camera POV headings, look-at angles, and fly-to telemetry</p>
                </div>
              </div>
              {downloadedType === 'kml' ? (
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
              ) : (
                <Download className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
              )}
            </button>

            {/* Maltego & Palantir CSV */}
            <button
              onClick={handleExportCSV}
              disabled={videos.length === 0}
              className="w-full text-left p-3 rounded-xl bg-[#080f24]/70 hover:bg-amber-950/40 border border-white/[0.06] hover:border-amber-500/50 transition-all flex items-center justify-between group disabled:opacity-50"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-amber-950/90 border border-amber-500/40 text-amber-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-bold text-white group-hover:text-amber-300">Palantir / Maltego CSV</h4>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-500/30">Spreadsheet</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Entity structured for link analysis, Python Pandas & Excel</p>
                </div>
              </div>
              {downloadedType === 'csv' ? (
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
              ) : (
                <Download className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
              )}
            </button>

            {/* Raw JSON */}
            <button
              onClick={handleExportJSON}
              disabled={videos.length === 0}
              className="w-full text-left p-3 rounded-xl bg-[#080f24]/70 hover:bg-purple-950/40 border border-white/[0.06] hover:border-purple-500/50 transition-all flex items-center justify-between group disabled:opacity-50"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-purple-950/90 border border-purple-500/40 text-purple-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-bold text-white group-hover:text-purple-300">Raw JSON Dataset</h4>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Full unprocessed telemetry payload for custom script pipelines</p>
                </div>
              </div>
              {downloadedType === 'json' ? (
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
              ) : (
                <Download className="w-4 h-4 text-slate-500 group-hover:text-purple-400" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

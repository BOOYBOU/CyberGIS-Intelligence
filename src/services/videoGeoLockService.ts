import { VideoItem } from '../types';
import { isCoordinateInWater, resolveInhabitedLandCoordinate } from './landGeotagResolver';

const STORAGE_KEY = 'osint_permanent_video_geolocks_v1';

interface LockedGeoRecord {
  lat: number;
  lng: number;
  bearing_deg?: number;
  fov_deg?: number;
  timestamp: number;
}

class VideoGeoLockService {
  private cache: Map<string, LockedGeoRecord> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null) {
          Object.keys(parsed).forEach(id => {
            const rec = parsed[id];
            if (rec && typeof rec.lat === 'number' && typeof rec.lng === 'number') {
              this.cache.set(id, rec);
            }
          });
        }
      }
    } catch (e) {
      console.warn('Could not load locked video coordinates from localStorage:', e);
    }
  }

  private saveToStorage() {
    try {
      const obj: Record<string, LockedGeoRecord> = {};
      this.cache.forEach((val, key) => {
        obj[key] = val;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch (e) {
      console.warn('Could not save locked video coordinates to localStorage:', e);
    }
  }

  /**
   * Permanently locks incoming video pins to immutable geographic coordinates.
   * Rule 1: If a video is already placed on land, leaves it completely untouched.
   * Rule 2 & 3: If a video is in the sea/water, re-parses metadata, moves it to true inhabited land, and locks it.
   */
  public lockAndSyncVideos(videos: VideoItem[], anchorLat = 30.4278, anchorLng = -9.5981, locationName = ''): VideoItem[] {
    let hasNewLocks = false;

    const lockedVideos = videos.map(vid => {
      const existing = this.cache.get(vid.video_id);

      if (existing) {
        // Strict Rule 1: If already on land, keep 100% untouched
        if (!isCoordinateInWater(existing.lat, existing.lng)) {
          return {
            ...vid,
            lat: existing.lat,
            lng: existing.lng,
            bearing_deg: existing.bearing_deg !== undefined ? existing.bearing_deg : vid.bearing_deg
          };
        }

        // Strict Rule 2 & 3: If in sea, resolve to true inhabited land
        const landFix = resolveInhabitedLandCoordinate(
          vid.video_id,
          vid.title,
          vid.description_snippet || '',
          vid.author || '',
          anchorLat,
          anchorLng,
          locationName
        );

        this.cache.set(vid.video_id, {
          lat: landFix.lat,
          lng: landFix.lng,
          bearing_deg: landFix.bearing_deg !== undefined ? landFix.bearing_deg : existing.bearing_deg,
          fov_deg: vid.fov_deg,
          timestamp: Date.now()
        });
        hasNewLocks = true;

        return {
          ...vid,
          lat: landFix.lat,
          lng: landFix.lng,
          bearing_deg: landFix.bearing_deg !== undefined ? landFix.bearing_deg : vid.bearing_deg,
          geotag_source: landFix.geotag_source
        };
      }

      // First time seeing this video
      let finalLat = vid.lat;
      let finalLng = vid.lng;
      let finalBearing = vid.bearing_deg;
      let finalSource = vid.geotag_source;

      // Check if newly mapped video is in water
      if (isCoordinateInWater(finalLat, finalLng)) {
        const landFix = resolveInhabitedLandCoordinate(
          vid.video_id,
          vid.title,
          vid.description_snippet || '',
          vid.author || '',
          anchorLat,
          anchorLng,
          locationName
        );
        finalLat = landFix.lat;
        finalLng = landFix.lng;
        finalBearing = landFix.bearing_deg !== undefined ? landFix.bearing_deg : vid.bearing_deg;
        finalSource = landFix.geotag_source;
      }

      if (typeof finalLat === 'number' && typeof finalLng === 'number') {
        this.cache.set(vid.video_id, {
          lat: finalLat,
          lng: finalLng,
          bearing_deg: finalBearing,
          fov_deg: vid.fov_deg,
          timestamp: Date.now()
        });
        hasNewLocks = true;
      }

      return {
        ...vid,
        lat: finalLat,
        lng: finalLng,
        bearing_deg: finalBearing,
        geotag_source: finalSource
      };
    });

    if (hasNewLocks) {
      this.saveToStorage();
    }

    return lockedVideos;
  }

  /**
   * Retrieves locked coordinates for a single video ID if present.
   */
  public getLockedCoords(videoId: string): { lat: number; lng: number; bearing_deg?: number } | null {
    const record = this.cache.get(videoId);
    if (record) {
      return { lat: record.lat, lng: record.lng, bearing_deg: record.bearing_deg };
    }
    return null;
  }
}

export const videoGeoLockService = new VideoGeoLockService();

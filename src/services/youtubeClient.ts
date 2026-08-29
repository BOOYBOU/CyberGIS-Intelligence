/**
 * Modernized YouTube API v3 Client Module
 * ========================================
 * Replaces and modernizes legacy jQuery-based wrappers (e.g. mattwright324 youtube-api-v3.js).
 * 
 * Features:
 * - Pure ES6 / TypeScript async-await architecture (zero jQuery dependency)
 * - Automatic session-persistent quotaUser generation
 * - Base URL configuration (Google APIs or server-side Flask proxy)
 * - Multi-part video metadata enrichment (snippet, contentDetails, statistics)
 * - Resilient error handling, rate-limiting detection, and zero-key fallback hooks
 */

export interface YouTubeSearchItem {
  id: {
    kind: string;
    videoId?: string;
    channelId?: string;
    playlistId?: string;
  };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default?: { url: string; width: number; height: number };
      medium?: { url: string; width: number; height: number };
      high?: { url: string; width: number; height: number };
      standard?: { url: string; width: number; height: number };
      maxres?: { url: string; width: number; height: number };
    };
    channelTitle: string;
    liveBroadcastContent?: string;
  };
}

export interface YouTubeVideoItem {
  id: string;
  snippet?: YouTubeSearchItem['snippet'];
  contentDetails?: {
    duration: string;
    dimension: string;
    definition: string;
    caption: string;
  };
  statistics?: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
}

export interface YouTubeApiResponse<T = any> {
  kind: string;
  etag: string;
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo?: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: T[];
  error?: {
    code: number;
    message: string;
    errors?: any[];
  };
}

export interface GeospatialSearchParams {
  lat: number;
  lng: number;
  radiusKm?: number;
  query?: string;
  maxResults?: number;
  order?: 'date' | 'rating' | 'relevance' | 'title' | 'videoCount' | 'viewCount';
  publishedAfter?: string;
  publishedBefore?: string;
}

class ModernYouTubeClient {
  private baseUrl: string = 'https://www.googleapis.com/youtube/v3/';
  private proxyUrl: string = '/api/youtube/';
  private defaultKey: string = '';
  private currentKey: string = '';
  private quotaUser: string = '';

  constructor() {
    this.quotaUser = this.getOrCreateQuotaUser();
  }

  /**
   * Generates or retrieves a persistent unique client identifier for quotaUser.
   */
  private getOrCreateQuotaUser(): string {
    try {
      let tempId = localStorage.getItem('geofind_yt_quota_user');
      if (!tempId) {
        tempId = 'user_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('geofind_yt_quota_user', tempId);
      }
      return tempId;
    } catch {
      return 'user_temp_' + Math.random().toString(36).substring(2, 12);
    }
  }

  /**
   * Configure base API URL (e.g. Google APIs or custom endpoint)
   */
  public setBaseUrl(url: string): void {
    this.baseUrl = url.endsWith('/') ? url : `${url}/`;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setDefaultKey(key: string): void {
    this.defaultKey = key.trim();
    if (!this.currentKey) {
      this.currentKey = this.defaultKey;
    }
  }

  public getDefaultKey(): string {
    return this.defaultKey;
  }

  public setKey(key: string): void {
    this.currentKey = key.trim();
    if (!this.defaultKey) {
      this.defaultKey = this.currentKey;
    }
  }

  public getKey(): string {
    return this.currentKey || this.defaultKey;
  }

  public getQuotaUser(): string {
    return this.quotaUser;
  }

  /**
   * Universal Request Handler with Timeout, AbortController, and Error Normalization
   */
  public async request<T = any>(
    endpoint: string,
    params: Record<string, any> = {},
    options: { timeoutMs?: number; useProxy?: boolean } = {}
  ): Promise<YouTubeApiResponse<T>> {
    const key = this.getKey();
    const timeoutMs = options.timeoutMs || 8000;

    const mergedParams: Record<string, string> = {
      quotaUser: this.quotaUser,
      ...params
    };

    if (key) {
      mergedParams.key = key;
    }

    const queryParams = new URLSearchParams();
    Object.entries(mergedParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        queryParams.append(k, String(v));
      }
    });

    const targetUrl = options.useProxy
      ? `${this.proxyUrl}${endpoint}?${queryParams.toString()}`
      : `${this.baseUrl}${endpoint}?${queryParams.toString()}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const errMsg = errorBody.error?.message || `YouTube API returned HTTP status ${response.status}`;
        console.warn(`[YouTubeClient] HTTP ${response.status} on ${endpoint}:`, errMsg);
        throw new Error(errMsg);
      }

      const data = await response.json();
      return data as YouTubeApiResponse<T>;
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new Error(`YouTube API request timed out after ${timeoutMs}ms`);
      }
      throw err;
    }
  }

  /**
   * Search Videos by Coordinates and Radius
   */
  public async searchGeospatialVideos(params: GeospatialSearchParams): Promise<YouTubeApiResponse<YouTubeSearchItem>> {
    const radiusStr = `${Math.min(params.radiusKm || 50, 1000)}km`;
    return this.request<YouTubeSearchItem>('search', {
      part: 'snippet',
      type: 'video',
      location: `${params.lat},${params.lng}`,
      locationRadius: radiusStr,
      maxResults: params.maxResults || 50,
      q: params.query || '',
      order: params.order || 'date',
      publishedAfter: params.publishedAfter,
      publishedBefore: params.publishedBefore
    });
  }

  /**
   * Hydrate video IDs with detailed metadata (Duration, Views, Likes, 4K Definition)
   */
  public async getVideoDetails(videoIds: string[]): Promise<YouTubeApiResponse<YouTubeVideoItem>> {
    if (!videoIds || videoIds.length === 0) {
      return { kind: 'youtube#videoListResponse', etag: '', items: [] };
    }
    return this.request<YouTubeVideoItem>('videos', {
      part: 'snippet,contentDetails,statistics',
      id: videoIds.join(','),
      maxResults: 50
    });
  }
}

// Export singleton instance
export const youtubeClient = new ModernYouTubeClient();
export default youtubeClient;

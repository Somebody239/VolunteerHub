// Volunteer Connector API integration
// Documentation: https://www.volunteerconnector.org/api/search/

export interface VolunteerConnectorOpportunity {
  id: number;
  url: string;
  title: string;
  description: string;
  remote_or_online: boolean;
  organization: {
    name: string;
    logo: string;
    url: string;
  };
  activities: Array<{
    name: string;
    category: string;
  }>;
  dates: string;
  duration: string | null;
  audience: {
    scope: 'local' | 'regional' | 'national';
    regions?: string[];
    longitude?: number;
    latitude?: number;
  };
}

export interface VolunteerConnectorResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: VolunteerConnectorOpportunity[];
}

export interface SearchParams {
  // Country code (64 = Canada)
  cc?: number;
  // Activity categories (multiple allowed)
  ac?: number[];
  // Search term
  se?: string;
  // Sort order: 'Proximity' | 'Date' | 'Relevance'
  so?: 'Proximity' | 'Date' | 'Relevance';
  // Page number
  page?: number;
  // Postal code proximity (e.g., L9T)
  pc?: string;
  // Location-based search (requires coordinates)
  lat?: number;
  lng?: number;
  // Radius in km (default 50km)
  radius?: number;
}

// Convert Volunteer Connector opportunity to our internal format
export function convertToJobDetails(opportunity: VolunteerConnectorOpportunity): {
  title: string;
  organization: string;
  date: string;
  location?: string;
  duration?: string;
  spots?: number;
  category: string;
  tags?: string[];
  opportunityId: string;
  applyUrl?: string;
  contactEmail?: string;
  isExternal: boolean;
  externalUrl: string;
  description: string;
  activities: string[];
  isRemote: boolean;
  coordinates?: { lat: number; lng: number };
} {
  const activities = opportunity.activities.map(a => a.name);
  const categories = [...new Set(opportunity.activities.map(a => a.category))];
  
  // Extract location from audience
  let location: string | undefined;
  if (opportunity.audience.scope === 'local' && opportunity.audience.latitude && opportunity.audience.longitude) {
    location = `${opportunity.audience.latitude.toFixed(4)}, ${opportunity.audience.longitude.toFixed(4)}`;
  } else if (opportunity.audience.regions && opportunity.audience.regions.length > 0) {
    location = opportunity.audience.regions.join(', ');
  } else if (opportunity.remote_or_online) {
    location = 'Remote';
  }

  return {
    title: opportunity.title,
    organization: opportunity.organization.name,
    date: opportunity.dates,
    location,
    duration: opportunity.duration || undefined,
    spots: undefined, // Not available in Volunteer Connector API
    category: categories[0] || 'Volunteer',
    tags: activities,
    opportunityId: `vc_${opportunity.id}`,
    applyUrl: opportunity.url,
    contactEmail: undefined, // Not available in Volunteer Connector API
    isExternal: true,
    externalUrl: opportunity.url,
    description: opportunity.description,
    activities,
    isRemote: opportunity.remote_or_online,
    coordinates: opportunity.audience.latitude && opportunity.audience.longitude ? {
      lat: opportunity.audience.latitude,
      lng: opportunity.audience.longitude
    } : undefined
  };
}

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Search volunteer opportunities
export async function searchVolunteerOpportunities(
  params: SearchParams = {}
): Promise<VolunteerConnectorResponse> {
  const baseUrl = 'https://www.volunteerconnector.org/api/search/';
  const searchParams = new URLSearchParams();
  
  // Set default country to Canada
  searchParams.set('cc', (params.cc || 64).toString());
  
  // Add activity categories
  if (params.ac && params.ac.length > 0) {
    params.ac.forEach(ac => searchParams.append('ac', ac.toString()));
  }
  
  // Add search term
  if (params.se) {
    searchParams.set('se', params.se);
  }
  
  // Add sort order
  searchParams.set('so', params.so || 'Proximity');
  
  // Add pagination
  if (params.page) {
    searchParams.set('page', params.page.toString());
  }
  
  // Add location-based search
  if (params.lat && params.lng) {
    searchParams.set('lat', params.lat.toString());
    searchParams.set('lng', params.lng.toString());
    if (params.radius) {
      searchParams.set('radius', params.radius.toString());
    }
  }
  // Postal code proximity
  if (params.pc) {
    searchParams.set('pc', params.pc);
  }
  
  const url = `${baseUrl}?${searchParams.toString()}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      // Don't throw error for 404s or other HTTP errors - gracefully return empty results
      if (import.meta.env.DEV) {
        console.warn(`Volunteer opportunities API returned ${response.status}, returning empty results`);
      }
      return { count: 0, next: null, previous: null, results: [] };
    }
    const data = await response.json();
    
    // Ensure data has the correct structure
    if (!data || typeof data !== 'object') {
      if (import.meta.env.DEV) {
        console.warn('Invalid response from volunteer opportunities API, returning empty results');
      }
      return { count: 0, next: null, previous: null, results: [] };
    }
    
    // Ensure results is an array
    const results = Array.isArray(data.results) ? data.results : [];
    
    return {
      count: typeof data.count === 'number' ? data.count : 0,
      next: data.next || null,
      previous: data.previous || null,
      results
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Error fetching volunteer opportunities (gracefully handling):', error);
    }
    // Return empty result instead of throwing to gracefully handle API issues
    return { count: 0, next: null, previous: null, results: [] };
  }
}

// Fetch multiple pages and aggregate results (best-effort)
export async function searchVolunteerOpportunitiesAggregated(
  params: SearchParams = {},
  options: { maxPages?: number; maxResults?: number } = {}
): Promise<VolunteerConnectorResponse> {
  const maxPages = Math.max(1, options.maxPages ?? 5);
  const maxResults = Math.max(1, options.maxResults ?? 60);

  let page = params.page ?? 1;
  let aggregated: VolunteerConnectorOpportunity[] = [];
  let count = 0;
  let next: string | null = null;

  for (let i = 0; i < maxPages; i++) {
    try {
      const resp = await searchVolunteerOpportunities({ ...params, page });
      if (i === 0) count = resp.count;
      aggregated = aggregated.concat(resp.results || []);
      next = resp.next;
      if (!next || aggregated.length >= maxResults) break;
      page += 1;
    } catch (error) {
      // If any page fails, break the loop gracefully
      if (import.meta.env.DEV) {
        console.warn('Error fetching page', page, '- stopping aggregation');
      }
      break;
    }
  }

  return {
    count,
    next,
    previous: null,
    results: aggregated.slice(0, maxResults),
  };
}

// Get opportunities by location with radius filtering
export async function getOpportunitiesByLocation(
  latitude: number,
  longitude: number,
  radiusKm: number = 100,
  searchTerm?: string,
  page: number = 1
): Promise<VolunteerConnectorResponse> {
  return searchVolunteerOpportunities({
    lat: latitude,
    lng: longitude,
    radius: radiusKm,
    se: searchTerm,
    so: 'Proximity',
    page,
    cc: 64 // Canada
  });
}

// Get all opportunities (for testing/development)
export async function getAllOpportunities(
  searchTerm?: string,
  page: number = 1
): Promise<VolunteerConnectorResponse> {
  return searchVolunteerOpportunities({
    se: searchTerm,
    so: 'Date',
    page,
    cc: 64 // Canada
  });
}

// Filter opportunities by distance from user location
export function filterByDistance(
  opportunities: VolunteerConnectorOpportunity[],
  userLat: number,
  userLng: number,
  maxDistanceKm: number = 100
): VolunteerConnectorOpportunity[] {
  return opportunities.filter(opp => {
    if (opp.remote_or_online) return true; // Always include remote opportunities
    if (!opp.audience.latitude || !opp.audience.longitude) return true; // Include if no coordinates
    
    const distance = calculateDistance(
      userLat, 
      userLng, 
      opp.audience.latitude, 
      opp.audience.longitude
    );
    
    return distance <= maxDistanceKm;
  });
}

// Convert location string to coordinates using geocoding
export async function geocodeLocation(location: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Use a free geocoding service (you could also use Google Maps API, Mapbox, etc.)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1&countrycodes=ca`
    );
    
    if (!response.ok) {
      throw new Error('Geocoding failed');
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

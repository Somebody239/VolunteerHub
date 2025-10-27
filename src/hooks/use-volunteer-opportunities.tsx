import { useQuery } from '@tanstack/react-query';
import {
    searchVolunteerOpportunities,
    searchVolunteerOpportunitiesAggregated,
    getOpportunitiesByLocation,
    getAllOpportunities,
    convertToJobDetails,
    filterByDistance,
    type SearchParams,
    type VolunteerConnectorOpportunity
} from '@/lib/volunteerConnector';

export interface UseVolunteerOpportunitiesOptions {
    searchTerm?: string;
    latitude?: number;
    longitude?: number;
    radiusKm?: number;
    maxDistanceKm?: number;
    page?: number;
    postalCode?: string;
    enabled?: boolean;
}

export function useVolunteerOpportunities(options: UseVolunteerOpportunitiesOptions = {}) {
    const {
        searchTerm,
        latitude,
        longitude,
        radiusKm = 100,
        maxDistanceKm = 100,
        page = 1,
        postalCode,
        enabled = true
    } = options;

    return useQuery({
        queryKey: ['volunteer-opportunities', searchTerm, latitude, longitude, radiusKm, page, postalCode],
        queryFn: async () => {
            let response;

            try {
                if (latitude && longitude) {
                    // Location-based search
                    response = await searchVolunteerOpportunitiesAggregated({
                        se: searchTerm,
                        lat: latitude,
                        lng: longitude,
                        radius: radiusKm,
                        so: 'Proximity',
                        page
                    }, { maxPages: 5, maxResults: 60 });
                } else {
                    // Fallback: postal code proximity if provided, else general
                    if (postalCode) {
                        response = await searchVolunteerOpportunitiesAggregated({
                            se: searchTerm,
                            pc: postalCode,
                            so: 'Proximity',
                            page
                        }, { maxPages: 5, maxResults: 60 });
                    } else {
                        response = await getAllOpportunities(searchTerm, page);
                    }
                }

                // Filter by distance if user location is provided
                let filteredOpportunities = response.results || [];
                if (latitude && longitude && maxDistanceKm) {
                    filteredOpportunities = filterByDistance(
                        response.results || [],
                        latitude,
                        longitude,
                        maxDistanceKm
                    );
                }

                // Convert to our internal format
                const convertedOpportunities = (filteredOpportunities || []).map(convertToJobDetails);

                return {
                    ...response,
                    results: convertedOpportunities,
                    originalResults: filteredOpportunities
                };
            } catch (error) {
                // Gracefully return empty results on any error
                if (import.meta.env.DEV) {
                    console.warn('Error in volunteer opportunities query:', error);
                }
                return { count: 0, next: null, previous: null, results: [], originalResults: [] };
            }
        },
        enabled,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: false, // Don't retry on error - just return empty results
    });
}

// Hook for searching with custom parameters
export function useVolunteerOpportunitiesSearch(params: SearchParams & { enabled?: boolean } = {}) {
    const { enabled = true, ...searchParams } = params;

    return useQuery({
        queryKey: ['volunteer-opportunities-search', searchParams],
        queryFn: async () => {
            const response = await searchVolunteerOpportunities(searchParams);

            // Convert to our internal format
            const convertedOpportunities = response.results.map(convertToJobDetails);

            return {
                ...response,
                results: convertedOpportunities,
                originalResults: response.results
            };
        },
        enabled,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
    });
}

// Hook for getting user's current location
export function useGeolocation() {
    return useQuery({
        queryKey: ['geolocation'],
        queryFn: (): Promise<{ latitude: number; longitude: number }> => {
            return new Promise((resolve, reject) => {
                if (!navigator.geolocation) {
                    reject(new Error('Geolocation is not supported by this browser'));
                    return;
                }

                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        });
                    },
                    (error) => {
                        reject(error);
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 300000 // 5 minutes
                    }
                );
            });
        },
        enabled: false, // Only run when explicitly called
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
    });
}

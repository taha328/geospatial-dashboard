import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface VesselApiResponse {
  vessels: any[];
  total: number;
  page: number;
  limit: number;
}

export interface VesselTrackPoint {
  latitude: number;
  longitude: number;
  timestamp: Date;
  speed?: number;
  heading?: number;
}

@Injectable({
  providedIn: 'root'
})
export class VesselService {
  private baseUrl = 'http://localhost:3000/api'; // Adjust to match your backend

  constructor(private http: HttpClient) {}

  /**
   * Search for vessels based on criteria
   */
  searchVessels(criteria: any): Observable<VesselApiResponse> {
    // In a real implementation, this would call your backend API
    // For now, return mock data
    return of({
      vessels: this.generateMockVessels(),
      total: 8,
      page: 1,
      limit: 20
    });
  }

  /**
   * Get vessel by ID
   */
  getVesselById(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/vessels/${id}`).pipe(
      catchError(error => {
        console.error('Error fetching vessel:', error);
        return of(null);
      })
    );
  }

  /**
   * Get vessels within a bounding box
   */
  getVesselsInBounds(bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  }): Observable<any[]> {
    const params = {
      minLat: bounds.minLat.toString(),
      maxLat: bounds.maxLat.toString(),
      minLon: bounds.minLon.toString(),
      maxLon: bounds.maxLon.toString()
    };

    return this.http.get<any[]>(`${this.baseUrl}/vessels/bounds`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching vessels in bounds:', error);
        return of(this.generateMockVessels().filter(vessel => 
          vessel.latitude >= bounds.minLat &&
          vessel.latitude <= bounds.maxLat &&
          vessel.longitude >= bounds.minLon &&
          vessel.longitude <= bounds.maxLon
        ));
      })
    );
  }

  /**
   * Get vessel track/history
   */
  getVesselTrack(vesselId: string, hours: number = 24): Observable<VesselTrackPoint[]> {
    return this.http.get<VesselTrackPoint[]>(`${this.baseUrl}/vessels/${vesselId}/track`, {
      params: { hours: hours.toString() }
    }).pipe(
      catchError(error => {
        console.error('Error fetching vessel track:', error);
        return of(this.generateMockTrack());
      })
    );
  }

  /**
   * Get real-time vessel updates (WebSocket would be better for this)
   */
  getVesselUpdates(): Observable<any[]> {
    // This would typically be a WebSocket connection
    return this.http.get<any[]>(`${this.baseUrl}/vessels/updates`).pipe(
      catchError(error => {
        console.error('Error fetching vessel updates:', error);
        return of([]);
      })
    );
  }

  /**
   * Search vessels by text (name, IMO, MMSI)
   */
  searchVesselsByText(query: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/vessels/search`, {
      params: { q: query }
    }).pipe(
      catchError(error => {
        console.error('Error searching vessels:', error);
        const mockVessels = this.generateMockVessels();
        const queryLower = query.toLowerCase();
        return of(mockVessels.filter(vessel => 
          vessel.name.toLowerCase().includes(queryLower) ||
          vessel.imo?.toLowerCase().includes(queryLower) ||
          vessel.mmsi?.toLowerCase().includes(queryLower)
        ));
      })
    );
  }

  /**
   * Get vessel types for filtering
   */
  getVesselTypes(): Observable<string[]> {
    return of([
      'Cargo Ship',
      'Container Ship',
      'Tanker',
      'Passenger Ship',
      'Fishing Vessel',
      'Pleasure Craft',
      'Tug',
      'Supply Ship',
      'Military Ship',
      'Research Vessel',
      'Other'
    ]);
  }

  /**
   * Generate mock vessel data for development
   */
  private generateMockVessels(): any[] {
    const baseVessels = [
      {
        id: 'vessel_1',
        name: 'MSC Tanger',
        imo: '9234567',
        mmsi: '123456789',
        vesselType: 'Container Ship',
        latitude: 35.8845,
        longitude: -5.5026,
        heading: 45,
        speed: 12.5,
        status: 'active',
        flag: 'MA',
        length: 350,
        width: 45,
        lastUpdated: new Date(Date.now() - 300000) // 5 minutes ago
      },
      {
        id: 'vessel_2',
        name: 'Maersk Gibraltar',
        imo: '9345678',
        mmsi: '234567890',
        vesselType: 'Container Ship',
        latitude: 35.889,
        longitude: -5.489,
        heading: 180,
        speed: 8.2,
        status: 'anchored',
        flag: 'DK',
        length: 400,
        width: 58,
        lastUpdated: new Date(Date.now() - 600000) // 10 minutes ago
      },
      {
        id: 'vessel_3',
        name: 'Atlantic Cargo',
        imo: '9456789',
        mmsi: '345678901',
        vesselType: 'Cargo Ship',
        latitude: 35.88,
        longitude: -5.51,
        heading: 270,
        speed: 15.8,
        status: 'active',
        flag: 'ES',
        length: 180,
        width: 28,
        lastUpdated: new Date(Date.now() - 120000) // 2 minutes ago
      },
      {
        id: 'vessel_4',
        name: 'Med Explorer',
        imo: '9567890',
        mmsi: '456789012',
        vesselType: 'Research Vessel',
        latitude: 35.892,
        longitude: -5.495,
        heading: 90,
        speed: 6.1,
        status: 'active',
        flag: 'FR',
        length: 85,
        width: 16,
        lastUpdated: new Date(Date.now() - 180000) // 3 minutes ago
      },
      {
        id: 'vessel_5',
        name: 'Tanger Fisher',
        mmsi: '567890123',
        vesselType: 'Fishing Vessel',
        latitude: 35.875,
        longitude: -5.515,
        heading: 315,
        speed: 4.2,
        status: 'active',
        flag: 'MA',
        length: 35,
        width: 8,
        lastUpdated: new Date(Date.now() - 900000) // 15 minutes ago
      },
      {
        id: 'vessel_6',
        name: 'Port Pilot 1',
        mmsi: '678901234',
        vesselType: 'Tug',
        latitude: 35.887,
        longitude: -5.503,
        heading: 225,
        speed: 3.5,
        status: 'moored',
        flag: 'MA',
        length: 25,
        width: 9,
        lastUpdated: new Date(Date.now() - 1800000) // 30 minutes ago
      },
      {
        id: 'vessel_7',
        name: 'Strait Guardian',
        imo: '9678901',
        mmsi: '789012345',
        vesselType: 'Military Ship',
        latitude: 35.895,
        longitude: -5.485,
        heading: 135,
        speed: 18.7,
        status: 'active',
        flag: 'MA',
        length: 120,
        width: 15,
        lastUpdated: new Date(Date.now() - 240000) // 4 minutes ago
      },
      {
        id: 'vessel_8',
        name: 'Mediterranean Star',
        imo: '9789012',
        mmsi: '890123456',
        vesselType: 'Passenger Ship',
        latitude: 35.878,
        longitude: -5.492,
        heading: 0,
        speed: 0.0,
        status: 'moored',
        flag: 'IT',
        length: 280,
        width: 32,
        lastUpdated: new Date(Date.now() - 3600000) // 1 hour ago
      }
    ];

    return baseVessels;
  }

  /**
   * Generate mock track data for development
   */
  private generateMockTrack(): VesselTrackPoint[] {
    const track: VesselTrackPoint[] = [];
    const now = new Date();
    
    // Generate 24 hours of track points (every hour)
    for (let i = 24; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
      track.push({
        latitude: 35.88 + (Math.random() - 0.5) * 0.01,
        longitude: -5.50 + (Math.random() - 0.5) * 0.01,
        timestamp,
        speed: Math.random() * 20,
        heading: Math.random() * 360
      });
    }
    
    return track;
  }

  /**
   * Format vessel data for map display
   */
  formatVesselForMap(vessel: any): any {
    return {
      id: vessel.id,
      type: 'vessel',
      geometry: {
        type: 'Point',
        coordinates: [vessel.longitude, vessel.latitude]
      },
      properties: {
        name: vessel.name,
        vesselType: vessel.vesselType,
        status: vessel.status,
        speed: vessel.speed,
        heading: vessel.heading,
        imo: vessel.imo,
        mmsi: vessel.mmsi,
        flag: vessel.flag,
        lastUpdated: vessel.lastUpdated
      }
    };
  }

  /**
   * Get vessel icon based on type and status
   */
  getVesselIcon(vesselType: string, status: string): string {
    const baseIcons: { [key: string]: string } = {
      'Container Ship': '📦',
      'Cargo Ship': '🚛',
      'Tanker': '🛢️',
      'Passenger Ship': '🛳️',
      'Fishing Vessel': '🎣',
      'Tug': '🚤',
      'Military Ship': '⚔️',
      'Research Vessel': '🔬',
      'Pleasure Craft': '⛵',
      'Supply Ship': '🚢'
    };

    return baseIcons[vesselType] || '🚢';
  }

  /**
   * Calculate distance between two points (in nautical miles)
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3440.065; // Earth's radius in nautical miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

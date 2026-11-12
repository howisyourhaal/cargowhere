import { Carpark, CarparkFilters, FeeCalculationResult } from '../types/carpark';
import { INITIAL_SINGAPORE_CARPARKS } from '../data/mockCarparks';

// Local storage keys
const STORAGE_CUSTOM_API_KEY = 'parksg_custom_api_url';
const STORAGE_FAVORITES_KEY = 'parksg_favorite_ids';

// In-memory live state
let currentCarparksState: Carpark[] = [...INITIAL_SINGAPORE_CARPARKS];

/**
 * Calculates distance in kilometers between two GPS coordinates using Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Default Singapore Coordinates (City Hall / Marina Bay Center)
 */
export const SINGAPORE_DEFAULT_COORDS = {
  lat: 1.29027,
  lng: 103.851959,
};

/**
 * Get configured backend API URL or null
 */
export function getCustomBackendUrl(): string | null {
  return localStorage.getItem(STORAGE_CUSTOM_API_KEY);
}

/**
 * Set custom backend API URL (for when the user connects their real backend!)
 */
export function setCustomBackendUrl(url: string | null): void {
  if (url && url.trim()) {
    localStorage.setItem(STORAGE_CUSTOM_API_KEY, url.trim());
  } else {
    localStorage.removeItem(STORAGE_CUSTOM_API_KEY);
  }
}

/**
 * Simulate live real-time lot changes (fluctuates ±1 to ±3 lots realistically)
 */
export function simulateRealtimeLotUpdate(): Carpark[] {
  currentCarparksState = currentCarparksState.map((carpark) => {
    // 60% chance of lot count shifting by ±1 to ±4 lots
    if (Math.random() > 0.4) {
      const delta = Math.floor(Math.random() * 7) - 3;
      const newAvailable = Math.max(
        0,
        Math.min(carpark.totalLots - carpark.seasonParkingLots, carpark.availableLots + delta)
      );
      return {
        ...carpark,
        availableLots: newAvailable,
        lastUpdated: new Date().toISOString(),
      };
    }
    return carpark;
  });

  return currentCarparksState;
}

/**
 * Fetches Singapore carparks with filtering and distance calculation.
 * If a custom backend URL is configured, attempts to query it first, falling back to local simulation.
 */
export async function getCarparks(
  filters?: CarparkFilters,
  userLocation?: { lat: number; lng: number }
): Promise<Carpark[]> {
  const backendUrl = getCustomBackendUrl();

  let dataset: Carpark[] = currentCarparksState;

  if (backendUrl) {
    try {
      const response = await fetch(backendUrl, {
        headers: { Accept: 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          dataset = data;
          currentCarparksState = data;
        }
      }
    } catch {
      // Graceful fallback to local mock dataset if backend is not yet running
    }
  }

  // Calculate distance from user or reference point
  const referenceCoords = userLocation || SINGAPORE_DEFAULT_COORDS;
  let results = dataset.map((cp) => ({
    ...cp,
    distanceKm: calculateDistanceKm(
      referenceCoords.lat,
      referenceCoords.lng,
      cp.coordinates.lat,
      cp.coordinates.lng
    ),
  }));

  // Apply filters if provided
  if (filters) {
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      results = results.filter(
        (cp) =>
          cp.name.toLowerCase().includes(q) ||
          cp.address.toLowerCase().includes(q) ||
          cp.subDistrict.toLowerCase().includes(q) ||
          cp.postalCode.includes(q) ||
          (cp.carparkNumber && cp.carparkNumber.toLowerCase().includes(q))
      );
    }

    if (filters.region !== 'All') {
      results = results.filter((cp) => cp.region === filters.region);
    }

    if (filters.agency !== 'All') {
      results = results.filter((cp) => cp.agency === filters.agency);
    }

    if (filters.minLots > 0) {
      results = results.filter((cp) => cp.availableLots >= filters.minLots);
    }

    if (filters.maxHourlyRate > 0) {
      results = results.filter((cp) => cp.rates.ratePerHourBase <= filters.maxHourlyRate);
    }

    if (filters.onlyEv) {
      results = results.filter((cp) => cp.hasEvCharging);
    }

    if (filters.onlySheltered) {
      results = results.filter((cp) => cp.hasShelteredDeck);
    }

    if (filters.minHeight > 0) {
      results = results.filter((cp) => cp.gantryHeight >= filters.minHeight);
    }

    // Sorting
    results.sort((a, b) => {
      switch (filters.sortBy) {
        case 'lots':
          return b.availableLots - a.availableLots;
        case 'rate':
          return a.rates.ratePerHourBase - b.rates.ratePerHourBase;
        case 'distance':
          return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }

  return results;
}

/**
 * Favorites Management in LocalStorage
 */
export function getFavoriteCarparkIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_FAVORITES_KEY);
    return raw ? JSON.parse(raw) : ['LTA_SUNTEC', 'COMM_ION_ORCHARD', 'HDB_TP54'];
  } catch {
    return ['LTA_SUNTEC', 'COMM_ION_ORCHARD', 'HDB_TP54'];
  }
}

export function toggleFavoriteCarparkId(id: string): string[] {
  const current = getFavoriteCarparkIds();
  let updated: string[];
  if (current.includes(id)) {
    updated = current.filter((item) => item !== id);
  } else {
    updated = [...current, id];
  }
  localStorage.setItem(STORAGE_FAVORITES_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Smart Singapore Parking Fee Calculator
 */
export function calculateParkingFee(
  carpark: Carpark,
  entryDate: Date,
  exitDate: Date
): FeeCalculationResult {
  const diffMs = exitDate.getTime() - entryDate.getTime();
  const totalMinutes = Math.max(0, Math.round(diffMs / (1000 * 60)));

  const entryHour = entryDate.getHours();
  const entryDay = entryDate.getDay(); // 0 is Sunday, 6 is Saturday
  const isSunday = entryDay === 0;
  const isSaturday = entryDay === 6;

  const notes: string[] = [];

  // Grace Period Check: In Singapore, if you exit within the grace period (usually 10-15 mins), parking is 100% free!
  if (totalMinutes <= carpark.gracePeriodMinutes) {
    notes.push(`Within ${carpark.gracePeriodMinutes}-minute complimentary grace period.`);
    return {
      entryTime: entryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      exitTime: exitDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      totalDurationMinutes: totalMinutes,
      isWithinGracePeriod: true,
      estimatedFee: 0,
      breakdownNotes: notes,
    };
  }

  notes.push(`Grace period of ${carpark.gracePeriodMinutes} mins exceeded; standard rates apply.`);

  let totalFee = 0;

  if (carpark.agency === 'HDB' || carpark.agency === 'URA') {
    // Check Sunday Free Parking Scheme
    if (isSunday && carpark.rates.freeParkingWindow && entryHour >= 7 && entryHour < 22) {
      notes.push('Sunday Free Parking Scheme active (designated yellow lots 7:30am - 10:30pm).');
      return {
        entryTime: entryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        exitTime: exitDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        totalDurationMinutes: totalMinutes,
        isWithinGracePeriod: false,
        estimatedFee: 0,
        breakdownNotes: notes,
      };
    }

    // HDB / URA standard rate blocks (half-hour increments)
    const blocksOf30Min = Math.ceil(totalMinutes / 30);
    const halfHourRate = carpark.rates.ratePerHalfHour;
    totalFee = blocksOf30Min * halfHourRate;

    notes.push(
      `${blocksOf30Min} block(s) of 30 mins at $${halfHourRate.toFixed(2)}/half-hr.`
    );
    if (carpark.isCentralArea) {
      notes.push('Central Area surcharge included in peak period tariff.');
    }
  } else {
    // Commercial / Mall Carparks
    // Commercial rates often have per-entry rates during off-peak evenings (e.g. after 5pm/6pm)
    const isEveningEntry = entryHour >= 18;
    if (isEveningEntry && !isSunday && !isSaturday) {
      // Per entry night rate estimation
      const nightFlat = 3.50;
      totalFee = nightFlat;
      notes.push(`Evening flat rate of $${nightFlat.toFixed(2)} per entry applies.`);
    } else {
      // Standard hourly / half-hourly calculation
      const hours = Math.ceil(totalMinutes / 60);
      const firstHourRate = carpark.rates.ratePerHourBase;
      const subsequentHalfHours = Math.max(0, Math.ceil((totalMinutes - 60) / 30));
      const subRate = carpark.rates.ratePerHalfHour;

      totalFee = firstHourRate + subsequentHalfHours * subRate;
      notes.push(`First hour: $${firstHourRate.toFixed(2)}.`);
      if (subsequentHalfHours > 0) {
        notes.push(
          `${subsequentHalfHours} subsequent 30-min block(s) at $${subRate.toFixed(2)}/30-min.`
        );
      }
    }
  }

  return {
    entryTime: entryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    exitTime: exitDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    totalDurationMinutes: totalMinutes,
    isWithinGracePeriod: false,
    estimatedFee: Math.round(totalFee * 100) / 100,
    breakdownNotes: notes,
  };
}

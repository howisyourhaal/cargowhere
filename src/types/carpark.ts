export type AgencyType = 'HDB' | 'URA' | 'LTA' | 'Commercial';

export type VehicleCategory = 'car' | 'motorcycle' | 'heavy';

export type SingaporeRegion = 'Central' | 'East' | 'West' | 'North' | 'North-East';

export interface CarparkRates {
  weekdayPeak: string;
  weekdayOffPeak: string;
  saturday: string;
  sundayAndPh: string;
  centralAreaSurcharge?: string;
  ratePerHourBase: number;
  ratePerHalfHour: number;
  freeParkingWindow?: string;
}

export interface HistoricalOccupancyPoint {
  time: string;
  occupancyPercent: number;
  availableLots: number;
}

export interface Carpark {
  id: string; // e.g. 'HDB_TP54', 'LTA_SUNTEC'
  carparkNumber?: string; // HDB code like 'ACB', 'TP54'
  name: string;
  agency: AgencyType;
  address: string;
  postalCode: string;
  region: SingaporeRegion;
  subDistrict: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  totalLots: number;
  availableLots: number;
  vehicleCategory: VehicleCategory;
  gantryHeight: number; // in meters, e.g. 2.1
  hasEvCharging: boolean;
  evChargersCount?: number;
  evProvider?: string;
  evSpeedKw?: number;
  gracePeriodMinutes: number; // usually 10 or 15 mins in SG
  systemType: 'Electronic Parking System (EPS)' | 'Coupon / Mobile Parking';
  paymentModes: string[];
  rates: CarparkRates;
  seasonParkingLots: number;
  lastUpdated: string;
  historicalTrend: HistoricalOccupancyPoint[];
  distanceKm?: number;
  hasShelteredDeck: boolean;
  isCentralArea: boolean;
}

export interface CarparkFilters {
  searchQuery: string;
  region: SingaporeRegion | 'All';
  agency: AgencyType | 'All';
  vehicleCategory: VehicleCategory;
  minLots: number;
  maxHourlyRate: number;
  onlyEv: boolean;
  onlySheltered: boolean;
  minHeight: number;
  sortBy: 'lots' | 'rate' | 'distance' | 'name';
}

export interface FeeCalculationResult {
  entryTime: string;
  exitTime: string;
  totalDurationMinutes: number;
  isWithinGracePeriod: boolean;
  estimatedFee: number;
  breakdownNotes: string[];
}

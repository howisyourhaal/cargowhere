import React, { useState, useEffect, useCallback } from 'react';
import {
  Carpark,
  CarparkFilters,
  SingaporeRegion,
} from './types/carpark';
import {
  getCarparks,
  simulateRealtimeLotUpdate,
  getFavoriteCarparkIds,
  toggleFavoriteCarparkId,
  SINGAPORE_DEFAULT_COORDS,
} from './services/carparkService';
import { Header } from './components/Header';
import { CarparkMap } from './components/CarparkMap';
import { CarparkCard } from './components/CarparkCard';
import { CarparkDetailModal } from './components/CarparkDetailModal';
import { FeeCalculatorModal } from './components/FeeCalculatorModal';
import { BackendGuideModal } from './components/BackendGuideModal';
import { ParkingTimerModal } from './components/ParkingTimerModal';
import { FilterToolbar } from './components/FilterToolbar';
import {
  Car,
  Zap,
  MapPin,
  Clock,
  Compass,
  Star,
  Calculator,
  ShieldCheck,
  RotateCcw,
  Navigation,
} from 'lucide-react';

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return (
      localStorage.getItem('parksg_theme') === 'dark' ||
      (!('parksg_theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('parksg_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('parksg_theme', 'light');
    }
  }, [isDarkMode]);

  // Main data & filters state
  const [carparks, setCarparks] = useState<Carpark[]>([]);
  const [favorites, setFavorites] = useState<string[]>(getFavoriteCarparkIds);
  const [selectedCarpark, setSelectedCarpark] = useState<Carpark | null>(null);

  const [activeTab, setActiveTab] = useState<'lots' | 'map' | 'calculator' | 'saved' | 'ev'>('lots');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  const [filters, setFilters] = useState<CarparkFilters>({
    searchQuery: '',
    region: 'All',
    agency: 'All',
    vehicleCategory: 'car',
    minLots: 0,
    maxHourlyRate: 0,
    onlyEv: false,
    onlySheltered: false,
    minHeight: 0,
    sortBy: 'lots',
  });

  // User GPS state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Auto-refresh timer state (30 seconds cycle)
  const [refreshSecondsLeft, setRefreshSecondsLeft] = useState<number>(30);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Modals state
  const [isFeeCalcOpen, setIsFeeCalcOpen] = useState<boolean>(false);
  const [feeCalcInitialId, setFeeCalcInitialId] = useState<string | undefined>(undefined);
  const [isBackendGuideOpen, setIsBackendGuideOpen] = useState<boolean>(false);
  const [isParkingTimerOpen, setIsParkingTimerOpen] = useState<boolean>(false);

  // Fetch carparks helper
  const loadCarparks = useCallback(async () => {
    setIsRefreshing(true);
    const data = await getCarparks(filters, userLocation ?? undefined);
    setCarparks(data);
    setIsRefreshing(false);
  }, [filters, userLocation]);

  // Initial load & filter change
  useEffect(() => {
    loadCarparks();
  }, [loadCarparks]);

  // Real-time polling timer
  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshSecondsLeft((prev) => {
        if (prev <= 1) {
          // Trigger live lot simulation / refresh
          simulateRealtimeLotUpdate();
          loadCarparks();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loadCarparks]);

  const handleManualRefresh = () => {
    simulateRealtimeLotUpdate();
    setRefreshSecondsLeft(30);
    loadCarparks();
  };

  // Toggle favorite
  const handleToggleFavorite = (id: string) => {
    const updated = toggleFavoriteCarparkId(id);
    setFavorites(updated);
  };

  // GPS Locate Me
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(coords);
        loadCarparks();
      },
      () => {
        // Fallback default Singapore center
        setUserLocation(SINGAPORE_DEFAULT_COORDS);
      },
      { timeout: 10000 }
    );
  };

  // Quick tab switching effects
  const handleSelectTab = (tab: 'lots' | 'map' | 'calculator' | 'saved' | 'ev') => {
    setActiveTab(tab);
    if (tab === 'map') {
      setViewMode('map');
    } else if (tab === 'lots') {
      setViewMode('grid');
      setFilters((prev) => ({ ...prev, onlyEv: false }));
    } else if (tab === 'ev') {
      setViewMode('grid');
      setFilters((prev) => ({ ...prev, onlyEv: true }));
    } else if (tab === 'saved') {
      setViewMode('grid');
    } else if (tab === 'calculator') {
      setIsFeeCalcOpen(true);
    }
  };

  // Quick fee estimator trigger from card
  const handleEstimateFee = (carpark: Carpark) => {
    setFeeCalcInitialId(carpark.id);
    setIsFeeCalcOpen(true);
  };

  // Displayed dataset: if in 'saved' tab, only show favorited carparks
  const displayedCarparks = activeTab === 'saved'
    ? carparks.filter((cp) => favorites.includes(cp.id))
    : carparks;

  // Aggregate Metrics for Header Strip
  const totalTrackedLots = carparks.reduce((sum, cp) => sum + cp.totalLots, 0);
  const totalAvailableLots = carparks.reduce((sum, cp) => sum + cp.availableLots, 0);
  const evReadyCount = carparks.filter((cp) => cp.hasEvCharging).length;
  const centralCarparks = carparks.filter((cp) => cp.isCentralArea);
  const centralAvailable = centralCarparks.reduce((sum, cp) => sum + cp.availableLots, 0);
  const centralTotal = centralCarparks.reduce((sum, cp) => sum + cp.totalLots, 0);
  const centralPercent = centralTotal > 0 ? Math.round((centralAvailable / centralTotal) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors pb-20 md:pb-8">
      {/* Strict 3-zone Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onOpenBackendGuide={() => setIsBackendGuideOpen(true)}
        onOpenParkingTimer={() => setIsParkingTimerOpen(true)}
        refreshSecondsLeft={refreshSecondsLeft}
        onManualRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Strip: 4 clean summary cards with tabular numbers */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
              Available Lots SG
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                {totalAvailableLots.toLocaleString()}
              </span>
              <span className="text-xs font-mono text-slate-400">
                / {totalTrackedLots.toLocaleString()}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
              Across tracked carparks
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
              Tracked Locations
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                {carparks.length}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">hubs</span>
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
              HDB, URA & Commercial Malls
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
              Central CBD Free Lots
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                {centralPercent}%
              </span>
              <span className="text-xs font-mono text-slate-400">
                ({centralAvailable} lots)
              </span>
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
              Downtown & Orchard zone
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
              EV Charging Ready
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                {evReadyCount}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">locations</span>
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
              SP, CDG ENGIE, Shell & Tesla
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <FilterToolbar
          filters={filters}
          onFilterChange={setFilters}
          viewMode={viewMode}
          onChangeViewMode={(mode) => {
            setViewMode(mode);
            if (mode === 'map') setActiveTab('map');
            else if (activeTab === 'map') setActiveTab('lots');
          }}
          totalMatching={displayedCarparks.length}
        />

        {/* Main Content Area: Map View vs Grid List View */}
        {viewMode === 'map' ? (
          <div className="space-y-4">
            <CarparkMap
              carparks={displayedCarparks}
              selectedCarpark={selectedCarpark}
              onSelectCarpark={(cp) => setSelectedCarpark(cp)}
              isDarkMode={isDarkMode}
              onLocateMe={handleLocateMe}
              userLocation={userLocation}
            />

            {/* If a carpark is selected in map mode, show a quick snapshot card */}
            {selectedCarpark && (
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
                    <span>{selectedCarpark.agency}</span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedCarpark.subDistrict}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{selectedCarpark.postalCode}</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedCarpark.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {selectedCarpark.address}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {selectedCarpark.availableLots}
                    </span>
                    <span className="text-xs text-slate-400 block">
                      / {selectedCarpark.totalLots} lots
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedCarpark(selectedCarpark)}
                    className="px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors whitespace-nowrap"
                  >
                    View Rates & Details
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Grid View */
          <div>
            {displayedCarparks.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
                <Car className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  No carparks match your filter criteria
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Try clearing your search query or selecting "All Regions" to see available lots across Singapore.
                </p>
                <button
                  onClick={() =>
                    setFilters({
                      searchQuery: '',
                      region: 'All',
                      agency: 'All',
                      vehicleCategory: 'car',
                      minLots: 0,
                      maxHourlyRate: 0,
                      onlyEv: false,
                      onlySheltered: false,
                      minHeight: 0,
                      sortBy: 'lots',
                    })
                  }
                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedCarparks.map((cp) => (
                  <CarparkCard
                    key={cp.id}
                    carpark={cp}
                    isFavorite={favorites.includes(cp.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onSelect={(c) => setSelectedCarpark(c)}
                    onEstimateFee={handleEstimateFee}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Informative Singapore Parking Guidelines Banner */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Singapore Parking Quick Reference</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-400">
            <div>
              <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">
                Grace Period
              </span>
              <span>
                Most HDB and URA MSCPs offer a 15-minute complimentary grace period for drop-offs.
                Major commercial malls offer 10 to 15 minutes.
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">
                Sunday Free Parking Scheme
              </span>
              <span>
                Designated yellow lots in HDB carparks offer complimentary parking from 7:30am to 10:30pm
                on Sundays & Public Holidays (excluding season parking red lots).
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">
                Electronic Parking (EPS)
              </span>
              <span>
                Charges are automatically deducted via your CashCard, NETS FlashPay, EZ-Link, or
                connected in-vehicle unit (IU/OBU) upon exiting the gantry.
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (Under 15% sticky cap) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-5 items-center h-16 px-1 shadow-lg">
        <button
          onClick={() => handleSelectTab('lots')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'lots'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Car className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">Lots</span>
        </button>

        <button
          onClick={() => handleSelectTab('map')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'map'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <MapPin className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">Map</span>
        </button>

        <button
          onClick={() => handleSelectTab('calculator')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'calculator'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Calculator className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">Calculator</span>
        </button>

        <button
          onClick={() => handleSelectTab('saved')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'saved'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Star className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">Saved</span>
        </button>

        <button
          onClick={() => handleSelectTab('ev')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'ev'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Zap className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">EV Hubs</span>
        </button>
      </nav>

      {/* Modals & Drawers */}
      {selectedCarpark && (
        <CarparkDetailModal
          carpark={selectedCarpark}
          onClose={() => setSelectedCarpark(null)}
          isFavorite={favorites.includes(selectedCarpark.id)}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {isFeeCalcOpen && (
        <FeeCalculatorModal
          carparks={carparks}
          initialCarparkId={feeCalcInitialId}
          onClose={() => setIsFeeCalcOpen(false)}
          onSelectCarparkDetail={(cp) => {
            setSelectedCarpark(cp);
          }}
        />
      )}

      {isBackendGuideOpen && (
        <BackendGuideModal
          onClose={() => setIsBackendGuideOpen(false)}
          onRefreshData={loadCarparks}
        />
      )}

      {isParkingTimerOpen && (
        <ParkingTimerModal
          carparks={carparks}
          onClose={() => setIsParkingTimerOpen(false)}
        />
      )}
    </div>
  );
}

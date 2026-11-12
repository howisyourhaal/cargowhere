import React, { useState, useId } from 'react';
import { Carpark, FeeCalculationResult } from '../types/carpark';
import { calculateParkingFee } from '../services/carparkService';
import {
  X,
  Star,
  Navigation,
  Zap,
  Shield,
  CreditCard,
  Clock,
  ExternalLink,
  Info,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

interface CarparkDetailModalProps {
  carpark: Carpark | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

export const CarparkDetailModal: React.FC<CarparkDetailModalProps> = ({
  carpark,
  onClose,
  isFavorite,
  onToggleFavorite,
}) => {
  const entryTimeId = useId();
  const exitTimeId = useId();

  if (!carpark) return null;

  // Embedded Fee Estimator states
  const now = new Date();
  const formatTimeInput = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const [entryTimeStr, setEntryTimeStr] = useState(formatTimeInput(now));
  const [exitTimeStr, setExitTimeStr] = useState(formatTimeInput(twoHoursLater));
  const [calcResult, setCalcResult] = useState<FeeCalculationResult | null>(() => {
    return calculateParkingFee(carpark, now, twoHoursLater);
  });

  const handleRecalculate = (newEntry?: string, newExit?: string) => {
    const entryVal = newEntry ?? entryTimeStr;
    const exitVal = newExit ?? exitTimeStr;

    const [eH, eM] = entryVal.split(':').map(Number);
    const [xH, xM] = exitVal.split(':').map(Number);

    const eDate = new Date();
    eDate.setHours(eH || 0, eM || 0, 0, 0);

    let xDate = new Date();
    xDate.setHours(xH || 0, xM || 0, 0, 0);

    // If exit time is earlier in the clock, assume next day
    if (xDate.getTime() <= eDate.getTime()) {
      xDate = new Date(xDate.getTime() + 24 * 60 * 60 * 1000);
    }

    const res = calculateParkingFee(carpark, eDate, xDate);
    setCalcResult(res);
  };

  const occupancyPercent = Math.min(
    100,
    Math.round(((carpark.totalLots - carpark.availableLots) / carpark.totalLots) * 100)
  );

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${carpark.coordinates.lat},${carpark.coordinates.lng}`;
  const wazeUrl = `https://waze.com/ul?ll=${carpark.coordinates.lat},${carpark.coordinates.lng}&navigate=yes`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="carpark-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1 flex-wrap">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {carpark.agency}
              </span>
              <span aria-hidden="true">·</span>
              <span>{carpark.region} Region</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{carpark.postalCode}</span>
              {carpark.carparkNumber && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono font-medium">Code: {carpark.carparkNumber}</span>
                </>
              )}
            </div>
            <h2 id="carpark-detail-title" className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {carpark.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {carpark.address}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(carpark.id)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-amber-400 dark:hover:text-amber-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star
                className={`w-5 h-5 ${
                  isFavorite
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Real-Time Lots Status Bar */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
                  Live Available Lots
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                    {carpark.availableLots}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    of {carpark.totalLots} total lots
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:items-end">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {occupancyPercent}% Occupancy
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Season lots reserved: {carpark.seasonParkingLots}
                </span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-3">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  carpark.availableLots === 0
                    ? 'bg-rose-500'
                    : carpark.availableLots < 25
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${100 - occupancyPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              <span>Grace Period: {carpark.gracePeriodMinutes} mins free</span>
              <span className="font-mono">
                Updated {new Date(carpark.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* 24-Hour Historical Occupancy Chart */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Typical Daily Occupancy Curve</span>
              </h4>
              <span className="text-xs text-slate-400">Singapore Peak Hours</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-8 gap-2 items-end h-28 pt-2">
                {carpark.historicalTrend.map((point) => (
                  <div key={point.time} className="flex flex-col items-center gap-1 h-full justify-end group">
                    <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {point.occupancyPercent}%
                    </div>
                    <div
                      className={`w-full rounded-t-md transition-all ${
                        point.occupancyPercent > 85
                          ? 'bg-rose-500 dark:bg-rose-600'
                          : point.occupancyPercent > 70
                          ? 'bg-amber-500 dark:bg-amber-600'
                          : 'bg-emerald-500 dark:bg-emerald-600'
                      }`}
                      style={{ height: `${Math.max(12, point.occupancyPercent)}%` }}
                    />
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      {point.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rates Table */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Official Singapore Parking Tariffs</span>
            </h4>
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="flex items-start justify-between p-3 bg-white dark:bg-slate-900">
                <span className="font-medium text-slate-600 dark:text-slate-400">Weekday Peak</span>
                <span className="text-right font-medium text-slate-900 dark:text-white max-w-[60%]">
                  {carpark.rates.weekdayPeak}
                </span>
              </div>
              <div className="flex items-start justify-between p-3 bg-slate-50/50 dark:bg-slate-800/30">
                <span className="font-medium text-slate-600 dark:text-slate-400">Weekday Off-Peak</span>
                <span className="text-right font-medium text-slate-900 dark:text-white max-w-[60%]">
                  {carpark.rates.weekdayOffPeak}
                </span>
              </div>
              <div className="flex items-start justify-between p-3 bg-white dark:bg-slate-900">
                <span className="font-medium text-slate-600 dark:text-slate-400">Saturday</span>
                <span className="text-right font-medium text-slate-900 dark:text-white max-w-[60%]">
                  {carpark.rates.saturday}
                </span>
              </div>
              <div className="flex items-start justify-between p-3 bg-slate-50/50 dark:bg-slate-800/30">
                <span className="font-medium text-slate-600 dark:text-slate-400">Sunday & Public Holidays</span>
                <span className="text-right font-medium text-slate-900 dark:text-white max-w-[60%]">
                  {carpark.rates.sundayAndPh}
                </span>
              </div>
              {carpark.rates.freeParkingWindow && (
                <div className="flex items-start justify-between p-3 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300">
                  <span className="font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Free Parking Scheme
                  </span>
                  <span className="text-right font-medium max-w-[60%]">
                    {carpark.rates.freeParkingWindow}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Smart Fee Estimator for This Carpark */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Quick Fee Estimator
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label htmlFor={entryTimeId} className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Entry Time
                </label>
                <input
                  id={entryTimeId}
                  type="time"
                  value={entryTimeStr}
                  onChange={(e) => {
                    setEntryTimeStr(e.target.value);
                    handleRecalculate(e.target.value, exitTimeStr);
                  }}
                  className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label htmlFor={exitTimeId} className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Exit Time
                </label>
                <input
                  id={exitTimeId}
                  type="time"
                  value={exitTimeStr}
                  onChange={(e) => {
                    setExitTimeStr(e.target.value);
                    handleRecalculate(entryTimeStr, e.target.value);
                  }}
                  className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {calcResult && (
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">
                    Duration: {Math.floor(calcResult.totalDurationMinutes / 60)}h{' '}
                    {calcResult.totalDurationMinutes % 60}m
                  </span>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {calcResult.breakdownNotes[0]}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Estimated Fee</span>
                  <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                    ${calcResult.estimatedFee.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Carpark Specs & EV Facilities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                <span>Physical Specs</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Height Limit:</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">
                  {carpark.gantryHeight}m
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Sheltered Deck:</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {carpark.hasShelteredDeck ? 'Yes (MSCP / Basement)' : 'Open Surface Lot'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Gantry System:</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {carpark.systemType}
                </span>
              </div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                <span>EV Charging Facilities</span>
              </div>
              {carpark.hasEvCharging ? (
                <>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Available Chargers:</span>
                    <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      {carpark.evChargersCount} Stations
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Provider:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {carpark.evProvider}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Speed:</span>
                    <span className="font-mono font-medium text-slate-900 dark:text-white">
                      Up to {carpark.evSpeedKw}kW
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-slate-400 dark:text-slate-500 text-[11px]">
                  No dedicated EV charging points at this location.
                </p>
              )}
            </div>
          </div>

          {/* Payment Modes */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
            <CreditCard className="w-3.5 h-3.5 shrink-0" />
            <span className="font-medium text-slate-700 dark:text-slate-300">Accepted:</span>
            <span>{carpark.paymentModes.join(', ')}</span>
          </div>
        </div>

        {/* Modal Action Bar */}
        <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
            Coordinates: {carpark.coordinates.lat.toFixed(4)}, {carpark.coordinates.lng.toFixed(4)}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-xl transition-colors shadow-sm"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Google Maps</span>
            </a>
            <a
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Waze</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

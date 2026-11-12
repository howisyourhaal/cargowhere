import React from 'react';
import { Carpark } from '../types/carpark';
import { Star, Zap, Navigation, Calculator, ChevronRight } from 'lucide-react';

interface CarparkCardProps {
  carpark: Carpark;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onSelect: (carpark: Carpark) => void;
  onEstimateFee: (carpark: Carpark) => void;
}

export const CarparkCard: React.FC<CarparkCardProps> = ({
  carpark,
  isFavorite,
  onToggleFavorite,
  onSelect,
  onEstimateFee,
}) => {
  const occupancyPercent = Math.min(
    100,
    Math.round(((carpark.totalLots - carpark.availableLots) / carpark.totalLots) * 100)
  );

  // Status text & colors
  let statusColorClass = 'text-emerald-600 dark:text-emerald-400';
  let barColorClass = 'bg-emerald-500';
  let availabilityLabel = 'Available';

  if (carpark.availableLots === 0) {
    statusColorClass = 'text-rose-600 dark:text-rose-400';
    barColorClass = 'bg-rose-500';
    availabilityLabel = 'Carpark Full';
  } else if (carpark.availableLots < 25) {
    statusColorClass = 'text-amber-600 dark:text-amber-400';
    barColorClass = 'bg-amber-500';
    availabilityLabel = 'Limited Lots';
  }

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${carpark.coordinates.lat},${carpark.coordinates.lng}`;

  return (
    <div
      onClick={() => onSelect(carpark)}
      className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {carpark.name}
            </h3>

            {/* Zero-Pill Unboxed Metadata with · separator */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
              <span>{carpark.agency}</span>
              <span aria-hidden="true">·</span>
              <span>{carpark.subDistrict}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{carpark.postalCode}</span>
              {carpark.distanceKm !== undefined && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{carpark.distanceKm} km</span>
                </>
              )}
            </div>
          </div>

          {/* Favorite Star Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(carpark.id);
            }}
            className="p-2 -mr-1.5 -mt-1.5 text-slate-400 hover:text-amber-400 dark:hover:text-amber-300 transition-colors focus-visible:outline-none"
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star
              className={`w-4 h-4 ${
                isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'
              }`}
            />
          </button>
        </div>

        {/* Live Lot Availability Block */}
        <div className="my-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800/80">
          <div className="flex items-baseline justify-between mb-1.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {carpark.availableLots}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                / {carpark.totalLots} lots
              </span>
            </div>
            <span className={`text-xs font-semibold ${statusColorClass}`}>
              {availabilityLabel}
            </span>
          </div>

          {/* Clean Progress Meter */}
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${barColorClass} transition-all duration-500 rounded-full`}
              style={{ width: `${100 - occupancyPercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            <span>{occupancyPercent}% occupied</span>
            <span>Grace: {carpark.gracePeriodMinutes} mins</span>
          </div>
        </div>

        {/* Secondary Specs Row */}
        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 dark:text-slate-500">Base Tariff</span>
            <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
              ${carpark.rates.ratePerHourBase.toFixed(2)}/hr
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 dark:text-slate-500">Height Limit</span>
            <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
              {carpark.gantryHeight}m
            </span>
          </div>
          {carpark.hasEvCharging && (
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="flex items-center gap-1 text-[11px]">
                <Zap className="w-3 h-3" />
                EV Fast Charging
              </span>
              <span className="text-[11px] font-mono">
                {carpark.evChargersCount} lots ({carpark.evSpeedKw}kW)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer Buttons */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEstimateFee(carpark);
          }}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors whitespace-nowrap"
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Estimate Fee</span>
        </button>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-xl transition-colors whitespace-nowrap"
          title="Open directions in Google Maps"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Navigate</span>
        </a>

        <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

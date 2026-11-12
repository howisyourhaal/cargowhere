import React, { useId } from 'react';
import {
  CarparkFilters,
  SingaporeRegion,
  AgencyType,
} from '../types/carpark';
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  MapPin,
  Zap,
  ArrowUpDown,
  X,
} from 'lucide-react';

interface FilterToolbarProps {
  filters: CarparkFilters;
  onFilterChange: (filters: CarparkFilters) => void;
  viewMode: 'grid' | 'map';
  onChangeViewMode: (mode: 'grid' | 'map') => void;
  totalMatching: number;
}

const REGIONS: (SingaporeRegion | 'All')[] = [
  'All',
  'Central',
  'East',
  'West',
  'North',
  'North-East',
];

const AGENCIES: (AgencyType | 'All')[] = [
  'All',
  'HDB',
  'URA',
  'Commercial',
];

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  filters,
  onFilterChange,
  viewMode,
  onChangeViewMode,
  totalMatching,
}) => {
  const searchInputId = useId();
  const agencySelectId = useId();
  const sortSelectId = useId();

  const handleUpdate = <K extends keyof CarparkFilters>(key: K, value: CarparkFilters[K]) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };

  const handleClearSearch = () => {
    handleUpdate('searchQuery', '');
  };

  return (
    <div className="space-y-3">
      {/* Primary Row: Search & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <label htmlFor={searchInputId} className="sr-only">Search Singapore carparks</label>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id={searchInputId}
            type="text"
            placeholder="Search by carpark name, postal code (e.g. 038983), HDB code (TP54), or street..."
            value={filters.searchQuery}
            onChange={(e) => handleUpdate('searchQuery', e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
          />
          {filters.searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Clear search query"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Mode Toggle: Grid vs Map */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-end sm:self-auto shrink-0 border border-slate-200/80 dark:border-slate-700/80">
          <button
            onClick={() => onChangeViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>List View</span>
          </button>
          <button
            onClick={() => onChangeViewMode('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              viewMode === 'map'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Map View</span>
          </button>
        </div>
      </div>

      {/* Region Segmented Controls */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-xs">
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1 shrink-0">
          Region:
        </span>
        {REGIONS.map((r) => (
          <button
            key={r}
            onClick={() => handleUpdate('region', r)}
            className={`px-3 py-1.5 font-medium rounded-xl transition-colors whitespace-nowrap shrink-0 ${
              filters.region === r
                ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-2xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            {r === 'All' ? 'All Regions' : r}
          </button>
        ))}
      </div>

      {/* Secondary Filter Badges / Dropdowns Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Agency Dropdown */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 dark:text-slate-500 text-[11px]">Agency:</span>
            <label htmlFor={agencySelectId} className="sr-only">Filter by Agency</label>
            <select
              id={agencySelectId}
              value={filters.agency}
              onChange={(e) => handleUpdate('agency', e.target.value as AgencyType | 'All')}
              className="bg-transparent font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              {AGENCIES.map((ag) => (
                <option key={ag} value={ag} className="dark:bg-slate-800">
                  {ag === 'All' ? 'All Operators' : ag}
                </option>
              ))}
            </select>
          </div>

          {/* EV Toggle */}
          <button
            onClick={() => handleUpdate('onlyEv', !filters.onlyEv)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors ${
              filters.onlyEv
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-semibold'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${filters.onlyEv ? 'text-emerald-600 fill-emerald-600' : 'text-slate-400'}`} />
            <span>EV Fast Charging</span>
          </button>

          {/* Sheltered Only Toggle */}
          <button
            onClick={() => handleUpdate('onlySheltered', !filters.onlySheltered)}
            className={`px-3 py-1.5 rounded-xl border transition-colors ${
              filters.onlySheltered
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent font-semibold'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            Sheltered Deck
          </button>

          {/* Clearance Height Filter */}
          <button
            onClick={() => handleUpdate('minHeight', filters.minHeight > 0 ? 0 : 2.1)}
            className={`px-3 py-1.5 rounded-xl border transition-colors ${
              filters.minHeight > 0
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent font-semibold'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            Height &ge; 2.1m
          </button>
        </div>

        {/* Sort & Count */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <label htmlFor={sortSelectId} className="sr-only">Sort by</label>
            <select
              id={sortSelectId}
              value={filters.sortBy}
              onChange={(e) => handleUpdate('sortBy', e.target.value as CarparkFilters['sortBy'])}
              className="bg-transparent font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="lots" className="dark:bg-slate-800">Most Available Lots</option>
              <option value="distance" className="dark:bg-slate-800">Closest Distance</option>
              <option value="rate" className="dark:bg-slate-800">Lowest Hourly Rate</option>
              <option value="name" className="dark:bg-slate-800">Carpark Name (A-Z)</option>
            </select>
          </div>

          <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px] whitespace-nowrap">
            {totalMatching} locations
          </span>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Car, RefreshCw, Moon, Sun, Code2, Clock } from 'lucide-react';

interface HeaderProps {
  activeTab: 'lots' | 'map' | 'calculator' | 'saved' | 'ev';
  onSelectTab: (tab: 'lots' | 'map' | 'calculator' | 'saved' | 'ev') => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenBackendGuide: () => void;
  onOpenParkingTimer: () => void;
  refreshSecondsLeft: number;
  onManualRefresh: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  isDarkMode,
  onToggleDarkMode,
  onOpenBackendGuide,
  onOpenParkingTimer,
  refreshSecondsLeft,
  onManualRefresh,
  isRefreshing,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectTab('lots')}
              className="flex items-center gap-2.5 text-left group focus-visible:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-600/20 group-hover:bg-emerald-500 transition-colors">
                <Car className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                  Park<span className="text-emerald-600 dark:text-emerald-400">SG</span>
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: 4-5 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <button
              onClick={() => onSelectTab('lots')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap py-1 ${
                activeTab === 'lots'
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 font-semibold'
                  : ''
              }`}
            >
              Available Lots
            </button>
            <button
              onClick={() => onSelectTab('map')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap py-1 ${
                activeTab === 'map'
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 font-semibold'
                  : ''
              }`}
            >
              Interactive Map
            </button>
            <button
              onClick={() => onSelectTab('calculator')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap py-1 ${
                activeTab === 'calculator'
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 font-semibold'
                  : ''
              }`}
            >
              Fee Estimator
            </button>
            <button
              onClick={() => onSelectTab('saved')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap py-1 ${
                activeTab === 'saved'
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 font-semibold'
                  : ''
              }`}
            >
              Saved Lots
            </button>
            <button
              onClick={() => onSelectTab('ev')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap py-1 ${
                activeTab === 'ev'
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 font-semibold'
                  : ''
              }`}
            >
              EV Stations
            </button>
          </nav>

          {/* Zone 3: Primary Action & Essential Utilities */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Live refresh indicator / manual trigger */}
            <button
              onClick={onManualRefresh}
              title="Click to refresh lots now"
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap h-9"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${
                  isRefreshing ? 'animate-spin' : ''
                }`}
              />
              <span className="hidden sm:inline">Refresh</span>
              <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {refreshSecondsLeft}s
              </span>
            </button>

            {/* Parking timer tool */}
            <button
              onClick={onOpenParkingTimer}
              title="Parked? Open grace timer"
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors h-9 w-9 flex items-center justify-center"
              aria-label="Parking duration timer"
            >
              <Clock className="w-4 h-4" />
            </button>

            {/* Developer Backend Guide */}
            <button
              onClick={onOpenBackendGuide}
              title="Backend Integration Blueprint"
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors h-9 w-9 flex items-center justify-center"
              aria-label="Backend integration guide"
            >
              <Code2 className="w-4 h-4" />
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors h-9 w-9 flex items-center justify-center"
              aria-label="Toggle color theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

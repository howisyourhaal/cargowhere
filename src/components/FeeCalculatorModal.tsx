import React, { useState, useId } from 'react';
import { Carpark } from '../types/carpark';
import { calculateParkingFee } from '../services/carparkService';
import { X, Calculator, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface FeeCalculatorModalProps {
  carparks: Carpark[];
  initialCarparkId?: string;
  onClose: () => void;
  onSelectCarparkDetail: (carpark: Carpark) => void;
}

export const FeeCalculatorModal: React.FC<FeeCalculatorModalProps> = ({
  carparks,
  initialCarparkId,
  onClose,
  onSelectCarparkDetail,
}) => {
  const carparkSelectId = useId();
  const daySelectId = useId();
  const entryTimeId = useId();
  const exitTimeId = useId();

  const [selectedId, setSelectedId] = useState<string>(
    initialCarparkId || (carparks[0]?.id ?? '')
  );

  const [entryTime, setEntryTime] = useState<string>('12:00');
  const [exitTime, setExitTime] = useState<string>('15:30');
  const [dayType, setDayType] = useState<'weekday' | 'saturday' | 'sunday'>('weekday');

  const targetCarpark = carparks.find((c) => c.id === selectedId) || carparks[0];

  const calculateResult = () => {
    if (!targetCarpark) return null;

    const [eH, eM] = entryTime.split(':').map(Number);
    const [xH, xM] = exitTime.split(':').map(Number);

    // Pick a base date matching the selected day type
    // Weekday: Wednesday, Saturday: Saturday, Sunday: Sunday
    const d = new Date();
    // Normalize to current week
    if (dayType === 'weekday') {
      d.setDate(d.getDate() + ((3 - d.getDay() + 7) % 7)); // Wednesday
    } else if (dayType === 'saturday') {
      d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7)); // Saturday
    } else {
      d.setDate(d.getDate() + ((0 - d.getDay() + 7) % 7)); // Sunday
    }

    const entryDate = new Date(d);
    entryDate.setHours(eH || 0, eM || 0, 0, 0);

    let exitDate = new Date(d);
    exitDate.setHours(xH || 0, xM || 0, 0, 0);

    if (exitDate.getTime() <= entryDate.getTime()) {
      exitDate = new Date(exitDate.getTime() + 24 * 60 * 60 * 1000);
    }

    return calculateParkingFee(targetCarpark, entryDate, exitDate);
  };

  const result = calculateResult();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="fee-calculator-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 id="fee-calculator-title" className="text-lg font-bold text-slate-900 dark:text-white">
                Singapore Parking Fee Estimator
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Calculates official HDB, URA, and Mall tariffs with grace period detection
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close fee estimator modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Carpark Picker */}
          <div>
            <label htmlFor={carparkSelectId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Carpark
            </label>
            <select
              id={carparkSelectId}
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {carparks.map((cp) => (
                <option key={cp.id} value={cp.id}>
                  {cp.name} ({cp.agency} · {cp.subDistrict}) — ${cp.rates.ratePerHourBase.toFixed(2)}/hr
                </option>
              ))}
            </select>
          </div>

          {/* Day of Week */}
          <div>
            <label htmlFor={daySelectId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Day of Visit
            </label>
            <div id={daySelectId} className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDayType('weekday')}
                className={`py-2 px-3 text-xs font-medium rounded-xl border transition-colors ${
                  dayType === 'weekday'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                Monday - Friday
              </button>
              <button
                type="button"
                onClick={() => setDayType('saturday')}
                className={`py-2 px-3 text-xs font-medium rounded-xl border transition-colors ${
                  dayType === 'saturday'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                Saturday
              </button>
              <button
                type="button"
                onClick={() => setDayType('sunday')}
                className={`py-2 px-3 text-xs font-medium rounded-xl border transition-colors ${
                  dayType === 'sunday'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                Sunday / PH
              </button>
            </div>
          </div>

          {/* Time Picker */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={entryTimeId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Entry Time
              </label>
              <input
                id={entryTimeId}
                type="time"
                value={entryTime}
                onChange={(e) => setEntryTime(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor={exitTimeId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Exit Time
              </label>
              <input
                id={exitTimeId}
                type="time"
                value={exitTime}
                onChange={(e) => setExitTime(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Calculation Result Showcase Card */}
          {result && (
            <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                    Estimated Total Fee
                  </span>
                  <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Duration: {Math.floor(result.totalDurationMinutes / 60)}h{' '}
                    {result.totalDurationMinutes % 60}m
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-extrabold font-mono text-emerald-700 dark:text-emerald-300 tabular-nums">
                    ${result.estimatedFee.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800/60 space-y-1">
                {result.breakdownNotes.map((note) => (
                  <div key={note} className="flex items-center gap-1.5 text-xs text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Carpark Rate Reference */}
          {targetCarpark && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1 text-slate-600 dark:text-slate-400">
              <div className="flex items-center justify-between font-medium text-slate-800 dark:text-slate-200">
                <span>Grace Period</span>
                <span className="font-mono">{targetCarpark.gracePeriodMinutes} mins free</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Weekday Peak Rate</span>
                <span>{targetCarpark.rates.weekdayPeak}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Sunday Scheme</span>
                <span>{targetCarpark.rates.sundayAndPh}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              if (targetCarpark) {
                onClose();
                onSelectCarparkDetail(targetCarpark);
              }
            }}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            View Full Carpark Details →
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useId } from 'react';
import { Carpark } from '../types/carpark';
import { calculateParkingFee } from '../services/carparkService';
import { X, Clock, Play, Square, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ParkingTimerModalProps {
  carparks: Carpark[];
  onClose: () => void;
}

interface ActiveParkingSession {
  carparkId: string;
  startTime: number; // timestamp
}

const STORAGE_SESSION_KEY = 'parksg_active_parking_session';

export const ParkingTimerModal: React.FC<ParkingTimerModalProps> = ({
  carparks,
  onClose,
}) => {
  const carparkSelectId = useId();
  const [selectedCarparkId, setSelectedCarparkId] = useState<string>(
    carparks[0]?.id ?? ''
  );
  const [session, setSession] = useState<ActiveParkingSession | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Update timer every second if session active
  useEffect(() => {
    if (!session) {
      setElapsedSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - session.startTime) / 1000);
      setElapsedSeconds(Math.max(0, diff));
    }, 1000);

    // Initial immediate set
    setElapsedSeconds(Math.max(0, Math.floor((Date.now() - session.startTime) / 1000)));

    return () => clearInterval(interval);
  }, [session]);

  const activeCarpark = session
    ? carparks.find((c) => c.id === session.carparkId) || carparks[0]
    : carparks.find((c) => c.id === selectedCarparkId) || carparks[0];

  const handleStartParking = () => {
    const newSession = {
      carparkId: selectedCarparkId,
      startTime: Date.now(),
    };
    setSession(newSession);
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(newSession));
  };

  const handleStopParking = () => {
    setSession(null);
    localStorage.removeItem(STORAGE_SESSION_KEY);
  };

  // Calculations
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const remainingGraceSec = activeCarpark
    ? Math.max(0, activeCarpark.gracePeriodMinutes * 60 - elapsedSeconds)
    : 0;
  const isGraceActive = remainingGraceSec > 0;

  // Running estimated fee
  let currentFee = 0;
  if (session && activeCarpark) {
    const entryDate = new Date(session.startTime);
    const exitDate = new Date();
    const result = calculateParkingFee(activeCarpark, entryDate, exitDate);
    currentFee = result.estimatedFee;
  }

  const formatHMS = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="parking-timer-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 id="parking-timer-title" className="text-lg font-bold text-slate-900 dark:text-white">
                Live Parking & Grace Timer
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track your parking duration & avoid overshooting grace period
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close parking timer modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!session ? (
            /* Setup session */
            <div className="space-y-4">
              <div>
                <label htmlFor={carparkSelectId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Where did you park?
                </label>
                <select
                  id={carparkSelectId}
                  value={selectedCarparkId}
                  onChange={(e) => setSelectedCarparkId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {carparks.map((cp) => (
                    <option key={cp.id} value={cp.id}>
                      {cp.name} ({cp.gracePeriodMinutes} mins grace · ${cp.rates.ratePerHourBase.toFixed(2)}/hr)
                    </option>
                  ))}
                </select>
              </div>

              {activeCarpark && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-medium">
                    <span>Complimentary Grace Period:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                      {activeCarpark.gracePeriodMinutes} minutes
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Hourly Rate:</span>
                    <span className="font-mono">${activeCarpark.rates.ratePerHourBase.toFixed(2)}/hr</span>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-700">
                    In Singapore, staying under the grace period incurs $0 charge. Once exceeded, standard
                    tariffs apply from the entry timestamp.
                  </p>
                </div>
              )}

              <button
                onClick={handleStartParking}
                className="w-full py-3.5 px-4 text-xs font-semibold text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Play className="w-4 h-4" />
                <span>Start Parking Session Now</span>
              </button>
            </div>
          ) : (
            /* Active Session View */
            <div className="space-y-5">
              <div className="text-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest block mb-1">
                  Elapsed Parking Time
                </span>
                <div className="text-4xl sm:text-5xl font-mono font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums my-2">
                  {formatHMS(elapsedSeconds)}
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Parked at <span className="font-semibold text-slate-800 dark:text-slate-200">{activeCarpark.name}</span>
                </div>
              </div>

              {/* Grace countdown bar */}
              <div
                className={`p-4 rounded-2xl border transition-colors ${
                  isGraceActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isGraceActive ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      {isGraceActive ? 'Complimentary Grace Window' : 'Grace Period Expired'}
                    </span>
                  </div>

                  <span className="text-xs font-mono font-bold tabular-nums">
                    {isGraceActive
                      ? `${Math.floor(remainingGraceSec / 60)}m ${remainingGraceSec % 60}s left`
                      : 'Fee accumulating'}
                  </span>
                </div>

                <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <span>Current Estimated Fee:</span>
                  <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                    ${currentFee.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Stop / Checkout Button */}
              <button
                onClick={handleStopParking}
                className="w-full py-3 px-4 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <Square className="w-4 h-4" />
                <span>End Parking Session</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

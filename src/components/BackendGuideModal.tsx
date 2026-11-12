import React, { useState, useEffect } from 'react';
import {
  X,
  Code2,
  Check,
  Copy,
  Server,
  ArrowRight,
  Database,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { getCustomBackendUrl, setCustomBackendUrl } from '../services/carparkService';

interface BackendGuideModalProps {
  onClose: () => void;
  onRefreshData: () => void;
}

export const BackendGuideModal: React.FC<BackendGuideModalProps> = ({
  onClose,
  onRefreshData,
}) => {
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [apiUrlInput, setApiUrlInput] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    const saved = getCustomBackendUrl();
    if (saved) {
      setApiUrlInput(saved);
    }
  }, []);

  const handleSaveApiUrl = () => {
    setCustomBackendUrl(apiUrlInput);
    onRefreshData();
  };

  const handleClearApiUrl = () => {
    setApiUrlInput('');
    setCustomBackendUrl(null);
    setTestStatus('idle');
    setTestMessage('');
    onRefreshData();
  };

  const handleTestConnection = async () => {
    if (!apiUrlInput.trim()) {
      setTestStatus('failed');
      setTestMessage('Please enter an API URL first.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Pinging endpoint...');

    try {
      const res = await fetch(apiUrlInput.trim(), {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setTestStatus('success');
        setTestMessage(`Connected! Received ${Array.isArray(data) ? data.length : 1} items.`);
        handleSaveApiUrl();
      } else {
        setTestStatus('failed');
        setTestMessage(`Server returned HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (err: unknown) {
      setTestStatus('failed');
      setTestMessage(
        err instanceof Error ? err.message : 'Failed to connect. Ensure CORS headers are enabled.'
      );
    }
  };

  const serverSnippet = `// Live endpoints already created in /api folder:
// 1. GET /api/health -> Health status and LTA key configuration check
// 2. GET /api/carparkavailablity -> Pulls live lots from LTA DataMall

// When ready, simply add your key to .env:
LTA_ACCOUNT_KEY="your_lta_account_key"

// The /api/carparkavailablity endpoint automatically reads LTA_ACCOUNT_KEY:
// Headers: AccountKey: <LTA_ACCOUNT_KEY>
// Endpoint: https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(serverSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="backend-guide-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-center">
              <Server className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 id="backend-guide-title" className="text-lg font-bold text-slate-900 dark:text-white">
                Backend Integration Blueprint
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ready for Singapore LTA DataMall & data.gov.sg real-time APIs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close backend integration modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Live Endpoint Hook */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
            <label className="block text-xs font-semibold text-slate-900 dark:text-white mb-1">
              Connect Your Backend API Endpoint
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              When your backend is ready, paste your endpoint here (e.g.,{' '}
              <code className="text-emerald-600 dark:text-emerald-400 font-mono">/api/carpark-availability</code>).
              The frontend will automatically switch to your live backend feed.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                placeholder="http://localhost:3000/api/carparks"
                value={apiUrlInput}
                onChange={(e) => setApiUrlInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={handleTestConnection}
                className="px-4 py-2.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors whitespace-nowrap shadow-xs"
              >
                {testStatus === 'testing' ? 'Testing...' : 'Test & Save'}
              </button>
              {apiUrlInput && (
                <button
                  onClick={handleClearApiUrl}
                  className="px-3 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Reset to Simulated
                </button>
              )}
            </div>

            {testStatus === 'success' && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{testMessage}</span>
              </div>
            )}
            {testStatus === 'failed' && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{testMessage}</span>
              </div>
            )}
          </div>

          {/* Official Singapore Sources */}
          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
              Official Singapore Data Feeds
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <a
                href="https://datamall.lta.gov.sg/content/datamall/en/dynamic-data.html"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition-colors flex items-start justify-between group"
              >
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    LTA DataMall
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block mt-0.5">
                    CarParkAvailabilityv2 (HDB, LTA, URA real-time lots refreshed every 1 min)
                  </span>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0 ml-2" />
              </a>

              <a
                href="https://data.gov.sg/datasets/d_23f063299f186914cf2c62c2626e2e28/view"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition-colors flex items-start justify-between group"
              >
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    data.gov.sg
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block mt-0.5">
                    HDB Carpark Information & real-time lot availability endpoint
                  </span>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0 ml-2" />
              </a>
            </div>
          </div>

          {/* Copy-paste Express Proxy Snippet */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-emerald-600" />
                <span>Express Server Proxy Snippet</span>
              </h3>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {copiedSnippet ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Snippet</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 bg-slate-950 text-slate-100 rounded-2xl text-[11px] font-mono overflow-x-auto leading-relaxed border border-slate-800">
              <code>{serverSnippet}</code>
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl transition-colors"
          >
            Close Blueprint
          </button>
        </div>
      </div>
    </div>
  );
};

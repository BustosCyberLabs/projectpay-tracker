import React, { useState } from 'react';
import { AppSettings, ThemeMode } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { Sun, Moon, Laptop, Trash2, CheckCircle2 } from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onResetAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetAllData,
}) => {
  const [taxPercent, setTaxPercent] = useState<string>(settings.taxReservePercent.toString());
  const [savedNotice, setSavedNotice] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);

  const handleTaxPercentBlur = () => {
    let parsed = parseFloat(taxPercent);
    if (isNaN(parsed) || parsed < 0) {
      parsed = 30;
      setTaxPercent('30');
    } else if (parsed > 100) {
      parsed = 100;
      setTaxPercent('100');
    }
    const safe = Math.round(parsed * 10) / 10;
    onUpdateSettings({ ...settings, taxReservePercent: safe });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleThemeChange = (theme: ThemeMode) => {
    onUpdateSettings({ ...settings, theme });
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto py-2">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Configure tax reserve percentages, appearance, and local storage options
        </p>
      </div>

      {savedNotice && (
        <div className="p-3 text-xs text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center gap-2 border border-slate-200 dark:border-slate-700 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Settings saved successfully.</span>
        </div>
      )}

      {/* Tax Reserve Percentage Setting */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Tax Reserve Percentage
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            The percentage of every payment automatically set aside under "Save for Taxes" (default is 30%).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-36">
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={taxPercent}
              onChange={(e) => setTaxPercent(e.target.value)}
              onBlur={handleTaxPercentBlur}
              className="w-full pr-8 pl-3 py-2 text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 font-bold">
              %
            </span>
          </div>

          <button
            type="button"
            onClick={handleTaxPercentBlur}
            className="px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 rounded-lg transition-colors"
          >
            Save Percentage
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Example: If a client pays you $1,000, setting 30% reserves $300 for taxes and keeps $700 available.
        </p>
      </section>

      {/* Appearance Setting */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Appearance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Choose your preferred color theme. This setting is remembered in your browser.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleThemeChange('system')}
            className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 text-xs transition-all ${
              settings.theme === 'system'
                ? 'border-slate-900 dark:border-white ring-1 ring-slate-900/10 dark:ring-white/20 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white font-semibold'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 font-medium'
            }`}
          >
            <Laptop className="w-5 h-5" />
            <span>System Default</span>
            {settings.theme === 'system' && (
              <span className="text-[10px] text-slate-600 dark:text-slate-300 font-medium">Active</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange('light')}
            className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 text-xs transition-all ${
              settings.theme === 'light'
                ? 'border-slate-900 dark:border-white ring-1 ring-slate-900/10 dark:ring-white/20 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white font-semibold'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 font-medium'
            }`}
          >
            <Sun className="w-5 h-5" />
            <span>Light Mode</span>
            {settings.theme === 'light' && (
              <span className="text-[10px] text-slate-600 dark:text-slate-300 font-medium">Active</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange('dark')}
            className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 text-xs transition-all ${
              settings.theme === 'dark'
                ? 'border-slate-900 dark:border-white ring-1 ring-slate-900/10 dark:ring-white/20 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white font-semibold'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 font-medium'
            }`}
          >
            <Moon className="w-5 h-5" />
            <span>Dark Mode</span>
            {settings.theme === 'dark' && (
              <span className="text-[10px] text-slate-600 dark:text-slate-300 font-medium">Active</span>
            )}
          </button>
        </div>
      </section>

      {/* Local Storage & Reset */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Local Data & Privacy
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            All your projects and payments are stored safely in your browser's local storage. No servers or accounts are used.
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Data & Reset
          </button>
        </div>
      </section>

      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title="Reset All Data?"
        message="This will permanently delete all projects, hours, and payment records from this browser. Make sure you have exported a JSON backup if you wish to keep your records."
        confirmLabel="Yes, Delete Everything"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={() => {
          onResetAllData();
          setIsResetConfirmOpen(false);
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};

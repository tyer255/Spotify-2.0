import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, Battery, BatteryCharging, BatteryFull, BatteryMedium, BatteryLow, BatteryWarning, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  onchargingchange: ((this: BatteryManager, ev: Event) => any) | null;
  onchargingtimechange: ((this: BatteryManager, ev: Event) => any) | null;
  ondischargingtimechange: ((this: BatteryManager, ev: Event) => any) | null;
  onlevelchange: ((this: BatteryManager, ev: Event) => any) | null;
}

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isRetrying, setIsRetrying] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Web Battery Status API integration with live event listeners
  useEffect(() => {
    let batteryInstance: BatteryManager | null = null;

    const setupBattery = async () => {
      try {
        const nav = navigator as unknown as { getBattery?: () => Promise<BatteryManager> };
        if (typeof nav.getBattery === 'function') {
          const battery = await nav.getBattery();
          batteryInstance = battery;
          setBatteryLevel(Math.round(battery.level * 100));
          setIsCharging(battery.charging);

          const handleLevelChange = () => {
            setBatteryLevel(Math.round(battery.level * 100));
          };

          const handleChargingChange = () => {
            setIsCharging(battery.charging);
          };

          battery.addEventListener('levelchange', handleLevelChange);
          battery.addEventListener('chargingchange', handleChargingChange);
        }
      } catch (err) {
        // Battery API may be restricted or unsupported on some platforms
      }
    };

    setupBattery();

    return () => {
      if (batteryInstance) {
        try {
          batteryInstance.removeEventListener('levelchange', () => {});
          batteryInstance.removeEventListener('chargingchange', () => {});
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      setIsOffline(!navigator.onLine);
      setIsRetrying(false);
    }, 1200);
  };

  const renderBatteryIcon = () => {
    if (isCharging) {
      return <BatteryCharging className="w-4 h-4 text-emerald-300 animate-pulse" />;
    }
    if (batteryLevel === null) {
      return <Battery className="w-4 h-4 text-neutral-200" />;
    }
    if (batteryLevel > 70) {
      return <BatteryFull className="w-4 h-4 text-emerald-300" />;
    }
    if (batteryLevel > 20) {
      return <BatteryMedium className="w-4 h-4 text-amber-200" />;
    }
    return <BatteryLow className="w-4 h-4 text-red-300 animate-pulse" />;
  };

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white text-xs px-3 sm:px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xl sticky top-0 z-40 backdrop-blur-md border-b border-amber-500/30"
        >
          {/* Left: Offline Status Message */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center flex-shrink-0">
              <WifiOff className="w-3.5 h-3.5 flex-shrink-0 animate-pulse text-amber-200" />
            </div>
            <span className="truncate font-medium">
              You are currently offline. Playing cached & downloaded songs.
            </span>
          </div>

          {/* Right: Device Battery Level & Retry Action */}
          <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
            {/* Battery Level Indicator */}
            {batteryLevel !== null ? (
              <div
                title={`Device Battery: ${batteryLevel}% ${isCharging ? '(Charging)' : ''}`}
                className="px-2.5 py-1 bg-black/30 hover:bg-black/40 border border-white/10 rounded-full flex items-center gap-1.5 text-[11px] font-semibold transition-all shadow-sm"
              >
                {renderBatteryIcon()}
                <span>{batteryLevel}%</span>
                {isCharging && (
                  <span className="text-[10px] text-emerald-300 flex items-center gap-0.5 ml-0.5">
                    <Zap className="w-2.5 h-2.5 fill-emerald-300" />
                    <span className="hidden md:inline">Charging</span>
                  </span>
                )}
              </div>
            ) : (
              <div
                title="Battery Status (Offline playback active)"
                className="px-2.5 py-1 bg-black/25 border border-white/10 rounded-full flex items-center gap-1 text-[11px] font-medium"
              >
                <Battery className="w-3.5 h-3.5 text-neutral-300" />
                <span className="text-neutral-300">Offline Mode</span>
              </div>
            )}

            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 active:scale-95 rounded-full font-semibold flex items-center gap-1.5 transition-all text-[11px] cursor-pointer shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Checking...' : 'Retry Online'}</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

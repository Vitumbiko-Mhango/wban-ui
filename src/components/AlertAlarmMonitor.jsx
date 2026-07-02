import { useCallback, useEffect, useRef, useState } from "react";
import { BellRing, Volume2 } from "lucide-react";
import client from "../api/client";

const POLL_MS = 10_000;
const WARNING_DURATION_MS = 6_000;
const ALERT_PAGE_SIZE = 500;

const getUnresolvedAlarmAlerts = (alerts) =>
  alerts.filter(
    (alert) =>
      !alert.is_resolved &&
      ["critical", "warning"].includes(String(alert.severity).toLowerCase()),
  );

const AlertAlarmMonitor = () => {
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [activeCriticalCount, setActiveCriticalCount] = useState(0);
  const [alarmError, setAlarmError] = useState("");
  const audioContextRef = useRef(null);
  const criticalIntervalRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const warningIntervalRef = useRef(null);
  const warningStartingRef = useRef(false);
  const knownWarningIdsRef = useRef(new Set());
  const activeCriticalIdsRef = useRef(new Set());
  const latestAlertsRef = useRef([]);

  const ensureAudioContext = useCallback(async () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      setAlarmError("This browser does not support alarm audio.");
      return null;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }

    try {
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }
    } catch {
      setIsAudioReady(false);
      setAlarmError("Browser blocked alarm sound. Click Enable alarm sound.");
      return audioContextRef.current;
    }

    setIsAudioReady(audioContextRef.current.state === "running");
    if (audioContextRef.current.state === "running") setAlarmError("");
    return audioContextRef.current;
  }, []);

  const playTone = useCallback(
    async ({ frequency = 880, duration = 180, volume = 0.14 } = {}) => {
      const context = await ensureAudioContext();
      if (!context || context.state !== "running") {
        setAlarmError("Browser blocked alarm sound. Click Enable alarm sound.");
        return false;
      }

      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const now = context.currentTime;

      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration / 1000);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + duration / 1000 + 0.03);
      return true;
    },
    [ensureAudioContext],
  );

  const playTestSound = useCallback(async () => {
    const firstTone = await playTone({
      frequency: 980,
      duration: 300,
      volume: 0.45,
    });
    window.setTimeout(() => {
      playTone({ frequency: 720, duration: 300, volume: 0.45 });
    }, 360);
    return firstTone;
  }, [playTone]);

  const stopWarningAlarm = useCallback(() => {
    window.clearTimeout(warningTimeoutRef.current);
    window.clearInterval(warningIntervalRef.current);
    warningTimeoutRef.current = null;
    warningIntervalRef.current = null;
    warningStartingRef.current = false;
  }, []);

  const stopCriticalAlarm = useCallback(() => {
    window.clearInterval(criticalIntervalRef.current);
    criticalIntervalRef.current = null;
    setActiveCriticalCount(0);
  }, []);

  const startWarningAlarm = useCallback(async () => {
    if (
      warningStartingRef.current ||
      warningIntervalRef.current ||
      criticalIntervalRef.current
    ) {
      return;
    }

    warningStartingRef.current = true;
    const context = await ensureAudioContext();
    if (context?.state !== "running" || criticalIntervalRef.current) {
      warningStartingRef.current = false;
      return;
    }

    playTone({ frequency: 720, duration: 180, volume: 0.22 });
    warningIntervalRef.current = window.setInterval(() => {
      playTone({ frequency: 720, duration: 180, volume: 0.22 });
    }, 650);

    warningTimeoutRef.current = window.setTimeout(() => {
      stopWarningAlarm();
    }, WARNING_DURATION_MS);
  }, [ensureAudioContext, playTone, stopWarningAlarm]);

  const startCriticalAlarm = useCallback(
    async (count) => {
      setActiveCriticalCount(count);
      const context = await ensureAudioContext();
      if (context?.state !== "running") return;
      if (criticalIntervalRef.current) return;

      stopWarningAlarm();
      let highTone = true;
      playTone({ frequency: 1040, duration: 260, volume: 0.35 });
      criticalIntervalRef.current = window.setInterval(() => {
        playTone({
          frequency: highTone ? 1040 : 780,
          duration: 260,
          volume: 0.35,
        });
        highTone = !highTone;
      }, 520);
    },
    [ensureAudioContext, playTone, stopWarningAlarm],
  );

  const processAlerts = useCallback(
    (alerts) => {
      const alarmAlerts = getUnresolvedAlarmAlerts(alerts);
      latestAlertsRef.current = alarmAlerts;
      const criticalAlerts = alarmAlerts.filter(
        (alert) => String(alert.severity).toLowerCase() === "critical",
      );
      const warningAlerts = alarmAlerts.filter(
        (alert) => String(alert.severity).toLowerCase() === "warning",
      );

      activeCriticalIdsRef.current = new Set(criticalAlerts.map((alert) => alert.id));

      warningAlerts.forEach((alert) => {
        if (!knownWarningIdsRef.current.has(alert.id)) {
          knownWarningIdsRef.current.add(alert.id);
          startWarningAlarm();
        }
      });

      if (criticalAlerts.length > 0) {
        startCriticalAlarm(criticalAlerts.length);
      } else {
        activeCriticalIdsRef.current.clear();
        stopCriticalAlarm();
      }
    },
    [startCriticalAlarm, startWarningAlarm, stopCriticalAlarm],
  );

  const fetchAlerts = useCallback(async () => {
    try {
      const { data } = await client.get("/alerts/", {
        params: { page_size: ALERT_PAGE_SIZE, is_resolved: false },
      });
      processAlerts(data?.results ?? data ?? []);
      setAlarmError("");
    } catch (err) {
      setAlarmError(
        err.response?.status === 401
          ? "Alarm monitor is not authorized to read alerts."
          : "Could not check active alerts for the alarm.",
      );
    }
  }, [processAlerts]);

  const enableAlarmSound = useCallback(async () => {
    const context = await ensureAudioContext();
    if (context?.state !== "running") return;

    await playTestSound();
    processAlerts(latestAlertsRef.current);
    fetchAlerts();
  }, [ensureAudioContext, fetchAlerts, playTestSound, processAlerts]);

  useEffect(() => {
    fetchAlerts();
    const interval = window.setInterval(fetchAlerts, POLL_MS);
    return () => window.clearInterval(interval);
  }, [fetchAlerts]);

  useEffect(() => {
    const unlockAudio = () => {
      enableAlarmSound();
    };

    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, [enableAlarmSound]);

  useEffect(() => {
    const handleResolved = (event) => {
      const id = event.detail?.id;
      if (!id) return;

      activeCriticalIdsRef.current.delete(id);
      if (activeCriticalIdsRef.current.size === 0) {
        stopCriticalAlarm();
      } else {
        setActiveCriticalCount(activeCriticalIdsRef.current.size);
      }
    };

    window.addEventListener("wban:alert-resolved", handleResolved);
    return () => window.removeEventListener("wban:alert-resolved", handleResolved);
  }, [stopCriticalAlarm]);

  useEffect(
    () => () => {
      stopCriticalAlarm();
      stopWarningAlarm();
      audioContextRef.current?.close?.();
    },
    [stopCriticalAlarm, stopWarningAlarm],
  );

  if (isAudioReady && activeCriticalCount === 0 && !alarmError) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {!isAudioReady && (
        <button
          type="button"
          onClick={enableAlarmSound}
          className="inline-flex items-center gap-2 rounded-md border border-warning-a10 bg-warning-a20 px-3 py-2 text-sm font-medium text-warning-a0 shadow-lg transition-colors hover:bg-warning-a10/20 focus:outline-none focus:ring-2 focus:ring-warning-a10/30"
        >
          <Volume2 className="size-4" />
          Enable alarm sound
        </button>
      )}

      {activeCriticalCount > 0 && (
        <div className="flex max-w-sm flex-col items-end gap-2 rounded-md border border-danger-a10 bg-danger-a20 px-3 py-2 text-sm text-danger-a10 shadow-lg">
          <div className="inline-flex items-center gap-2 font-bold">
            <BellRing className="size-4 animate-pulse" />
            Critical alarm active ({activeCriticalCount})
          </div>
          <button
            type="button"
            onClick={playTestSound}
            className="inline-flex items-center gap-2 rounded border border-danger-a10/50 bg-surface-a0 px-2 py-1 text-xs font-bold text-danger-a10 transition-colors hover:bg-danger-a20"
          >
            <Volume2 className="size-3.5" />
            Test sound
          </button>
        </div>
      )}

      {alarmError && (
        <div className="max-w-sm rounded-md border border-warning-a10 bg-warning-a20 px-3 py-2 text-right text-xs font-medium text-warning-a0 shadow-lg">
          {alarmError}
        </div>
      )}
    </div>
  );
};

export default AlertAlarmMonitor;

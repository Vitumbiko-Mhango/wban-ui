/**
 * src/pages/staff/Alerts.jsx  (REPLACE YOUR EXISTING FILE)
 *
 * Changes from original:
 *  - Loads alerts from GET /api/alerts/
 *  - Acknowledge: POST /api/alerts/{id}/acknowledge/
 *  - Resolve: POST /api/alerts/{id}/resolve/
 *  - Auto-refreshes every 30 seconds
 */

import { useState, useMemo, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import Heading from "../../components/common/Heading";
import client from "../../api/client";

const SEVERITY_STYLES = {
  critical: { badge: "bg-danger-a20 text-danger-a10" },
  warning: { badge: "bg-warning-a20 text-warning-a10" },
  normal: { badge: "bg-primary-a20/20 text-primary-a20" },
  resolved: { badge: "bg-success-a20 text-success-a10" },
};

const FILTERS = ["all", "critical", "warning", "normal"];

// Format an alert from the backend into what the UI expects
const normalize = (a) => ({
  id: a.id,
  patient: a.patient_name ?? `Patient ${a.patient}`,
  ward: a.patient_ward ?? a.ward ?? "",
  severity: a.is_resolved ? "resolved" : a.severity,
  message: a.message,
  time: new Date(a.created_at).toLocaleTimeString(),
  vitals: {
    HR: a.heart_rate ? `${a.heart_rate} bpm` : "—",
    SpO2: a.spo2 ? `${a.spo2}%` : "—",
    Temp: a.temperature ? `${a.temperature}°C` : "—",
  },
  is_resolved: a.is_resolved,
  acknowledged_at: a.acknowledged_at,
});

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchAlerts = useCallback(async () => {
    try {
      const { data } = await client.get("/alerts/?page_size=50");
      const list = data?.results ?? data ?? [];
      setAlerts(list.map(normalize));
    } catch {
      // keep existing data on refresh failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30_000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const stats = useMemo(
    () => ({
      critical: alerts.filter((a) => a.severity === "critical").length,
      warning: alerts.filter((a) => a.severity === "warning").length,
      normal: alerts.filter((a) => a.severity === "normal").length,
      resolved: alerts.filter((a) => a.severity === "resolved").length,
    }),
    [alerts],
  );

  const visible = useMemo(
    () =>
      alerts.filter((a) => {
        const matchFilter = filter === "all" || a.severity === filter;
        const q = search.toLowerCase();
        const matchSearch =
          !q ||
          a.patient.toLowerCase().includes(q) ||
          a.message.toLowerCase().includes(q) ||
          a.ward.toLowerCase().includes(q);
        return matchFilter && matchSearch;
      }),
    [alerts, filter, search],
  );

  const handleAcknowledge = async (id) => {
    await client.post(`/alerts/${id}/acknowledge/`);
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, acknowledged_at: new Date().toISOString() } : a,
      ),
    );
  };

  const handleResolve = async (id) => {
    await client.post(`/alerts/${id}/resolve/`);
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, severity: "resolved", is_resolved: true } : a,
      ),
    );
  };

  return (
    <div className="space-y-6">
      <Heading
        title="Alerts"
        subtitle="Monitor and manage patient alerts in real-time"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Critical alerts",
            value: stats.critical,
            color: "text-danger-a10",
          },
          {
            label: "Warnings",
            value: stats.warning,
            color: "text-warning-a10",
          },
          { label: "Normal", value: stats.normal, color: "text-primary-a20" },
          {
            label: "Resolved today",
            value: stats.resolved,
            color: "text-success-a10",
          },
        ].map((s) => (
          <div key={s.label} className="bg-surface-a20 rounded-lg p-4">
            <p className="text-xs text-dark-a0/50 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-dark-a0/40" />
          <input
            type="search"
            placeholder="Search patient or alert..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 w-full border border-surface-a30 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-a20 focus:border-primary-a20"
          />
        </div>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-sm px-3 py-2 rounded-md border transition-colors duration-150 capitalize cursor-pointer ${
              filter === f
                ? "bg-primary-a20/10 font-medium text-primary-a20 border-primary-a20/30"
                : "bg-transparent text-dark-a0/60 border-surface-a30 hover:bg-surface-a20"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Alert list */}
      {loading && (
        <p className="text-center text-sm text-dark-a0/50 py-12">
          Loading alerts…
        </p>
      )}

      <div className="space-y-3">
        {!loading && visible.length === 0 && (
          <p className="text-center text-sm text-dark-a0/50 py-12">
            No alerts match your filter.
          </p>
        )}
        {visible.map((alert) => {
          const s = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.normal;
          return (
            <div
              key={alert.id}
              className="flex items-start gap-4 bg-white border border-surface-a30 rounded-lg p-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-medium text-dark-a0">
                    {alert.patient}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.badge}`}
                  >
                    {alert.severity}
                  </span>
                  {alert.severity === "critical" && (
                    <span className="size-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                  <span className="text-xs text-dark-a0/40 ml-auto">
                    {alert.time}
                  </span>
                </div>
                <p className="text-sm text-dark-a0 mb-2">{alert.message}</p>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(alert.vitals).map(([k, v]) => (
                    <span key={k} className="text-xs text-dark-a0/50">
                      {k} <span className="text-dark-a0 font-medium">{v}</span>
                    </span>
                  ))}
                  {alert.ward && (
                    <span className="text-xs text-dark-a0/50">
                      {alert.ward}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 shrink-0">
                {alert.severity === "resolved" ? (
                  <span className="text-xs text-dark-a0/40 px-3 py-1.5 border border-surface-a30 rounded-md">
                    Resolved
                  </span>
                ) : (
                  <>
                    {!alert.acknowledged_at && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="text-xs font-medium px-3 py-1.5 rounded-md bg-warning-a20 text-warning-a0 border border-warning-a10 hover:bg-warning-a10/20 transition-colors cursor-pointer"
                      >
                        Acknowledge
                      </button>
                    )}
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="text-xs font-medium px-3 py-1.5 rounded-md bg-primary-a20/10 text-primary-a20 border border-primary-a20/30 hover:bg-primary-a20/20 transition-colors cursor-pointer"
                    >
                      Resolve
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Alerts;

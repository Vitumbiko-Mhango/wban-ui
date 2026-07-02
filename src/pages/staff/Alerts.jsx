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
import {
  Activity,
  CheckCircle2,
  Clock,
  HeartPulse,
  MapPin,
  Search,
  Thermometer,
  UserRound,
} from "lucide-react";
import { useSearchParams } from "react-router";
import Heading from "../../components/common/Heading";
import client from "../../api/client";

const SEVERITY_STYLES = {
  critical: { badge: "bg-danger-a20 text-danger-a10" },
  warning: { badge: "bg-warning-a20 text-warning-a10" },
  normal: { badge: "bg-primary-a20/20 text-primary-a20" },
  resolved: { badge: "bg-success-a20 text-success-a10" },
};

const FILTERS = ["all", "critical", "warning", "normal", "resolved"];
const STATUS_FILTERS = ["all", "unresolved", "resolved"];
const VITAL_ICONS = {
  HR: HeartPulse,
  SpO2: Activity,
  Temp: Thermometer,
};

const cleanVital = (value) =>
  String(value)
    .replace(/\u00e2\u20ac\u201d/g, "-")
    .replace(/\u00c2\u00b0C/g, " C");

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
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSeverity = searchParams.get("severity");
  const initialStatus = searchParams.get("status");
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(
    FILTERS.includes(initialSeverity) ? initialSeverity : "all",
  );
  const [statusFilter, setStatusFilter] = useState(
    STATUS_FILTERS.includes(initialStatus) ? initialStatus : "all",
  );
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

  useEffect(() => {
    const next = {};
    if (filter !== "all") next.severity = filter;
    if (statusFilter !== "all") next.status = statusFilter;
    setSearchParams(next, { replace: true });
  }, [filter, statusFilter, setSearchParams]);

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
        const matchStatus =
          statusFilter === "all" ||
          (statusFilter === "unresolved" && !a.is_resolved) ||
          (statusFilter === "resolved" && a.is_resolved);
        const q = search.toLowerCase();
        const matchSearch =
          !q ||
          a.patient.toLowerCase().includes(q) ||
          a.message.toLowerCase().includes(q) ||
          a.ward.toLowerCase().includes(q);
        return matchFilter && matchStatus && matchSearch;
      }),
    [alerts, filter, search, statusFilter],
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
    window.dispatchEvent(new CustomEvent("wban:alert-resolved", { detail: { id } }));
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
            severity: "critical",
            status: "unresolved",
          },
          {
            label: "Warnings",
            value: stats.warning,
            color: "text-warning-a10",
            severity: "warning",
            status: "unresolved",
          },
          {
            label: "Normal",
            value: stats.normal,
            color: "text-primary-a20",
            severity: "normal",
            status: "unresolved",
          },
          {
            label: "Resolved today",
            value: stats.resolved,
            color: "text-success-a10",
            severity: "resolved",
            status: "resolved",
          },
        ].map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => {
              setFilter(s.severity);
              setStatusFilter(s.status);
            }}
            className={`bg-surface-a20 rounded-lg p-4 text-left transition-all duration-150 cursor-pointer hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-a20/30 ${
              filter === s.severity && statusFilter === s.status
                ? "ring-1 ring-primary-a20/30 border border-primary-a20/30"
                : "border border-transparent"
            }`}
          >
            <p className="text-xs text-dark-a0/50 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </button>
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
        <span className="h-6 w-px bg-surface-a30 mx-1" />
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`text-sm px-3 py-2 rounded-md border transition-colors duration-150 capitalize cursor-pointer ${
              statusFilter === f
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
            <div key={alert.id} className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <article className="rounded-lg border border-surface-a30 bg-surface-a0 p-4 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-a20 text-primary-a20">
                      <UserRound className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-bold text-dark-a0">
                          {alert.patient}
                        </h3>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${s.badge}`}
                        >
                          {alert.severity}
                        </span>
                        {alert.severity === "critical" && (
                          <span className="size-2 rounded-full bg-red-500 animate-pulse" />
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-dark-a0/45">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3.5" />
                          {alert.time}
                        </span>
                        {alert.ward && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3.5" />
                            {alert.ward}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {alert.acknowledged_at && !alert.is_resolved && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-warning-a10 bg-warning-a20 px-2 py-1 text-xs font-medium text-warning-a0">
                      <CheckCircle2 className="size-3.5" />
                      Acknowledged by nurse
                    </span>
                  )}
                </div>

                <p className="mt-4 text-sm leading-6 text-dark-a0">
                  {alert.message}
                </p>
              </article>

              <aside className="rounded-lg border border-surface-a30 bg-surface-a10 p-4 shadow-sm">
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(alert.vitals).map(([k, v]) => {
                    const VitalIcon = VITAL_ICONS[k] ?? Activity;
                    return (
                      <div
                        key={k}
                        className="rounded-md border border-surface-a30 bg-surface-a0 px-3 py-2"
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-medium text-dark-a0/45">
                            {k}
                          </span>
                          <VitalIcon className="size-3.5 text-primary-a20" />
                        </div>
                        <p className="truncate text-sm font-bold text-dark-a0">
                          {cleanVital(v)}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {alert.severity === "resolved" ? (
                    <span className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-success-a10 bg-success-a20 px-3 py-2 text-xs font-medium text-success-a10">
                      <CheckCircle2 className="size-3.5" />
                      Resolved
                    </span>
                  ) : (
                    <>
                      {!alert.acknowledged_at && (
                        <button
                          onClick={() => handleAcknowledge(alert.id)}
                          className="flex-1 rounded-md border border-warning-a10 bg-warning-a20 px-3 py-2 text-xs font-medium text-warning-a0 transition-colors hover:bg-warning-a10/20 cursor-pointer"
                        >
                          Acknowledge
                        </button>
                      )}
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="flex-1 rounded-md border border-primary-a20/30 bg-primary-a20/10 px-3 py-2 text-xs font-medium text-primary-a20 transition-colors hover:bg-primary-a20/20 cursor-pointer"
                      >
                        Resolve
                      </button>
                    </>
                  )}
                </div>
              </aside>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Alerts;

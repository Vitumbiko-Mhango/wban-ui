import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  Download,
  FileText,
  KeyRound,
  Search,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import Heading from "../../components/common/Heading";
import client from "../../api/client";
import { formatDate } from "../../utils/DateFormatter";

const SENSITIVE_RESOURCES = new Set([
  "User",
  "Patient",
  "Alert",
  "AlertThreshold",
  "Device",
  "WardTransfer",
  "NEWS2Score",
  "ShiftHandoverNote",
]);

const RESOURCE_LABELS = {
  User: "User administration",
  Patient: "Patient records",
  Alert: "Clinical alerts",
  AlertThreshold: "Alert thresholds",
  Device: "Device access",
  WardTransfer: "Ward transfers",
  NEWS2Score: "NEWS2 scoring",
  ShiftHandoverNote: "Shift handovers",
};

const ACTION_STYLES = {
  login: "bg-primary-a20/10 text-primary-a20",
  logout: "bg-surface-a20 text-dark-a0/70",
  create: "bg-success-a20 text-success-a0",
  update: "bg-warning-a20 text-warning-a0",
  delete: "bg-danger-a20 text-danger-a0",
  view: "bg-primary-a20/10 text-primary-a20",
};

const CATEGORY_META = {
  auth: {
    label: "Authentication",
    icon: KeyRound,
    className: "bg-primary-a20/10 text-primary-a20",
  },
  users: {
    label: "Users",
    icon: UserCog,
    className: "bg-warning-a20 text-warning-a0",
  },
  clinical: {
    label: "Clinical records",
    icon: Activity,
    className: "bg-danger-a20 text-danger-a0",
  },
  devices: {
    label: "Devices",
    icon: ShieldCheck,
    className: "bg-success-a20 text-success-a0",
  },
  exports: {
    label: "Exports",
    icon: Download,
    className: "bg-primary-a20/10 text-primary-a20",
  },
  system: {
    label: "System changes",
    icon: FileText,
    className: "bg-surface-a20 text-dark-a0/70",
  },
};

const isSensitiveLog = (log) => {
  const action = String(log.action || "").toLowerCase();
  const resource = log.resource || "";
  const description = String(log.description || "").toLowerCase();

  if (action === "view") return description.includes("exported");
  if (action === "login" || action === "logout") return true;
  if (SENSITIVE_RESOURCES.has(resource)) return true;

  return [
    "password",
    "admin",
    "locked",
    "threshold",
    "paired",
    "unpaired",
    "discharged",
    "archived",
    "readmitted",
    "deleted",
    "registered",
    "exported",
  ].some((term) => description.includes(term));
};

const getCategory = (log) => {
  const action = String(log.action || "").toLowerCase();
  const resource = log.resource || "";
  const description = String(log.description || "").toLowerCase();

  if (description.includes("exported") || action === "view") return "exports";
  if (action === "login" || action === "logout" || description.includes("password")) {
    return "auth";
  }
  if (resource === "User") return "users";
  if (resource === "Device") return "devices";
  if (["Patient", "Alert", "AlertThreshold", "WardTransfer", "NEWS2Score", "ShiftHandoverNote"].includes(resource)) {
    return "clinical";
  }
  return "system";
};

const getResourceLabel = (resource) => RESOURCE_LABELS[resource] || resource || "System";

const getActionLabel = (log) =>
  log.action_display || String(log.action || "event").replaceAll("_", " ");

const getDateBoundary = (value, endOfDay = false) => {
  if (!value) return null;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const StatCard = ({ label, value, icon: Icon, className, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`min-h-28 w-full rounded-lg border bg-surface-a0 p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-a20 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-a20/30 ${
      active ? "border-primary-a20 ring-2 ring-primary-a20/20" : "border-surface-a30"
    }`}
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-medium uppercase text-dark-a0/50">{label}</p>
        <p className="mt-2 text-2xl font-bold text-dark-a0">{value}</p>
      </div>
      <span className={`inline-flex size-9 items-center justify-center rounded-md ${className}`}>
        <Icon className="size-4" />
      </span>
    </div>
  </button>
);

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await client.get("/logs/", {
          params: { page_size: 500 },
        });
        setLogs(data?.results ?? data ?? []);
      } catch {
        setError("Failed to load audit logs.");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const sensitiveLogs = useMemo(() => logs.filter(isSensitiveLog), [logs]);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    const startBoundary = getDateBoundary(startDate);
    const endBoundary = getDateBoundary(endDate, true);

    return sensitiveLogs.filter((log) => {
      const category = getCategory(log);
      const logDate = new Date(log.timestamp);
      const matchesAction = actionFilter === "all" || log.action === actionFilter;
      const matchesCategory = categoryFilter === "all" || category === categoryFilter;
      const matchesStart =
        !startBoundary ||
        (!Number.isNaN(logDate.getTime()) && logDate >= startBoundary);
      const matchesEnd =
        !endBoundary || (!Number.isNaN(logDate.getTime()) && logDate <= endBoundary);
      const matchesSearch =
        !query ||
        [
          log.user_name,
          log.action,
          getActionLabel(log),
          log.resource,
          getResourceLabel(log.resource),
          log.description,
          log.ip_address,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      return (
        matchesAction &&
        matchesCategory &&
        matchesStart &&
        matchesEnd &&
        matchesSearch
      );
    });
  }, [actionFilter, categoryFilter, endDate, search, sensitiveLogs, startDate]);

  const summary = useMemo(() => {
    const counts = sensitiveLogs.reduce(
      (acc, log) => {
        const category = getCategory(log);
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      },
      { auth: 0, users: 0, clinical: 0, devices: 0, exports: 0 },
    );

    return {
      total: sensitiveLogs.length,
      auth: counts.auth,
      clinical: counts.clinical,
      exports: counts.exports,
    };
  }, [sensitiveLogs]);

  const actions = useMemo(
    () => Array.from(new Set(sensitiveLogs.map((log) => log.action).filter(Boolean))).sort(),
    [sensitiveLogs],
  );

  return (
    <div className="space-y-6">
      <Heading
        title="Audit Logs"
        subtitle="Sensitive access, patient, device, threshold and export activity."
      />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger-a0">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Sensitive events"
          value={summary.total}
          icon={ShieldCheck}
          className="bg-primary-a20/10 text-primary-a20"
          active={categoryFilter === "all"}
          onClick={() => setCategoryFilter("all")}
        />
        <StatCard
          label="Auth changes"
          value={summary.auth}
          icon={KeyRound}
          className="bg-warning-a20 text-warning-a0"
          active={categoryFilter === "auth"}
          onClick={() => setCategoryFilter("auth")}
        />
        <StatCard
          label="Clinical events"
          value={summary.clinical}
          icon={Activity}
          className="bg-danger-a20 text-danger-a0"
          active={categoryFilter === "clinical"}
          onClick={() => setCategoryFilter("clinical")}
        />
        <StatCard
          label="Data exports"
          value={summary.exports}
          icon={Download}
          className="bg-success-a20 text-success-a0"
          active={categoryFilter === "exports"}
          onClick={() => setCategoryFilter("exports")}
        />
      </div>

      <section className="rounded-lg border border-surface-a30 bg-surface-a0 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-surface-a30 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-dark-a0">Sensitive Activity</h2>
            <p className="mt-1 text-sm text-dark-a0/55">
              {loading ? "Loading audit events..." : `${filteredLogs.length} records shown`}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[760px] xl:grid-cols-5">
            <div className="relative sm:col-span-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dark-a0/40" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search logs"
                className="w-full rounded-md border border-surface-a30 bg-surface-a0 py-2 pl-9 pr-3 text-sm text-dark-a0 outline-none transition-colors focus:border-primary-a20 focus:ring-1 focus:ring-primary-a20"
              />
            </div>

            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dark-a0/40" />
              <input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => setStartDate(event.target.value)}
                aria-label="Start date"
                className="w-full rounded-md border border-surface-a30 bg-surface-a0 py-2 pl-9 pr-3 text-sm text-dark-a0 outline-none transition-colors focus:border-primary-a20 focus:ring-1 focus:ring-primary-a20"
              />
            </div>

            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dark-a0/40" />
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => setEndDate(event.target.value)}
                aria-label="End date"
                className="w-full rounded-md border border-surface-a30 bg-surface-a0 py-2 pl-9 pr-3 text-sm text-dark-a0 outline-none transition-colors focus:border-primary-a20 focus:ring-1 focus:ring-primary-a20"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-md border border-surface-a30 bg-surface-a0 px-3 py-2 text-sm text-dark-a0 outline-none transition-colors focus:border-primary-a20 focus:ring-1 focus:ring-primary-a20"
            >
              <option value="all">All categories</option>
              {Object.entries(CATEGORY_META).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>

            <select
              value={actionFilter}
              onChange={(event) => setActionFilter(event.target.value)}
              className="rounded-md border border-surface-a30 bg-surface-a0 px-3 py-2 text-sm text-dark-a0 outline-none transition-colors focus:border-primary-a20 focus:ring-1 focus:ring-primary-a20"
            >
              <option value="all">All actions</option>
              {actions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>

          {(startDate || endDate) && (
            <div className="flex justify-end lg:hidden">
              <button
                type="button"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="text-sm font-medium text-primary-a20 hover:underline"
              >
                Clear date filter
              </button>
            </div>
          )}
        </div>

        {(startDate || endDate) && (
          <div className="hidden border-b border-surface-a30 px-4 py-2 text-right lg:block">
            <button
              type="button"
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="text-sm font-medium text-primary-a20 hover:underline"
            >
              Clear date filter
            </button>
          </div>
        )}

        <div className="overflow-x-auto p-4">
          <table className="min-w-full divide-y divide-surface-a30 text-sm">
            <thead className="bg-surface-a20">
              <tr>
                {["Time", "User", "Category", "Action", "Details", "IP Address"].map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-xs font-bold uppercase text-dark-a0/70"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-a30">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-dark-a0/55">
                    Loading audit logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-dark-a0/55">
                    No sensitive audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const category = getCategory(log);
                  const categoryMeta = CATEGORY_META[category] || CATEGORY_META.system;
                  const CategoryIcon = categoryMeta.icon;

                  return (
                    <tr key={log.id} className="hover:bg-surface-a10">
                      <td className="whitespace-nowrap px-4 py-4 text-dark-a0/70">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-medium text-dark-a0">
                        {log.user_name || `User #${log.user || "unknown"}`}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${categoryMeta.className}`}
                        >
                          <CategoryIcon className="size-3.5" />
                          {categoryMeta.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
                            ACTION_STYLES[log.action] || ACTION_STYLES.update
                          }`}
                        >
                          {getActionLabel(log)}
                        </span>
                      </td>
                      <td className="min-w-[320px] px-4 py-4">
                        <p className="font-medium text-dark-a0">
                          {getResourceLabel(log.resource)}
                        </p>
                        <p className="mt-1 text-dark-a0/60">
                          {log.description || "No description recorded."}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-mono text-xs text-dark-a0/60">
                        {log.ip_address || "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AuditLogs;

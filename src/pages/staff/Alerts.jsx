import { useState, useMemo } from "react";
import {
  Search,
  Activity,
  AlertTriangle,
  Info,
  CheckCircle,
} from "lucide-react";
import Heading from "../../components/common/Heading";

const SEVERITY_STYLES = {
  critical: {
    badge: "bg-danger-a10/20 text-danger-a0",
    dot: true,
  },
  warning: {
    badge: "bg-warning-a10/20 text-warning-a0",
  },
  info: {
    badge: "bg-primary-a20/20 text-primary-a20",
  },
  resolved: {
    badge: "bg-success-a10/20 text-success-a0",
  },
};

const INITIAL_ALERTS = [
  {
    id: 1,
    patient: "Chisomo Banda",
    initials: "CB",
    ward: "Ward 3 · Bed 12",
    severity: "critical",
    message: "TEMP dropped to 84% — oxygen saturation critically low",
    vitals: { HR: "112 bpm", TEMP: "84%", BP: "148/92" },
    time: "2 min ago",
  },
  {
    id: 2,
    patient: "Tadala Phiri",
    initials: "TP",
    ward: "Ward 1 · Bed 4",
    severity: "critical",
    message: "Heart rate 138 bpm — tachycardia detected",
    vitals: { HR: "138 bpm", TEMP: "38.9 °C", BP: "162/104" },
    time: "5 min ago",
  },
  {
    id: 3,
    patient: "Mphatso Gondwe",
    initials: "MG",
    ward: "Ward 2 · Bed 7",
    severity: "warning",
    message: "Blood pressure elevated at 158/98 mmHg",
    vitals: { HR: "88 bpm", TEMP: "38.5 °C", BP: "158/98" },
    time: "11 min ago",
  },
  {
    id: 4,
    patient: "Kondwani Mwale",
    initials: "KM",
    ward: "ICU · Bed 2",
    severity: "critical",
    message: "Respiratory rate 28 breaths/min — above critical threshold",
    vitals: { HR: "104 bpm", TEMP: "38.9 °C", RR: "28 /min" },
    time: "14 min ago",
  },
  {
    id: 5,
    patient: "Alinafe Chirwa",
    initials: "AC",
    ward: "Ward 4 · Bed 9",
    severity: "warning",
    message: "Temperature 38.9 °C — fever detected",
    vitals: { HR: "94 bpm", Temp: "38.9 °C", TEMP: "98%" },
    time: "22 min ago",
  },
  {
    id: 6,
    patient: "Buyani Tembo",
    initials: "BT",
    ward: "Ward 2 · Bed 3",
    severity: "info",
    message: "Sensor disconnect on wrist node — re-attach recommended",
    vitals: { HR: "—", TEMP: "38.5 °C", BP: "—" },
    time: "34 min ago",
  },
  {
    id: 7,
    patient: "Zinenani Msiska",
    initials: "ZM",
    ward: "Ward 1 · Bed 11",
    severity: "warning",
    message: "Irregular heartbeat pattern detected over last 10 min",
    vitals: { HR: "76 bpm", TEMP: "38.5 °C", BP: "132/84" },
    time: "41 min ago",
  },
  {
    id: 8,
    patient: "Gracious Nkhoma",
    initials: "GN",
    ward: "Ward 3 · Bed 6",
    severity: "resolved",
    message: "Low TEMP alert resolved — patient stabilised",
    vitals: { HR: "78 bpm", TEMP: "38.5 °C", BP: "118/76" },
    time: "1 hr ago",
  },
  {
    id: 9,
    patient: "Treza Kamanga",
    initials: "TK",
    ward: "Ward 4 · Bed 1",
    severity: "info",
    message: "Battery level on body sensor below 15%",
    vitals: { HR: "82 bpm", TEMP: "38.5 °C", BP: "120/78" },
    time: "1 hr ago",
  },
  {
    id: 10,
    patient: "Feston Lungu",
    initials: "FL",
    ward: "ICU · Bed 5",
    severity: "resolved",
    message: "Tachycardia resolved — HR returned to normal range",
    vitals: { HR: "80 bpm", TEMP: "38.5 °C", BP: "126/80" },
    time: "2 hr ago",
  },
];

const FILTERS = ["all", "critical", "warning", "info", "resolved"];

const Alerts = () => {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const stats = useMemo(
    () => ({
      critical: alerts.filter((a) => a.severity === "critical").length,
      warning: alerts.filter((a) => a.severity === "warning").length,
      info: alerts.filter((a) => a.severity === "info").length,
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

  const acknowledge = (id) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, severity: "resolved", time: "just now" } : a,
      ),
    );
  };

  return (
    <div className="space-y-6">
      {/* heading */}
      <Heading
        title={"Alerts"}
        subtitle={"Monitor and manage patient alerts in real-time"}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Critical alerts",
            value: stats.critical,
            color: "text-danger-a0",
          },
          { label: "Warnings", value: stats.warning, color: "text-warning-a0" },
          { label: "Info", value: stats.info, color: "text-primary-a20" },
          {
            label: "Resolved today",
            value: stats.resolved,
            color: "text-success-a0",
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
            className="pl-9 pr-4 py-2 text-20 w-full border border-surface-a30 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-a20 focus:border-primary-a20"
          />
        </div>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-sm  px-3 py-2 rounded-md border transition-colors duration-150 capitalize ${
              filter === f
                ? "bg-primary-a20/10 font-medium text-primary-a20 border-primary-a20/30"
                : "bg-transparent text-dark-a0/60 border-surface-a30 hover:bg-surface-a20"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Alert cards */}
      <div className="space-y-3">
        {visible.length === 0 && (
          <p className="text-center text-sm text-dark-a0/50 py-12">
            No alerts match your filter.
          </p>
        )}
        {visible.map((alert) => {
          const s = SEVERITY_STYLES[alert.severity];
          return (
            <div
              key={alert.id}
              className={`flex items-start gap-4 bg-white border border-surface-a30 rounded-lg p-4 ${s.card}`}
            >
              {/* Avatar */}
              {/* <div
                className={`size-10 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${s.avatar}`}
              >
                {alert.initials}
              </div> */}

              {/* Body */}
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
                  <span className="text-xs text-dark-a0/50">{alert.ward}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 shrink-0">
                {alert.severity === "resolved" ? (
                  <span className="text-xs text-dark-a0/40 px-3 py-1.5 border border-surface-a30 rounded-md">
                    Resolved
                  </span>
                ) : (
                  <button
                    onClick={() => acknowledge(alert.id)}
                    className="text-xs font-medium px-3 py-1.5 rounded-md bg-primary-a20/10 text-primary-a20 border border-primary-a20/30 hover:bg-primary-a20/20 transition-colors duration-150 cursor-pointer"
                  >
                    Acknowledge
                  </button>
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

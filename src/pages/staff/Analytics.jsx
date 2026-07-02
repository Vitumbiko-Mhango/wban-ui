import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Download,
  HeartPulse,
  RefreshCw,
  Thermometer,
  Users,
  Wifi,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import DashboardCard from "../../components/DashboardCard";
import Button from "../../components/common/Button";
import Heading from "../../components/common/Heading";
import client from "../../api/client";

const EMPTY_ANALYTICS = {
  patients: {
    total: 0,
    active: 0,
    discharged: 0,
    critical: 0,
    warning: 0,
    stable: 0,
    by_ward: [],
    by_gender: [],
  },
  readings: {
    avg_heart_rate: 0,
    avg_temperature: 0,
    avg_spo2: 0,
    falls_today: 0,
  },
  alerts: {
    total: 0,
    unresolved: 0,
    resolved: 0,
    critical: 0,
    warning: 0,
    normal: 0,
    by_type: [],
    by_severity: [],
  },
  devices: {
    total: 0,
    online: 0,
    offline: 0,
    faulty: 0,
  },
  daily_readings: [],
  daily_alerts: [],
};

const TYPE_COLORS = ["#0f766e", "#2563eb", "#0891b2", "#16a34a", "#dc2626"];
const SEVERITY_COLORS = {
  critical: "#dc2626",
  warning: "#d97706",
  normal: "#16a34a",
};
const GENDER_COLORS = ["#2563eb", "#0f766e", "#d97706"];
const CHART_COLORS = {
  primary: "#0f766e",
  secondary: "#2563eb",
  success: "#16a34a",
  warning: "#d97706",
  danger: "#dc2626",
  grid: "#d8e5e1",
};

const formatLabel = (value = "") =>
  String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getAlertTypeName = (item) =>
  item.alert_type_display ||
  item.alert_type_name ||
  item.alert_type ||
  item.type_name ||
  item.type ||
  item.name ||
  item.label ||
  item.value ||
  "Unknown Alert";

const shortDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const ChartPanel = ({ title, subtitle, children }) => (
  <section className="rounded-lg border border-surface-a30 bg-surface-a0 p-4 shadow-sm transition-shadow hover:shadow-md">
    <div className="mb-4 border-l-4 border-primary-a20 pl-3">
      <h2 className="text-sm font-bold text-dark-a0">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-dark-a0/45">{subtitle}</p>}
    </div>
    <div className="h-72">{children}</div>
  </section>
);

const EmptyChart = ({ message = "No data available yet." }) => (
  <div className="flex h-full items-center justify-center rounded-md border border-dashed border-surface-a30 bg-surface-a10 text-sm text-dark-a0/45">
    {message}
  </div>
);

const renderSliceLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  payload,
  value,
  activeName,
}) => {
  if (!value) return null;

  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
  const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);
  const sliceName = payload?.name;
  const isActive = activeName === sliceName;
  const isDimmed = activeName && !isActive;

  return (
    <text
      x={x}
      y={y}
      fill="#ffffff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={isActive ? 16 : 13}
      fontWeight={isActive ? 800 : 700}
      opacity={isDimmed ? 0.45 : 1}
    >
      {payload?.percent ?? 0}%
    </text>
  );
};

const ClickableLegend = ({ payload = [], activeName, onSelect }) => (
  <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
    {payload.map((entry) => {
      const isActive = activeName === entry.value;
      const isDimmed = activeName && !isActive;
      const value = entry.payload?.value;

      return (
        <li key={entry.value}>
          <button
            type="button"
            onClick={() => onSelect(isActive ? null : entry.value)}
            className={`inline-flex items-center gap-1.5 rounded px-2 py-1 font-medium transition ${
              isActive ? "bg-surface-a20 text-dark-a0" : "text-dark-a0/65 hover:bg-surface-a10"
            } ${isDimmed ? "opacity-45" : ""}`}
          >
            <span className="size-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span>{entry.value}</span>
            {value !== undefined && <span className="font-bold">({value})</span>}
          </button>
        </li>
      );
    })}
  </ul>
);

const InteractivePieChart = ({
  data,
  colors,
  activeName,
  onActiveNameChange,
  innerRadius = 0,
  outerRadius = 90,
}) => {
  if (!data.length) return <EmptyChart />;

  return (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie
        data={data}
        dataKey="value"
        nameKey="name"
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        label={(props) => renderSliceLabel({ ...props, activeName })}
        labelLine={false}
      >
        {data.map((entry, index) => {
          const isActive = activeName === entry.name;
          const isDimmed = activeName && !isActive;
          const fill =
            typeof colors === "function" ? colors(entry, index) : colors[index % colors.length];

          return (
            <Cell
              key={entry.name}
              fill={fill}
              fillOpacity={isDimmed ? 0.3 : 1}
              stroke={isActive ? "#000000" : "#ffffff"}
              strokeWidth={isActive ? 3 : 1}
            />
          );
        })}
      </Pie>
      <Tooltip />
      <Legend
        content={(props) => (
          <ClickableLegend
            payload={props.payload}
            activeName={activeName}
            onSelect={onActiveNameChange}
          />
        )}
      />
    </PieChart>
  </ResponsiveContainer>
  );
};

const VitalsCard = ({ label, value, unit, Icon: VitalsIcon, iconClass }) => (
  <div className="rounded-lg border border-surface-a30 bg-surface-a0 p-3 shadow-sm transition-shadow hover:border-primary-a20/30 hover:shadow-md">
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-dark-a0/50">{label}</p>
        <p className="mt-1 text-xl font-bold text-dark-a0">
          {value}
          {unit && <span className="ml-1 text-sm font-medium text-dark-a0/45">{unit}</span>}
        </p>
      </div>
      {React.createElement(VitalsIcon, {
        className: `size-6 shrink-0 ${iconClass}`,
      })}
    </div>
  </div>
);

const withPercent = (items) => {
  const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0);
  return items.map((item) => ({
    ...item,
    percent: total ? Math.round((Number(item.value || 0) / total) * 100) : 0,
  }));
};

const Analytics = ({
  title = "Analytics & Reports",
  subtitle = "Patient statistics, alert trends, vitals averages and exportable reports.",
  dashboardLinks,
}) => {
  const [analytics, setAnalytics] = useState(EMPTY_ANALYTICS);
  const [summary, setSummary] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState("");
  const [activeTypeSlice, setActiveTypeSlice] = useState(null);
  const [activeSeveritySlice, setActiveSeveritySlice] = useState(null);
  const [activeGenderSlice, setActiveGenderSlice] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setIsRefreshing(true);
    setError("");

    try {
      const [analyticsResponse, statsResponse] = await Promise.all([
        client.get("/analytics/"),
        client.get("/dashboard/stats/"),
      ]);

      setAnalytics({ ...EMPTY_ANALYTICS, ...analyticsResponse.data });
      setSummary(statsResponse.data);
      setLastUpdated(new Date());
    } catch {
      setAnalytics(EMPTY_ANALYTICS);
      setSummary(null);
      setError("Could not load live analytics from the backend.");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const stats = useMemo(
    () => ({
      totalPatients: summary?.total_patients ?? analytics.patients?.total ?? 0,
      activePatients: summary?.active_patients ?? analytics.patients?.active ?? 0,
      totalAlerts:
        summary?.total_alerts_last_30_days ??
        summary?.total_alerts ??
        analytics.alerts?.total_last_30_days ??
        analytics.daily_alerts?.reduce((sum, item) => sum + Number(item.count || 0), 0) ??
        0,
      devicesOnline:
        summary?.active_monitors ??
        summary?.devices_online ??
        analytics.devices?.online ??
        0,
      totalDevices: summary?.total_devices ?? analytics.devices?.total ?? 0,
    }),
    [analytics, summary],
  );

  const typeData = withPercent(
    (analytics.alerts?.by_type || []).map((item) => ({
      name: formatLabel(getAlertTypeName(item)),
      value: item.count,
    })),
  );

  const severityData = withPercent(
    (analytics.alerts?.by_severity || []).map((item) => ({
      name: formatLabel(item.severity),
      value: item.count,
      severity: item.severity,
    })),
  );

  const genderData = withPercent(
    (analytics.patients?.by_gender || []).map((item) => ({
      name: formatLabel(item.gender),
      value: item.count,
    })),
  );

  const exportOptions = [
    { label: "Export Patients CSV", url: "/export/patients/csv/", filename: "patients.csv" },
    { label: "Export Patients PDF", url: "/export/patients/pdf/", filename: "patients.pdf" },
    { label: "Export Alerts CSV", url: "/export/alerts/csv/", filename: "alerts.csv" },
    { label: "Export Alerts PDF", url: "/export/alerts/pdf/", filename: "alerts.pdf" },
  ];

  const cardLinks = {
    totalPatients: "/staff/patients",
    activePatients: "/staff/patients?view=active",
    alerts: "/staff/alerts",
    devices: "/staff/live-monitoring",
    ...dashboardLinks,
  };

  const handleExport = async (url, filename) => {
    setExportOpen(false);
    const response = await client.get(url, { responseType: "blob" });
    const blob = response.data;
    const link = document.createElement("a");
    const objectUrl = URL.createObjectURL(blob);
    link.href = objectUrl;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(objectUrl);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Heading
            title={title}
            subtitle={subtitle}
          />
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-dark-a0/50">
            <span>
              Last updated:{" "}
              {lastUpdated
                ? lastUpdated.toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "Not refreshed yet"}
            </span>
            <button
              type="button"
              onClick={fetchAnalytics}
              className="inline-flex items-center gap-1 font-medium text-primary-a20 hover:text-primary-a30"
            >
              <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="relative">
          <Button iconLeft={Download} onClick={() => setExportOpen((prev) => !prev)}>
            Export
          </Button>
          {exportOpen && (
            <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-md border border-surface-a30 bg-surface-a0 shadow-lg">
              {exportOptions.map((option) => (
                <button
                  key={option.filename}
                  type="button"
                  onClick={() => handleExport(option.url, option.filename)}
                  className="block w-full px-4 py-2 text-left text-sm text-dark-a0 hover:bg-surface-a10"
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-warning-a10 bg-warning-a20 px-4 py-3 text-sm text-warning-a0">
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="Total Patients"
          total={stats.totalPatients}
          Icon={Users}
          iconClass="text-primary-a20 bg-primary-a20/10"
          subtitle="Open registry"
          to={cardLinks.totalPatients}
          compact
        />
        <DashboardCard
          title="Active Patients"
          total={stats.activePatients}
          Icon={Activity}
          iconClass="text-success-a10 bg-success-a20"
          subtitle="Currently admitted"
          to={cardLinks.activePatients}
          compact
        />
        <DashboardCard
          title="Alerts 30 Days"
          total={stats.totalAlerts}
          Icon={AlertTriangle}
          iconClass="text-warning-a10 bg-warning-a20"
          subtitle="Review alerts"
          to={cardLinks.alerts}
          compact
        />
        <DashboardCard
          title="Devices Online"
          total={
            stats.totalDevices
              ? `${stats.devicesOnline}/${stats.totalDevices}`
              : stats.devicesOnline
          }
          Icon={Wifi}
          iconClass="text-info-a10 bg-info-a20"
          subtitle="Live monitoring"
          to={cardLinks.devices}
          compact
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartPanel
          title="Daily Readings"
          subtitle="Sensor reading volume over the last 7 days"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.daily_readings}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis dataKey="date" tickFormatter={shortDate} />
              <YAxis />
              <Tooltip labelFormatter={shortDate} />
              <Bar dataKey="count" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel
          title="Daily Alerts"
          subtitle="Clinical alert volume over the last 7 days"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.daily_alerts}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis dataKey="date" tickFormatter={shortDate} />
              <YAxis />
              <Tooltip labelFormatter={shortDate} />
              <Line
                type="monotone"
                dataKey="count"
                stroke={CHART_COLORS.danger}
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartPanel title="Alerts by Type" subtitle="Distribution of triggered alert categories">
          <InteractivePieChart
            data={typeData}
            colors={TYPE_COLORS}
            activeName={activeTypeSlice}
            onActiveNameChange={setActiveTypeSlice}
          />
        </ChartPanel>

        <ChartPanel title="Alerts by Severity" subtitle="Severity mix with percentage labels">
          <InteractivePieChart
            data={severityData}
            colors={(entry) => SEVERITY_COLORS[entry.severity] || CHART_COLORS.primary}
            activeName={activeSeveritySlice}
            onActiveNameChange={setActiveSeveritySlice}
            innerRadius={58}
            outerRadius={92}
          />
        </ChartPanel>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <VitalsCard
          label="Average Heart Rate"
          value={analytics.readings?.avg_heart_rate ?? 0}
          unit="bpm"
          Icon={HeartPulse}
          iconClass="text-danger-a10"
        />
        <VitalsCard
          label="Average Temperature"
          value={analytics.readings?.avg_temperature ?? 0}
          unit="C"
          Icon={Thermometer}
          iconClass="text-warning-a10"
        />
        <VitalsCard
          label="Average SpO2"
          value={analytics.readings?.avg_spo2 ?? analytics.readings?.avg_spo2_percent ?? 0}
          unit="%"
          Icon={Activity}
          iconClass="text-info-a10"
        />
        <VitalsCard
          label="Total Falls Today"
          value={analytics.readings?.falls_today ?? 0}
          Icon={AlertTriangle}
          iconClass="text-danger-a10"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartPanel title="Patients by Ward" subtitle="Current ward distribution">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={analytics.patients?.by_ward || []}
              layout="vertical"
              margin={{ left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis type="number" />
              <YAxis type="category" dataKey="ward" width={95} />
              <Tooltip />
              <Bar dataKey="count" fill={CHART_COLORS.success} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Patients by Gender" subtitle="Patient demographic split">
          <InteractivePieChart
            data={genderData}
            colors={GENDER_COLORS}
            activeName={activeGenderSlice}
            onActiveNameChange={setActiveGenderSlice}
            innerRadius={58}
            outerRadius={92}
          />
        </ChartPanel>
      </div>
    </div>
  );
};

export default Analytics;
